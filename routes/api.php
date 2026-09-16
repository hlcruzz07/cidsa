<?php

use App\Http\Controllers\Api\StudentApiController;
use App\Http\Controllers\StudentPrintStatusExportController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'check.role:admin|super admin'])->group(function () {

    Route::get('/api/student/filterPaginate', [StudentApiController::class, 'filterPaginate'])->name('filter.paginate');
    Route::get('/api/student/filterPaginateReplacement', [StudentApiController::class, 'filterPaginateReplacement'])->name('filter.paginate.replacements');



    Route::get('/api/student-chart', [StudentApiController::class, 'studentsChart']);
    Route::get('/api/dashboard-chart', [StudentApiController::class, 'dashboardChart']);

    Route::get('/api/student/{id}', [StudentApiController::class, 'getStudentById'])->name('get.student');
    Route::get('/api/students', [StudentApiController::class, 'getStudentByIds'])->name('get.students');

    Route::get('/gdrive-image/{fileId}', [StudentApiController::class, 'image'])
        ->name('gdrive.image');
    Route::get('/api/export-status', [StudentPrintStatusExportController::class, 'export'])
        ->name('api.export.status');

});

Route::get('/api/student/status/{id_number}', [StudentApiController::class, 'checkStatus'])->name('api.student.status');