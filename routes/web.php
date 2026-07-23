<?php

use App\Http\Controllers\Api\StudentApiController;
use App\Http\Controllers\CampusRouteController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\StudentController;
use App\Models\Student;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

Route::get('/test-databases', function () {
    $connections = [
        'mysql',
        'tal_mysql',
        'ali_mysql',
        'ft_mysql',
        'bin_mysql',
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
Route::post('/validate', [StudentController::class, 'validate'])->name('validate.student');

Route::get('/form', [StudentController::class, 'studentForm'])->name('student.form');
Route::post('/student/update', [StudentController::class, 'updateStudent'])->name('student.update');
Route::post('/student/cancel', [StudentController::class, 'cancel'])->name('student.cancel');
Route::get('/student/checkReplacement', [StudentController::class, 'checkReplacement'])->name('student.check.replacement');

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
    Route::put('/student/inc/update/{id}', [StudentController::class, 'updateIncompleteStudent'])->name('update.student.inc');
    Route::post('/student/picture/update/{id}', [StudentController::class, 'updateStudentPicture'])->name('update.student.picture');
    Route::put('/student/status/{status}/new/{id_number}/update', [StudentController::class, 'updateStatusNew'])->name('update.student.new.status');
    Route::put('/student/status/{status}/rep/{id}/update', [StudentController::class, 'updateStatusRep'])->name('update.student.rep.status');


    // IMPORT/EXPORT ROUTES
    Route::post('/import', [StudentController::class, 'importStudents'])->name('import.students');
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
