<?php

use App\Http\Controllers\Api\StudentApiController;
use App\Http\Controllers\StudentPrintStatusExportController;
use App\Http\Controllers\StudentYearLevelSyncController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'check.role:admin|super admin'])->group(function () {

    Route::get('/api/student/filterPaginate', [StudentApiController::class, 'filterPaginate'])->name('filter.paginate');
    Route::get('/api/student/filterPaginateReplacement', [StudentApiController::class, 'filterPaginateReplacement'])->name('filter.paginate.replacements');

    Route::get('/api/student-chart', [StudentApiController::class, 'studentsChart']);
    Route::get('/api/dashboard-chart', [StudentApiController::class, 'dashboardChart']);

    Route::get('/api/student/{id}', [StudentApiController::class, 'getStudentById'])->name('get.student');
    Route::get('/api/students', [StudentApiController::class, 'getStudentByIds'])->name('get.students');

    Route::get('/gdrive-image/{fileId}', [StudentApiController::class, 'image'])
        ->name('gdrive.image');
    Route::get('/api/export-status', [StudentPrintStatusExportController::class, 'export'])
        ->name('api.export.status');

    Route::post('/api/student/sync-year-level', [StudentYearLevelSyncController::class, 'sync'])
        ->name('api.student.sync-year-level');
});

Route::post('/api/student/status/{id_number}/{last_name}', [StudentApiController::class, 'checkStatus'])->name('api.student.status');

Route::middleware(['auth', 'check.role:super admin'])->group(function () {

    Route::get('/students/audit/unenrolled', function (Request $request) {
        $AUDIT_CAMPUS_CONNECTIONS = [
            'Talisay' => 'tal_mysql',
            'Alijis' => 'ali_mysql',
            'Fortune Towne' => 'ft_mysql',
            'Binalbagan' => 'bin_mysql',
        ];
        $validated = $request->validate([
            'campus' => ['required', 'string', 'in:' . implode(',', array_keys($AUDIT_CAMPUS_CONNECTIONS))],
            'status' => ['nullable', 'string', 'in:pending,printed'],
        ]);

        $campus = $validated['campus'];
        $status = $validated['status'] ?? null;
        $connection = $AUDIT_CAMPUS_CONNECTIONS[$campus];
        $schoolYear = now()->year;

        $isConnectionError = function (Throwable $e): bool {
            if ($e instanceof \PDOException) {
                return true;
            }

            if ($e instanceof \Illuminate\Database\QueryException) {
                return true;
            }

            if ($e instanceof \InvalidArgumentException && str_contains($e->getMessage(), 'Database connection')) {
                return true;
            }

            return false;
        };

        // "Last, First M. Suffix"
        $formatFullName = function ($row): string {
            $middle = trim((string) $row->middle_init);
            if ($middle !== '' && !str_ends_with($middle, '.')) {
                $middle .= '.';
            }

            $given = trim(implode(' ', array_filter([
                trim((string) $row->first_name),
                $middle,
                trim((string) $row->suffix),
            ], fn($part) => $part !== '')));

            $last = trim((string) $row->last_name);

            return trim($last !== '' && $given !== '' ? "{$last}, {$given}" : $last . $given);
        };

        try {
            // Set 1: every id_number that exists in `student` at all,
            // regardless of curriculum/program linkage.
            $existsInSis = DB::connection($connection)
                ->table('student')
                ->select('student_id', 'student_lastname', 'student_firstname')
                ->get()
                ->keyBy(fn($row) => trim((string) $row->student_id));

            // Set 2: id_numbers that survive the full curriculum -> program
            // join chain (same joins as the export's base population query).
            $passesCurriculumJoin = DB::connection($connection)
                ->table('student')
                ->join('curriculum_major', 'student.curriculum_major_id', '=', 'curriculum_major.curriculum_major_id')
                ->join('curriculum', 'curriculum_major.curriculum_id', '=', 'curriculum.curriculum_id')
                ->join('program', 'curriculum.program_code', '=', 'program.program_code')
                ->select('student.student_id')
                ->get()
                ->pluck('student_id')
                ->map(fn($id) => trim((string) $id))
                ->flip();

            // Set 3: id_numbers with a student_load row for the current
            // school year, joined all the way to section (same as the
            // export's enrollment query).
            $enrolledThisSY = DB::connection($connection)
                ->table('student_load')
                ->join('class', 'student_load.class_code', '=', 'class.class_code')
                ->join('section', 'class.section_id', '=', 'section.section_id')
                ->where('class.school_year', $schoolYear)
                ->select('student_load.student_id')
                ->distinct()
                ->get()
                ->pluck('student_id')
                ->map(fn($id) => trim((string) $id))
                ->flip();

            // Local population to audit — on the LOCAL (default) connection,
            // not the SIS one. Same LEFT JOIN ... IS NULL / IS NOT NULL shape
            // as the raw SQL this route is meant to reconcile against.
            $localQuery = DB::table('students')
                ->leftJoin('printed_students', 'printed_students.id_number', '=', 'students.id_number')
                ->where('students.campus', $campus)
                ->select(
                    'students.id_number',
                    'students.first_name',
                    'students.middle_init',
                    'students.last_name',
                    'students.suffix'
                );

            if ($status === 'pending') {
                $localQuery->whereNull('printed_students.id_number');
            } elseif ($status === 'printed') {
                $localQuery->whereNotNull('printed_students.id_number');
            }

            // Keyed by trimmed id_number (dedupes, keeps the local name row).
            $localStudents = $localQuery
                ->get()
                ->keyBy(fn($row) => trim((string) $row->id_number));
        } catch (Throwable $e) {
            if ($isConnectionError($e)) {
                Log::error("Enrollment audit: could not connect to SIS database for campus [{$campus}] (connection: {$connection})", [
                    'campus' => $campus,
                    'connection' => $connection,
                    'exception' => $e->getMessage(),
                ]);

                return response()->json([
                    'error' => 'connection_failed',
                    'message' => "Couldn't connect to the {$campus} campus SIS database. Please try again shortly.",
                ], 503);
            }

            Log::error("Enrollment audit: unexpected error fetching data for campus [{$campus}]", [
                'campus' => $campus,
                'connection' => $connection,
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'fetch_failed',
                'message' => 'Something went wrong while gathering student data for this audit. Please try again.',
            ], 500);
        }

        $reasonLabels = [
            'not_in_sis' => 'Not in SIS',
            'broken_curriculum_link' => 'Broken curriculum link',
            'no_current_load' => 'No current load',
        ];

        $rows = [];

        foreach ($localStudents as $idNumber => $localRow) {
            $inSis = $existsInSis->has($idNumber);
            $curriculumOk = $passesCurriculumJoin->has($idNumber);
            $loadOk = $enrolledThisSY->has($idNumber);

            if ($inSis && $curriculumOk && $loadOk) {
                continue; // fully enrolled — not what we're hunting for
            }

            $reason = match (true) {
                !$inSis => 'not_in_sis',
                !$curriculumOk => 'broken_curriculum_link',
                default => 'no_current_load',
            };

            $sisRow = $existsInSis->get($idNumber);

            $rows[] = [
                $idNumber,
                $formatFullName($localRow),
                $reasonLabels[$reason],
                $sisRow->student_lastname ?? '',
                $sisRow->student_firstname ?? '',
            ];
        }

        $export = new class ($rows) implements
        \Maatwebsite\Excel\Concerns\FromArray,
        \Maatwebsite\Excel\Concerns\WithHeadings,
        \Maatwebsite\Excel\Concerns\ShouldAutoSize,
        \Maatwebsite\Excel\Concerns\WithColumnFormatting {
            public function __construct(private array $rows)
            {}

            public function array(): array
            {
                return $this->rows;
            }

            public function headings(): array
            {
                return ['ID Number', 'Full Name', 'Reason', 'SIS Last Name', 'SIS First Name'];
            }

            public function columnFormats(): array
            {
                // Keep ID numbers as text so leading zeros aren't dropped.
                return ['A' => \PhpOffice\PhpSpreadsheet\Style\NumberFormat::FORMAT_TEXT];
            }
        };

        $filename = sprintf(
            'unenrolled-%s-%s-%d.xlsx',
            \Illuminate\Support\Str::slug($campus),
            $status ?? 'all',
            $schoolYear
        );

        return \Maatwebsite\Excel\Facades\Excel::download($export, $filename);
    });

    Route::get('/students/audit/find-campus', function (Request $request): JsonResponse {
        $validated = $request->validate([
            'id_number' => ['nullable', 'string'],
            'last_name' => ['nullable', 'string'],
        ]);

        $idNumber = isset($validated['id_number']) ? trim($validated['id_number']) : null;
        $lastName = isset($validated['last_name']) ? trim($validated['last_name']) : null;

        if (!$idNumber && !$lastName) {
            return response()->json([
                'error' => 'missing_search_term',
                'message' => 'Provide at least one of id_number or last_name.',
            ], 422);
        }

        $campusConnections = [
            'Talisay' => 'tal_mysql',
            'Alijis' => 'ali_mysql',       // placeholder — confirm actual connection name
            'Fortune Towne' => 'ft_mysql',
            'Binalbagan' => 'bin_mysql',   // placeholder — confirm actual connection name
        ];

        // 1. What does the LOCAL students table say? Same dual search — by
        // id_number if given, by last_name (LIKE) if given, matching both when
        // both are present.
        $localQuery = DB::table('students')->select('id_number', 'campus', 'last_name', 'created_at');

        if ($idNumber) {
            $localQuery->where('id_number', $idNumber);
        }

        if ($lastName) {
            $localQuery->where('last_name', 'like', '%' . $lastName . '%');
        }

        $localRecords = $localQuery->get();

        // 2. Check every campus SIS connection for matching student row(s).
        $foundIn = [];
        $connectionErrors = [];

        foreach ($campusConnections as $campusName => $connection) {
            try {
                $sisQuery = DB::connection($connection)
                    ->table('student')
                    ->select('student_id', 'student_lastname', 'student_firstname', 'student_middlename', 'curriculum_major_id');

                if ($idNumber) {
                    $sisQuery->where('student_id', $idNumber);
                }

                if ($lastName) {
                    $sisQuery->where('student_lastname', 'like', '%' . $lastName . '%');
                }

                $sisRows = $sisQuery->get();

                foreach ($sisRows as $sisRow) {
                    $studentId = trim((string) $sisRow->student_id);

                    // Also check whether this student resolves through the
                    // curriculum -> program join chain on this connection, and
                    // whether they have a current-school-year load — same
                    // checks as the unenrolled-audit route, just scoped to one
                    // student instead of the whole campus.
                    $resolvesProgram = DB::connection($connection)
                        ->table('student')
                        ->join('curriculum_major', 'student.curriculum_major_id', '=', 'curriculum_major.curriculum_major_id')
                        ->join('curriculum', 'curriculum_major.curriculum_id', '=', 'curriculum.curriculum_id')
                        ->join('program', 'curriculum.program_code', '=', 'program.program_code')
                        ->where('student.student_id', $studentId)
                        ->exists();

                    $hasCurrentLoad = DB::connection($connection)
                        ->table('student_load')
                        ->join('class', 'student_load.class_code', '=', 'class.class_code')
                        ->where('student_load.student_id', $studentId)
                        ->where('class.school_year', now()->year)
                        ->exists();

                    $foundIn[] = [
                        'campus' => $campusName,
                        'connection' => $connection,
                        'sis_student_id' => $studentId,
                        'sis_lastname' => $sisRow->student_lastname,
                        'sis_firstname' => $sisRow->student_firstname,
                        'sis_middlename' => $sisRow->student_middlename,
                        'resolves_curriculum_program' => $resolvesProgram,
                        'has_current_school_year_load' => $hasCurrentLoad,
                    ];
                }
            } catch (Throwable $e) {
                $connectionErrors[$campusName] = $e->getMessage();
            }
        }

        return response()->json([
            'search' => [
                'id_number' => $idNumber,
                'last_name' => $lastName,
            ],
            'local_records' => $localRecords->map(fn($r) => [
                'id_number' => $r->id_number,
                'campus' => $r->campus,
                'last_name' => $r->last_name,
                'created_at' => $r->created_at,
            ]),
            'local_records_count' => $localRecords->count(),
            'found_in_sis' => $foundIn,
            'found_in_sis_count' => count($foundIn),
            'connection_errors' => $connectionErrors ?: null,
        ]);
    });
});