<?php
use App\Http\Controllers\CampusRouteController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\StudentController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

Route::get('/api/students/print-status/export', function (Request $request) {

    $connection = 'tal_mysql';
    $campus = 'Talisay'; // must match the value stored in students.campus for this connection
    $schoolYear = 2026;

    $formatName = function (?string $last, ?string $first, ?string $middle) {
        $middleInitial = $middle ? Str::upper(Str::substr(trim($middle), 0, 1)) . '.' : '';

        return trim(collect([trim((string) $last) . ',', trim((string) $first), $middleInitial])->filter()->implode(' '));
    };

    // Normalizes any string for case/whitespace-insensitive comparison —
    // trims, collapses internal repeated whitespace, and uppercases.
    $normalize = fn(?string $value) => $value === null
        ? null
        : Str::upper(preg_replace('/\s+/', ' ', trim($value)));

    // 0. Single source of truth for code -> description, used for the
    // sheet grouping below.
    $collegeDescByCode = DB::connection($connection)
        ->table('college')
        ->pluck('college_desc', 'college_code'); // ['CAS' => 'College of Arts and Sciences', ...]

    // 1. Full SIS enrollment roster for this campus/school year.
    $sisRows = DB::connection($connection)
        ->table('student')
        ->join('student_load', 'student.student_id', '=', 'student_load.student_id')
        ->join('class', 'student_load.class_code', '=', 'class.class_code')
        ->join('section', 'class.section_id', '=', 'section.section_id')
        ->join('program', 'section.program_code', '=', 'program.program_code')
        ->where('class.school_year', $schoolYear)
        ->select(
            'student.student_id',
            'student.student_lastname',
            'student.student_firstname',
            'student.student_middlename',
            'section.yearlevel',
            'section.section_code',
            'program.program_title',
            'program.college_code',
        )
        ->orderByDesc('section.yearlevel')
        ->get();

    // Keep only the highest year-level row per student.
    $sisByStudentId = [];
    foreach ($sisRows->groupBy(fn($row) => trim((string) $row->student_id)) as $studentId => $studentRows) {
        $sisByStudentId[$studentId] = $studentRows->first();
    }

    // 2. Local CIDSA requests for this campus.
    $localByIdNumber = Student::query()
        ->select(['id', 'id_number', 'college', 'created_at'])
        ->where('campus', $campus)
        ->with(['printed:id_number,created_at'])
        ->get()
        ->keyBy(fn(Student $s) => trim((string) $s->id_number));

    // 3. Build one row per SIS-enrolled student, cross-checked against local data.
    $data = collect($sisByStudentId)->map(function ($sis, $studentId) use ($localByIdNumber, $collegeDescByCode, $formatName, $normalize) {
        $local = $localByIdNumber->get($studentId);

        if (!$local) {
            $status = 'No Data';
            $dateSubmitted = null;
            $datePrinted = null;
        } else {
            $printed = $local->printed;
            $status = $printed ? 'Printed' : 'Pending';
            $dateSubmitted = $local->created_at?->format('Y-m-d H:i:s');
            $datePrinted = $printed?->created_at?->format('Y-m-d H:i:s');
        }

        $collegeCode = $local?->college
            ? trim(Str::upper($local->college))
            : trim(Str::upper((string) $sis->college_code));

        $college = $collegeDescByCode->get($collegeCode) ?? 'Unassigned';

        return [
            'student_id' => $studentId,
            'last_name' => $sis->student_lastname,
            'full_name' => $formatName($sis->student_lastname, $sis->student_firstname, $sis->student_middlename),
            'program' => trim((string) $sis->program_title) ?: 'Unassigned',
            'program_key' => $normalize($sis->program_title) ?: 'UNASSIGNED', // grouping key, case/space-insensitive
            'year_level' => $sis->yearlevel,
            'section' => $sis->section_code,
            'college' => $college,
            'status' => $status,
            'date_submitted' => $dateSubmitted,
            'date_printed' => $datePrinted,
        ];
    })->values();

    // 4. Sort by program, then section, then lastname before splitting into sheets.
    $data = $data->sortBy([
        ['program_key', 'asc'],
        ['year_level', 'asc'],
        ['section', 'asc'],
        ['last_name', 'asc'],
    ])->values();

    // Sheets are per PROGRAM, grouped on the normalized key so a stray
    // extra space or different casing doesn't split one program in two.
    $byProgram = $data->groupBy('program_key');

    $spreadsheet = new Spreadsheet();
    $spreadsheet->removeSheetByIndex(0);

    $headers = ['ID Number', 'Full Name', 'Year Level', 'Section', 'Status', 'Date Submitted', 'Date Printed'];

    foreach ($byProgram as $programKey => $programRows) {
        // Use the first row's original (properly-cased) title for display.
        $programTitle = $programRows->first()['program'];

        $sheet = $spreadsheet->createSheet();

        $sheetTitle = Str::limit(preg_replace('/[\\\\\/\?\*\[\]:]/', '', $programTitle), 31, '');
        $sheet->setTitle($sheetTitle);

        $sheet->fromArray($headers, null, 'A1');
        $sheet->getStyle('A1:G1')->getFont()->setBold(true);
        $sheet->getStyle('A1:G1')->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setRGB('DDDDDD');

        $rowNum = 2;
        foreach ($programRows as $row) {
            $sheet->fromArray([
                $row['student_id'],
                $row['full_name'],
                $row['year_level'],
                $row['section'],
                $row['status'],
                $row['date_submitted'],
                $row['date_printed'],
            ], null, "A{$rowNum}");
            $rowNum++;
        }

        foreach (range('A', 'G') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }

    if ($spreadsheet->getSheetCount() === 0) {
        $spreadsheet->createSheet()->fromArray(['No records found'], null, 'A1');
    }

    $spreadsheet->setActiveSheetIndex(0);

    $filename = 'id-print-checklist-' . Str::slug($campus) . '-' . now()->format('Y-m-d') . '.xlsx';

    return response()->streamDownload(function () use ($spreadsheet) {
        $writer = new Xlsx($spreadsheet);
        $writer->save('php://output');
    }, $filename, [
        'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]);
});
Route::get('/test-databases', function () {
    $connections = [
        'mysql',
        'tal_mysql',
        'ali_mysql',
        'ft_mysql',
        'bin_mysql',
        'armvs'
    ];

    $results = [];

    foreach ($connections as $connection) {
        try {
            DB::connection($connection)->getPdo();

            $results[$connection] = [
                'status' => 'Connected',
                'database' => DB::connection($connection)->getDatabaseName(),
            ];
        } catch (\Throwable $e) {
            $results[$connection] = [
                'status' => 'Failed',
                'error' => $e->getMessage(),
            ];
        }
    }

    return response()->json($results);
});
Route::get('/', [StudentController::class, 'index'])->name('home');
Route::post('/validate/student', [StudentController::class, 'validate'])->name('validate.student');
Route::get('/form', [StudentController::class, 'studentForm'])->name('student.form');
Route::post('/student/create', [StudentController::class, 'create'])->name('student.create');
Route::post('/student/cancel', [StudentController::class, 'cancel'])->name('student.cancel');
Route::get('/student/checkReplacement', [StudentController::class, 'checkReplacement'])->name('student.check.replacement');

Route::post('/validate/staff', [StaffController::class, 'validate'])->name('validate.staff');
Route::get('/form/staff', [StaffController::class, 'form'])->name('form.staff');
Route::post('/staff/store', [StaffController::class, 'store'])->name('store.staff');

Route::get('/auth/google', [GoogleAuthController::class, 'redirect'])->name('google.redirect');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('google.callback');


Route::middleware(['auth', 'verified', 'check.role:admin|super admin'])->group(function () {

    Route::get('dashboard', [CampusRouteController::class, 'dashboard'])->name('dashboard');

    Route::prefix('campus')->name('campus.')->group(function () {
        // Redirect /campus to /campus/talisay
        Route::get('/', [CampusRouteController::class, 'index']);

        // NEW: Unified campus route
        Route::get('/{campus}', [CampusRouteController::class, 'show'])
            ->whereIn('campus', ['Talisay', 'Alijis', 'Binalbagan', 'Fortune Towne'])
            ->name('show');


    });

    Route::prefix('campus')->name('campus.')->group(function () {
        // Redirect /campus to /campus/talisay
        // ADD STUDENT ROUTE
        Route::post('/student/add', [StudentController::class, 'addStudent'])->name('add.student');

        // EDIT STUDENT ROUTE
        Route::get('/student/edit/{id}', [StudentController::class, 'edit'])->name('edit.student');
        Route::get('/student/view/{id}', [StudentController::class, 'view'])->name('view.student');

    });


    // STUDENT UPDATE ROUTES
    Route::put('/student/update/{id}', [StudentController::class, 'update'])->name('update.student');
    Route::post('/student/picture/update/{id}', [StudentController::class, 'updateStudentPicture'])->name('update.student.picture');
    Route::put('/student/status/{status}/new/{id_number}/update', [StudentController::class, 'updateStatusNew'])->name('update.student.new.status');
    Route::put('/student/status/{status}/rep/{id}/update', [StudentController::class, 'updateStatusRep'])->name('update.student.rep.status');


    // IMPORT/EXPORT ROUTES
    Route::post('/import-printed', [StudentController::class, 'importPrintedStudents'])->name('import.printed.students');
    Route::get('/export/student/{id}', [StudentController::class, 'exportSingleStudent'])->name('export.student');
    Route::post('/export/students', [StudentController::class, 'exportStudents'])->name('export.students');
    Route::get('/exports/{exportId}/status', [StudentController::class, 'status'])
        ->name('exports.status');
    Route::get('/exports/{export}/download', [StudentController::class, 'download'])
        ->name('exports.download');
    Route::post('/checklists', [StudentController::class, 'storeChecklist'])->name('checklist.store');

    Route::get('/students/{id}/print', [StudentController::class, 'print']);
});

require __DIR__ . '/settings.php';
require __DIR__ . '/api.php';
