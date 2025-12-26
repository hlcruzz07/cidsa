<?php

use App\Http\Controllers\CampusRouteController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\StudentController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


Route::get('/', [StudentController::class, 'index'])->name('home');

Route::post('/validate/1', [StudentController::class, 'validateStepOne'])->name('validateStepOne');
Route::post('/validate/2', [StudentController::class, 'validateStepTwo'])->name('validateStepTwo');
Route::post('/register/student', [StudentController::class, 'store'])->name('register.student');

Route::get('/auth/google', [GoogleAuthController::class, 'redirect'])->name('google.redirect');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('google.callback');

Route::get('/download-excel', [StudentController::class, 'export']);


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

    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/api.php';