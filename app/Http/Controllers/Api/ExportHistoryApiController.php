<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentExport;
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

    public function studentExportsPaginate(Request $request)
    {
        $filters = $request->only([
            'search',
            'from',
            'to',
            'sort',
            'order',
            'perPage',
        ]);

        $query = StudentExport::with('user')
            ->where('status', 'completed');

        // Filter by date range
        if (!empty($filters['from']) && !empty($filters['to'])) {
            if ($filters['from'] === $filters['to']) {
                $query->whereDate('created_at', '=', $filters['from']);
            } else {
                $query->whereBetween('created_at', [
                    $filters['from'],
                    $filters['to'],
                ]);
            }
        }

        // Filter by file name or user
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('file_name', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        // Sorting
        $sort = $filters['sort'] ?? 'created_at';
        $order = $filters['order'] ?? 'desc';
        $query->orderBy($sort, $order);

        // Pagination
        $perPage = $filters['perPage'] ?? 10;
        return $query->paginate($perPage);
    }
}
