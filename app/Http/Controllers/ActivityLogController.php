<?php

namespace App\Http\Controllers;

use App\Enums\ActivityLogType;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    public function index()
    {
        $summary = $this->buildSummary();

        return Inertia::render('ActivityLogs/Index', [
            'summary' => $summary,
        ]);
    }

    public function paginate(Request $request)
    {
        $validated = $request->validate([
            'action'   => ['nullable', 'string'],
            'user_id'  => ['nullable', 'integer'],
            'search'   => ['nullable', 'string', 'max:255'],
            'from'     => ['nullable', 'date'],
            'to'       => ['nullable', 'date'],
            'perPage'  => ['nullable', 'integer', 'min:5', 'max:100'],
            'sort'     => ['nullable', 'string', 'in:id,action,created_at'],
            'order'    => ['nullable', 'string', 'in:asc,desc'],
            'page'     => ['nullable', 'integer'],
        ]);

        $perPage = (int) ($validated['perPage'] ?? 10);
        $sort    = $validated['sort']  ?? 'created_at';
        $order   = $validated['order'] ?? 'desc';

        $query = ActivityLog::query()
            ->with(['user:id,name,email,campus', 'student:id,id_number,first_name,last_name'])
            ->orderBy("activity_logs.{$sort}", $order);

        if (!empty($validated['action'])) {
            $query->where('action', $validated['action']);
        }

        if (!empty($validated['user_id'])) {
            $query->where('user_id', (int) $validated['user_id']);
        }

        if (!empty($validated['search'])) {
            $term = '%' . $validated['search'] . '%';
            $query->where(function ($q) use ($term) {
                $q->where('ip_address', 'like', $term)
                  ->orWhere('browser', 'like', $term)
                  ->orWhereHas('user', fn($u) => $u->where('name', 'like', $term))
                  ->orWhereHas('student', fn($s) =>
                        $s->where('id_number', 'like', $term)
                          ->orWhere('last_name', 'like', $term)
                  );
            });
        }

        if (!empty($validated['from'])) {
            $query->where('activity_logs.created_at', '>=', $validated['from'] . ' 00:00:00');
        }

        if (!empty($validated['to'])) {
            $query->where('activity_logs.created_at', '<=', $validated['to'] . ' 23:59:59');
        }

        return response()->json(
            $query->paginate($perPage)->withQueryString()
        );
    }

    private function buildSummary(): array
    {
        $total   = ActivityLog::count();
        $logins  = ActivityLog::where('action', ActivityLogType::LOGIN->value)->count();
        $prints  = ActivityLog::where('action', ActivityLogType::PRINT->value)->count();
        $exports = ActivityLog::where('action', ActivityLogType::EXPORT->value)->count();
        $syncs   = ActivityLog::where('action', ActivityLogType::SYNC_DATA->value)->count();

        $since7 = now()->subDays(7);
        $recent = ActivityLog::where('created_at', '>=', $since7)->count();

        $monthly = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->startOfMonth()->subMonths($i);
            $key   = $month->format('Y-m');
            $monthly[] = [
                'label'   => $month->format('M'),
                'month'   => $month->format('M Y'),
                'total'   => ActivityLog::whereRaw("DATE_FORMAT(created_at,'%Y-%m') = ?", [$key])->count(),
                'logins'  => ActivityLog::where('action', ActivityLogType::LOGIN->value)->whereRaw("DATE_FORMAT(created_at,'%Y-%m') = ?", [$key])->count(),
                'prints'  => ActivityLog::where('action', ActivityLogType::PRINT->value)->whereRaw("DATE_FORMAT(created_at,'%Y-%m') = ?", [$key])->count(),
                'exports' => ActivityLog::where('action', ActivityLogType::EXPORT->value)->whereRaw("DATE_FORMAT(created_at,'%Y-%m') = ?", [$key])->count(),
            ];
        }

        return [
            'total'   => $total,
            'logins'  => $logins,
            'prints'  => $prints,
            'exports' => $exports,
            'syncs'   => $syncs,
            'recent'  => $recent,
            'monthly' => $monthly,
        ];
    }
}
