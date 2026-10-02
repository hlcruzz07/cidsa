<?php

namespace App\Repositories;

use App\Enums\UserCampus;
use App\Models\PrintedStudents;
use App\Models\Student;
use App\Models\StudentChangeLog;
use App\Models\StudentReplacement;
use App\Services\GoogleDriveService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StudentRepository
{
    public array $paths = [
        'Talisay' => [
            'picture' => 'pictures',
            'e_signature' => 'signatures',
            'receipt' => 'receipts'
        ],
        'Alijis' => [
            'picture' => 'pictures',
            'e_signature' => 'signatures',
            'receipt' => 'receipts'
        ],
        'Binalbagan' => [
            'picture' => 'pictures',
            'e_signature' => 'signatures',
            'receipt' => 'receipts'
        ],
        'Fortune Towne' => [
            'picture' => 'pictures',
            'e_signature' => 'signatures',
            'receipt' => 'receipts'
        ],
    ];

    /**
     * SIS database connection per campus code (UserCampus values).
     */
    protected const CONNECTIONS = [
        'tal' => 'tal_mysql',
        'ali' => 'ali_mysql',
        'ft' => 'ft_mysql',
        'bin' => 'bin_mysql',
    ];

    public function __construct(protected Student $model, protected GoogleDriveService $googleDriveService, protected PrintedStudents $printedStudents, protected StudentReplacement $studentReplacement)
    {

    }

    /*
    |--------------------------------------------------------------------------
    | Campus helpers
    |--------------------------------------------------------------------------
    | Callers may pass a campus as a code ("ali") or a label ("Alijis").
    | These helpers resolve either form through UserCampus so the rest of
    | the repository never has to care which one it received.
    */

    /**
     * SIS DB connection for a campus given as a code or label.
     */
    protected function connectionFor(string $campus): ?string
    {
        $case = UserCampus::fromLabelOrValue($campus);

        return $case ? (self::CONNECTIONS[$case->value] ?? null) : null;
    }

    /**
     * Campus label as stored in students.campus ("Alijis"), whatever
     * form came in. Falls back to the raw value if it can't be resolved.
     */
    protected function campusLabel(string $campus): string
    {
        return UserCampus::fromLabelOrValue($campus)?->label() ?? $campus;
    }

    /**
     * Apply the students.campus filter to a query. "all" (super admins)
     * means no campus restriction, so the filter is skipped entirely.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     */
    protected function applyCampusFilter($query, string $campus): void
    {
        $case = UserCampus::fromLabelOrValue($campus);

        if ($case === UserCampus::ALL) {
            return;
        }

        $query->where('campus', $case?->label() ?? $campus);
    }

    public function all()
    {
        return $this->model->all();
    }

    public function find(int $id)
    {
        return $this->model->findOrFail((int) $id);
    }

    public function getStudentById(string $id_number, string $campus, string $lname, string $birthdate): ?array
    {
        $connection = $this->connectionFor($campus);

        if (!$connection) {
            return null;
        }

        $student = DB::connection($connection)
            ->table('student')
            ->join('student_load', 'student.student_id', '=', 'student_load.student_id')
            ->join('student_user', 'student_user.student_id', '=', 'student.student_id')
            ->join('class', 'student_load.class_code', '=', 'class.class_code')
            ->join('section', 'class.section_id', '=', 'section.section_id')
            ->join('program', 'section.program_code', '=', 'program.program_code')
            ->leftJoin('curriculum_major', 'student.curriculum_major_id', '=', 'curriculum_major.curriculum_major_id')
            ->where('class.school_year', now()->year)
            ->where('student.student_id', $id_number)
            ->where('student.student_lastname', $lname)
            ->where('student.birthdate', $birthdate)
            ->select(
                'student.student_id',
                'student.student_lastname',
                'student.student_middlename',
                'student.student_firstname',
                'section.yearlevel',
                'section.program_code',
                'program.program_title',
            )
            ->orderByDesc('section.yearlevel')
            ->first();


        if (!$student) {
            return null;
        }

        $suffix = null;
        $firstName = trim($student->student_firstname);

        // Remove commas from the first name
        $firstName = str_replace(',', '', $firstName);

        if (preg_match('/^(.*)\s+(JR\.?|SR\.?|II|III|IV|V)$/i', $firstName, $matches)) {
            $firstName = trim($matches[1]);

            $suffix = strtoupper($matches[2]);

            if (!str_ends_with($suffix, '.')) {
                $suffix .= '.';
            }
        }

        return [
            'id_number' => $student->student_id,
            'first_name' => strtoupper($firstName),
            'middle_init' => $student->student_middlename
                ? strtoupper(substr($student->student_middlename, 0, 1)) . '.'
                : null,
            'last_name' => strtoupper($student->student_lastname),
            'suffix' => $suffix,
            'year' => $this->formatYearLevel($student->yearlevel),
            'campus' => $this->campusLabel($campus),
            'program' => $student->program_title,
        ];
    }

    protected function formatYearLevel(string $yearLevel): string
    {
        switch ($yearLevel) {
            case '1':
                return '1st Year';
            case '2':
                return '2nd Year';
            case '3':
                return '3rd Year';
            case '4':
                return '4th Year';
            case '5':
                return '5th Year';
            default:
                return 'Unknown';
        }
    }

    public function getStudetsByIds(array $ids)
    {
        return $this->model->whereIn('id', $ids)->get();
    }


    public function findByStudentId(string $id_number)
    {
        return $this->model->where('id_number', $id_number)->firstOrFail();
    }

    public function isStudentExisting(
        string $id_number,
        string $campus
    ): bool {
        $connection = $this->connectionFor($campus);

        if (!$connection) {
            return false;
        }

        return DB::connection($connection)
            ->table('student')
            ->where('student_id', $id_number)
            ->exists();
    }

    public function isStudentCompleted(string $id_number): bool
    {
        return $this->model
            ->where('id_number', $id_number)
            ->where('is_completed', true)
            ->exists();
    }

    public function isStudentCompletedById(int $id): bool
    {
        return $this->model
            ->where('id', $id)
            ->where('is_completed', true)
            ->exists();
    }

    public function findStudentByIdNumber(string $id_number)
    {
        return $this->model
            ->where('id_number', $id_number)
            ->firstOrFail();
    }

    public function filterPaginate(array $filters)
    {
        $query = $this->model->query();

        $this->applyCampusFilter($query, $filters['campus']);

        // 🔍 Search
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('id_number', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('suffix', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['type'])) {
            if ($filters['type'] === 'Graduate Studies') {
                $query->where(function ($q) {
                    $q->where('program', 'LIKE', 'Master%')
                        ->orWhere('program', 'LIKE', 'Doctor%')
                        ->orWhere('program', 'LIKE', 'Teacher%');
                });
            } else {
                $query->where('program', 'LIKE', 'Bachelor%');
            }
        }

        if (!empty($filters['college'])) {
            $query->where('college', $filters['college']);
        }

        if (!empty($filters['program'])) {
            $query->where('program', $filters['program']);
        }

        if (!empty($filters['major'])) {
            $query->where('major', $filters['major']);
        }

        if (!empty($filters['year'])) {
            $query->where('year', $filters['year']);
        }
        $isPrinted = $filters['is_printed'] ?? null;
        if (!is_null($isPrinted)) {
            $printed = filter_var($isPrinted, FILTER_VALIDATE_BOOLEAN);
            if ($printed) {
                $query->whereHas('printed');
            } else {
                $query->whereDoesntHave('printed');
            }
        }
        $dateField = in_array($filters['dateField'] ?? null, ['created_at', 'updated_at'], true)
            ? $filters['dateField']
            : 'created_at';

        if (!empty($filters['from']) && !empty($filters['to'])) {
            if ($filters['from'] === $filters['to']) {
                $query->whereDate($dateField, '=', $filters['from']);
            } else {
                $query->whereBetween($dateField, [
                    $filters['from'],
                    $filters['to'],
                ]);
            }
        }

        $sort = $filters['sort'] ?? 'created_at';
        $order = $filters['order'] ?? 'desc';
        $query->orderBy($sort, $order);

        $perPage = $filters['perPage'] ?? 10;

        return $query
            ->withExists('printed')
            ->with(['printed', 'replacements', 'changeLogs', 'notices.user', 'resolvedNotices.user',])
            ->paginate($perPage);
    }

    public function filterPaginateReplacement(array $filters)
    {
        $query = StudentReplacement::query()
            ->with([
                'student.printed',
                'student.changeLogs',
                'student.notices.user:id,name,role',
                'student.resolvedNotices.user:id,name,role',
            ])
            ->whereHas('student', function ($q) use ($filters) {
                // 🏫 Campus — scoped to the student record
                $this->applyCampusFilter($q, $filters['campus']);

                // 🎓 Student type (Graduate / Undergraduate)
                if (!empty($filters['type'])) {
                    if ($filters['type'] === 'Graduate Studies') {
                        $q->where(function ($s) {
                            $s->where('program', 'LIKE', 'Master%')
                                ->orWhere('program', 'LIKE', 'Doctor%')
                                ->orWhere('program', 'LIKE', 'Teacher%');
                        });
                    } else {
                        $q->where('program', 'LIKE', 'Bachelor%');
                    }
                }

                if (!empty($filters['college'])) {
                    $q->where('college', $filters['college']);
                }

                if (!empty($filters['program'])) {
                    $q->where('program', $filters['program']);
                }

                if (!empty($filters['major'])) {
                    $q->where('major', $filters['major']);
                }

                if (!empty($filters['year'])) {
                    $q->where('year', $filters['year']);
                }
            });

        // 🔍 Search — student fields and replacement fields (reason, receipt)
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('student_replacements.reason', 'like', "%{$search}%")
                    ->orWhere('student_replacements.receipt', 'like', "%{$search}%")
                    ->orWhereHas('student', function ($s) use ($search) {
                        $s->where('id_number', 'like', "%{$search}%")
                            ->orWhere('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('suffix', 'like', "%{$search}%");
                    });
            });
        }

        // ❓ Reason filter
        if (!empty($filters['reason'])) {
            $query->where('student_replacements.reason', 'like', "%{$filters['reason']}%");
        }

        // 🖨️ is_printed lives on StudentReplacement itself
        if (!is_null($filters['is_printed'] ?? null)) {
            $query->where(
                'student_replacements.is_printed',
                filter_var($filters['is_printed'], FILTER_VALIDATE_BOOLEAN)
            );
        }

        // 📅 Date range — supports created_at (Date Requested), printed_at (Date Printed), updated_at
        $dateField = in_array($filters['dateField'] ?? null, ['created_at', 'printed_at', 'updated_at'], true)
            ? $filters['dateField']
            : 'created_at';

        if (!empty($filters['from']) && !empty($filters['to'])) {
            if ($filters['from'] === $filters['to']) {
                $query->whereDate("student_replacements.{$dateField}", '=', $filters['from']);
            } else {
                $query->whereBetween("student_replacements.{$dateField}", [
                    $filters['from'],
                    $filters['to'],
                ]);
            }
        }

        // 🔃 Sort
        // Sorting on student columns requires a join; handle both cases cleanly
        $sort = $filters['sort'] ?? 'created_at';
        $order = $filters['order'] ?? 'desc';

        $studentColumns = ['id_number', 'first_name', 'last_name', 'college', 'program', 'year'];

        if (in_array($sort, $studentColumns)) {
            $query->join('students', 'students.id', '=', 'student_replacements.student_id')
                ->orderBy("students.{$sort}", $order)
                ->select('student_replacements.*'); // avoid column ambiguity
        } else {
            $query->orderBy("student_replacements.{$sort}", $order);
        }

        // 📄 Pagination
        $perPage = $filters['perPage'] ?? 10;
        return $query
            ->paginate($perPage)
            ->through(function ($replacement) {
                $replacement->receipt = $replacement->receipt
                    ? route('gdrive.image', [
                        'fileId' => $replacement->receipt,
                    ])
                    : null;

                return $replacement;
            });
    }
    public function filterPaginateAll(array $filters)
    {
        $query = $this->model->query();
        // 🔍 Search
        if (!empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->where('id_number', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('suffix', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['from']) && !empty($filters['to'])) {
            if ($filters['from'] === $filters['to']) {
                $query->whereDate('created_at', '=', $filters['from']);
            } else {
                $query->whereBetween('created_at', [
                    $filters['from'],
                    $filters['to'],
                ]);
            }
        }

        $sort = $filters['sort'] ?? 'id';
        $order = $filters['order'] ?? 'desc';

        $query->orderBy($sort, $order);

        /* 📄 Pagination */
        $perPage = $filters['perPage'] ?? 10;

        return $query->paginate($perPage);
    }

    public function create(array $data)
    {
        $collection = collect($data)->values();

        if ($collection->isEmpty()) {
            return [
                'total_csv_rows' => 0,
                'existing_in_db' => 0,
                'existing_students' => [], // detailed info
                'to_insert' => 0,
                'ignored' => 0,
                'ignored_students' => [], // detailed info
            ];
        }

        // Unique ID numbers from CSV
        $idNumbers = $collection->pluck('id_number')->unique()->values();

        // Existing students in DB
        $existingIds = $this->model
            ->whereIn('id_number', $idNumbers)
            ->pluck('id_number')
            ->toArray();

        // Students to insert vs ignored
        $toInsert = $collection->whereNotIn('id_number', $existingIds)->values();
        $ignored = $collection->whereIn('id_number', $existingIds)->values();

        // Chunk insert (safe for large CSVs)
        $toInsert->chunk(500)->each(function ($chunk) {
            $this->model->insert($chunk->toArray());
        });

        // Prepare detailed info arrays
        $existingStudents = $collection
            ->whereIn('id_number', $existingIds)
            ->map(fn($student) => [
                'id_number' => $student['id_number'],
                'full_name' => trim($student['first_name'] . ' ' . ($student['middle_init'] ?? '') . ' ' . $student['last_name'] . ' ' . ($student['suffix'] ?? ''))
            ])
            ->values();

        $ignoredStudents = $ignored->map(fn($student) => [
            'id_number' => $student['id_number'],
            'full_name' => trim($student['first_name'] . ' ' . ($student['middle_init'] ?? '') . ' ' . $student['last_name'] . ' ' . ($student['suffix'] ?? ''))
        ])->values();

        return [
            'total_csv_rows' => $collection->count(),
            'existing_in_db' => count($existingIds),
            'existing_students' => $existingStudents,
            'to_insert' => $toInsert->count(),
            'ignored' => $ignored->count(),
            'ignored_students' => $ignoredStudents,
        ];
    }

    public function update(array $data, string $student_id)
    {
        $student = $this->findStudentByIdNumber($student_id);
        $id = $student['id'];
        $result = $this->model->findOrFail($id);
        $result->update($data);

        return $result;
    }

    public function updateOrCreate(array $data, string $id_number, bool $disableTimestamps = false): Student
    {
        $student = $this->model->firstOrNew(['id_number' => $id_number]);
        $existed = $student->exists;

        $originalBeforeSave = $existed ? $student->getOriginal() : [];

        $student->fill($data);

        if ($disableTimestamps) {
            $student->timestamps = false;
        }

        $student->save();

        if ($existed) {
            $log = StudentChangeLog::fromChangedStudent($student, $originalBeforeSave);
            $log?->save();
        }

        return $student;
    }



    public function storeFile($file, string $campus, string $typeFolder): array
    {
        return $this->googleDriveService->uploadPicture($file, $campus, $typeFolder);
    }

    //Widgets Data
    public function countStudentsHasUpdatesByCampus(string $campus): int
    {
        $query = $this->model->query()->whereNotNull('updated_at');

        $this->applyCampusFilter($query, $campus);

        return $query->count();
    }


    public function countNewPendingStudentByCampus(string $campus): int
    {
        $query = $this->model->query()->whereDoesntHave('printed');

        $this->applyCampusFilter($query, $campus);

        return $query->count();
    }

    public function countNewPrintedStudentByCampus(string $campus): int
    {
        $query = $this->model->query()->whereHas('printed');

        $this->applyCampusFilter($query, $campus);

        return $query->count();
    }

    public function countReplacementTotalByCampus(string $campus): int
    {
        return $this->studentReplacement
            ->whereHas('student', function ($query) use ($campus) {
                $this->applyCampusFilter($query, $campus);
            })
            ->count();
    }

    public function countReplacementPendingByCampus(string $campus): int
    {
        return $this->studentReplacement
            ->where('is_printed', false)
            ->whereHas('student', function ($query) use ($campus) {
                $this->applyCampusFilter($query, $campus);
            })
            ->count();
    }

    public function countReplacementPrintedByCampus(string $campus): int
    {
        return $this->studentReplacement
            ->where('is_printed', true)
            ->whereHas('student', function ($query) use ($campus) {
                $this->applyCampusFilter($query, $campus);
            })
            ->count();
    }

    public function studentsUpdateChart(string $campus, string $timeRange)
    {
        $now = Carbon::now();
        $startDate = match ($timeRange) {
            'today' => $now->copy()->startOfDay(),
            '7d' => $now->copy()->subDays(7),
            '30d' => $now->copy()->subDays(30),
            '90d' => $now->copy()->subDays(90),
            '180d' => $now->copy()->subDays(180),
            '365d' => $now->copy()->subDays(365),
            default => $now->copy(),
        };

        $query = $this->model->query();

        $this->applyCampusFilter($query, $campus);

        return $query
            ->whereBetween('created_at', [$startDate, $now])
            ->selectRaw('DATE(created_at) as date, college, COUNT(*) as total')
            ->groupBy('date', 'college')
            ->orderBy('date')
            ->orderBy('college')
            ->get();
    }


    public function updateSingleStudent(array $data, int $id)
    {
        $student = $this->model->findOrFail($id);

        $student->timestamps = false;

        $student->update($data);

        return $student;
    }

    public function countStudentUpdatesPerCampus(string $timeRange)
    {
        $now = Carbon::now();

        $startDate = match ($timeRange) {
            '7d' => $now->copy()->subDays(7),
            '30d' => $now->copy()->subDays(30),
            '90d' => $now->copy()->subDays(90),
            default => $now->copy()->subDays(90),
        };

        $students = DB::table('students')
            ->select(
                DB::raw('DATE(created_at) as date'),
                'campus',
                DB::raw('COUNT(*) as total')
            )
            ->where('created_at', '>=', $startDate)
            ->groupBy('date', 'campus')
            ->orderBy('date')
            ->get();

        // Pivot data by date
        $result = [];
        foreach ($students as $row) {
            $date = $row->date;
            if (!isset($result[$date])) {
                $result[$date] = ['date' => $date];
            }

            // Map campus label/code to its canonical code ("Alijis" -> "ali").
            // Resolving through the enum also fixes the old "Fortune Town"
            // typo that made the Fortune Towne series fall through to default.
            $campusKey = UserCampus::fromLabelOrValue($row->campus)?->value
                ?? strtolower($row->campus);

            $result[$date][$campusKey] = $row->total;
        }

        return array_values($result);
    }


    public function countStudentsByCampus(string $campus): int
    {
        $query = $this->model->query();

        $this->applyCampusFilter($query, $campus);

        return $query->count();
    }

    public function setPendingForNew(string $id_number)
    {
        return $this->printedStudents->where('id_number', $id_number)->delete();
    }

    public function setPrintedForNew(string $id_number)
    {
        return $this->printedStudents->firstOrCreate([
            'id_number' => $id_number
        ]);
    }

    public function setPendingForReplacement(int $id)
    {
        $replacement = $this->studentReplacement->findOrFail($id);

        $replacement->update(['is_printed' => false, 'printed_at' => null]);
    }

    public function setPrintedForReplacement(int $id)
    {
        $replacement = $this->studentReplacement->findOrFail($id);

        $replacement->update([
            'is_printed' => true,
            'printed_at' => Carbon::now()
        ]);

        $id_number = $replacement->student->id_number;

        return $this->printedStudents->firstOrCreate([
            'id_number' => $id_number,
        ]);
    }


    public function getStudentByIds(array $ids)
    {
        $students = $this->model->whereIn('id_number', $ids)->get();

        $students->transform(function ($student) {
            $student->picture = $student->picture
                ? route('gdrive.image', ['fileId' => $student->picture])
                : null;

            $student->e_signature = $student->e_signature
                ? route('gdrive.image', ['fileId' => $student->e_signature])
                : null;

            return $student;
        });

        return $students;
    }

}