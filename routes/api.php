<?php

use App\Http\Controllers\Api\StudentApiController;


Route::middleware(['auth', 'verified', 'check.role:admin|super admin'])->group(function () {
    Route::get('/api/student/filterPaginate', [StudentApiController::class, 'filterPaginate']);
    Route::get('/api/student/filterExport', [StudentApiController::class, 'filterExport'])->name('filter.export');

    Route::get('/api/student-chart', [StudentApiController::class, 'studentsChart']);

});