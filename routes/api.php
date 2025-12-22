<?php

use App\Http\Controllers\Api\StudentApiController;


Route::middleware(['auth', 'verified', 'check.role:admin|super admin'])->group(function () {
    Route::get('/api/student/filter', [StudentApiController::class, 'filter']);
});