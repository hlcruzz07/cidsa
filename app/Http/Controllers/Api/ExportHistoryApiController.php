<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\ExportRepository;
use Illuminate\Http\Request;

class ExportHistoryApiController extends Controller
{
    protected $exportHistory;

    public function __construct(ExportRepository $exportRepository)
    {
        $this->exportHistory = $exportRepository;
    }

    public function exportHistoryPaginate(Request $request)
    {
        $filters = $request->only([
            'search',
            'from',
            'to',
            'sort',
            'order',
            'perPage',
        ]);

        return $this->exportHistory->filterPaginate($filters);
    }
}
