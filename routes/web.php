<?php

use App\Http\Controllers\StudentController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return redirect()->route('register.stepOne');
});



Route::get('/register/1', [StudentController::class, 'stepOne'])->name('register.stepOne');
Route::post('/register/1', [StudentController::class, 'storeStepOne']);


Route::middleware('checkStepOne')->group(function () {

    Route::get('/register/2', [StudentController::class, 'stepTwo'])->name('register.stepTwo');
    Route::post('/register/2', [StudentController::class, 'storeStepTwo']);

});


Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__ . '/settings.php';
