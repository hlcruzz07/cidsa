<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\CampusRouteController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\UserController;
use App\Models\InventoryStock;
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
        Route::get('/', [CampusRouteController::class, 'index']);

        Route::get('/{campus}', [CampusRouteController::class, 'show'])
            ->whereIn('campus', ['Talisay', 'Alijis', 'Binalbagan', 'Fortune Towne'])
            ->name('show')
            ->middleware('campus');
    });

    Route::middleware('check.role:super admin')->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users');
        Route::post('/accounts', [UserController::class, 'store'])->name('user.store');
        Route::put('/user/{id}/update', [UserController::class, 'update'])->name('user.update');

        Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory');
        Route::get('/activity-logs', [ActivityLogController::class, 'index'])->name('activity-logs');
        Route::get('/api/activity-logs', [ActivityLogController::class, 'paginate'])->name('activity-logs.paginate');

    });

});

require __DIR__ . '/settings.php';
require __DIR__ . '/api.php';
