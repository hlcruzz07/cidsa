<?php

use App\Http\Controllers\Api\StudentApiController;


Route::middleware(['auth', 'verified', 'check.role:admin|super admin'])->group(function () {
    Route::get('/api/student/filterPaginateAll', [StudentApiController::class, 'filterPaginateAll'])->name('filter.paginate.all');

    Route::get('/api/student/filterPaginate', [StudentApiController::class, 'filterPaginate'])->name('filter.paginate');
    Route::get('/api/student/filterCheck', [StudentApiController::class, 'isStudentsExport'])->name('filter.check');

    Route::get('/api/student/filterExport', [StudentApiController::class, 'filterExport'])->name('filter.export');

    Route::get('/api/student-chart', [StudentApiController::class, 'studentsChart']);
    Route::get('/api/dashboard-chart', [StudentApiController::class, 'dashboardChart']);

});