<?php
use App\Http\Controllers\CampusRouteController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\StudentController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/', [StudentController::class, 'index'])->name('home');
    Route::post('/validate/student', [StudentController::class, 'validate'])->name('validate.student');
    Route::get('/form', [StudentController::class, 'studentForm'])->name('student.form');
    Route::post('/student/create', [StudentController::class, 'create'])->name('student.create');
    Route::post('/student/cancel', [StudentController::class, 'cancel'])->name('student.cancel');
    Route::get('/student/checkReplacement', [StudentController::class, 'checkReplacement'])->name('student.check.replacement');

    Route::post('/validate/staff', [StaffController::class, 'validate'])->name('validate.staff');
    Route::get('/form/staff', [StaffController::class, 'form'])->name('form.staff');
    Route::post('/staff/store', [StaffController::class, 'store'])->name('store.staff');
});

Route::get('/auth/google', [GoogleAuthController::class, 'redirect'])->name('google.redirect');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('google.callback');


Route::middleware(['auth', 'check.role:admin|super admin'])->group(function () {

    Route::get('dashboard', [CampusRouteController::class, 'dashboard'])->name('dashboard');

    Route::prefix('campus')->name('campus.')->group(function () {
        // Redirect /campus to /campus/talisay
        Route::get('/', [CampusRouteController::class, 'index']);

        Route::get('/{campus}', [CampusRouteController::class, 'show'])
            ->whereIn('campus', ['Talisay', 'Alijis', 'Binalbagan', 'Fortune Towne'])
            ->name('show')
            ->middleware('campus');
    });

    // STUDENT UPDATE ROUTES
    Route::middleware('check.role:super admin')->group(function () {
        Route::put('/student/update/{id}', [StudentController::class, 'update'])->name('update.student');
        Route::post('/student/picture/update/{id}', [StudentController::class, 'updateStudentPicture'])->name('update.student.picture');
        Route::put('/student/status/{status}/new/{id_number}/update', [StudentController::class, 'updateStatusNew'])->name('update.student.new.status');
        Route::put('/student/status/{status}/rep/{id}/update', [StudentController::class, 'updateStatusRep'])->name('update.student.rep.status');

    });


    // IMPORT/EXPORT ROUTES
    Route::post('/import-printed', [StudentController::class, 'importPrintedStudents'])->name('import.printed.students');
    Route::get('/export/student/{id}', [StudentController::class, 'exportSingleStudent'])->name('export.student');
    Route::post('/export/students', [StudentController::class, 'exportStudents'])->name('export.students');
    Route::get('/exports/{exportId}/status', [StudentController::class, 'status'])
        ->name('exports.status');
    Route::get('/exports/{export}/download', [StudentController::class, 'download'])
        ->name('exports.download');
    Route::post('/checklists', [StudentController::class, 'storeChecklist'])->name('checklist.store');

});

require __DIR__ . '/settings.php';
require __DIR__ . '/api.php';
