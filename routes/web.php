<?php

use App\Http\Controllers\StudentController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;


Route::get('/', [StudentController::class, 'index'])->name('home');

Route::post('/validate/1', [StudentController::class, 'validateStepOne'])->name('validateStepOne');
Route::post('/validate/2', [StudentController::class, 'validateStepTwo'])->name('validateStepTwo');
Route::post('/register', [StudentController::class, 'store'])->name('register.student');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__ . '/settings.php';
