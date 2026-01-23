<?php

use App\Http\Controllers\Api\StudentApiController;
use App\Http\Controllers\CampusRouteController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\StudentController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


Route::get('/', [StudentController::class, 'index'])->name('home')->middleware('student.has.session');
Route::post('/validate', [StudentController::class, 'validate'])->middleware('validate.student')->name('validate.student');


Route::middleware('student.validated')->group(function () {

    Route::get('/student', [StudentController::class, 'studentForm'])->name('student.form');
    Route::post('/student/step/1', [StudentController::class, 'validateStepOne'])->name('validateStepOne');
    Route::post('/student/step/2', [StudentController::class, 'validateStepTwo'])->name('validateStepTwo');
    Route::post('/student/update', [StudentController::class, 'updateStudent'])->name('student.update');
    Route::post('/student/cancel', [StudentController::class, 'cancel'])->name('student.cancel');

});

Route::get('/auth/google', [GoogleAuthController::class, 'redirect'])->name('google.redirect');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('google.callback');


Route::middleware(['auth', 'verified', 'check.role:admin|super admin'])->group(function () {

    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::prefix('campus')->name('campus.')->group(function () {
        // Redirect /campus to /campus/talisay
        Route::get('/', [CampusRouteController::class, 'index']);

        Route::get('/talisay', [CampusRouteController::class, 'talisay'])->name('talisay');
        Route::get('/alijis', [CampusRouteController::class, 'alijis'])->name('alijis');
        Route::get('/binalbagan', [CampusRouteController::class, 'binalbagan'])->name('binalbagan');
        Route::get('/fortune-towne', [CampusRouteController::class, 'fortuneTowne'])->name('fortune-towne');

        //ADD STUDENT ROUTE
        Route::post('/student/add', [StudentController::class, 'addStudent'])->name('add.student');
    });

    // IMPORT/EXPORT ROUTES
    Route::post('/import', [StudentController::class, 'importStudents'])->name('import.students');
    Route::get('/export/students', [StudentController::class, 'exportStudents'])->name('export.students');

});

require __DIR__ . '/settings.php';
require __DIR__ . '/api.php';