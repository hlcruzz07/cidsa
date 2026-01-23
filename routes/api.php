<?php

use App\Http\Controllers\Api\StudentApiController;


Route::middleware(['auth', 'verified', 'check.role:admin|super admin'])->group(function () {
    Route::get('/api/student/filterPaginate', [StudentApiController::class, 'filterPaginate']);
    Route::get('/api/student/filter', [StudentApiController::class, 'filter']);

    Route::get('/api/student-chart', [StudentApiController::class, 'studentsChart']);
});