<?php

namespace App\Http\Controllers;

use App\Enums\ActivityLogType;
use App\Models\ActivityLog;
use App\Models\InventoryReceipt;
use App\Models\InventoryStock;
use App\Services\InventoryBalance;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class InventoryController extends Controller
{
    /** A pending receipt older than this many days counts as overdue. */
    private const OVERDUE_DAYS = 7;

    public function index()
    {
        $models = InventoryStock::query()->orderBy('campus')->get(['id', 'campus']);
        $balances = InventoryBalance::forStocks($models);

        // `quantity` = current stock (confirmed receipts - prints).
        $stocks = $models->map(fn($s) => [
            'id' => $s->id,
            'campus' => $s->campus,
            'quantity' => $balances[$s->id]['balance'],
            'received_total' => $balances[$s->id]['received'],
            'printed_total' => $balances[$s->id]['printed'],
        ])->values();

        return Inertia::render('Inventory/Index', [
            'stocks' => $stocks,
            'totalStock' => (int) $stocks->sum('quantity'),
            'summary' => $this->buildSummary($stocks),
            'unassignedPrints' => InventoryBalance::unassignedPrintCount(),
        ]);
    }

    private function buildSummary($stocks): array
    {
        $now = now();

        // Far enough back to cover the previous 90-day period (180 days)
        // and the 6 monthly bars.
        $start = $now->copy()->subDays(180)->startOfMonth();

        $rows = InventoryReceipt::query()
            ->where(function ($q) use ($start) {
                $q->where('created_at', '>=', $start)
                    ->orWhere('received_at', '>=', $start);
            })
            ->get(['inventory_stock_id', 'quantity', 'created_at', 'received_at']);

        $pending = InventoryReceipt::query()
            ->whereNull('received_at')
            ->get(['inventory_stock_id', 'quantity', 'created_at']);

        // Every print in the window (same join as InventoryBalance so the
        // numbers agree with the stock figures).
        $prints = InventoryBalance::attributedPrints($start);

        // ── Sent / printed per period, compared with the previous period ─────
        $between = fn($collection, Carbon $from, Carbon $to) => $collection->filter(
            fn($r) => $r->created_at >= $from && $r->created_at <= $to,
        );

        $periods = [];
        foreach ([7, 30, 90] as $days) {
            $from = $now->copy()->subDays($days);
            $prevFrom = $now->copy()->subDays($days * 2);

            $current = $between($rows, $from, $now);
            $previous = $between($rows, $prevFrom, $from);

            $periods[(string) $days] = [
                'sent_quantity' => (int) $current->sum('quantity'),
                'sent_count' => $current->count(),
                'previous_quantity' => (int) $previous->sum('quantity'),
                'used_quantity' => $between($prints, $from, $now)->count(),
                'previous_used' => $between($prints, $prevFrom, $from)->count(),
            ];
        }

        // ── Pending / overdue ────────────────────────────────────────────────
        $overdueCutoff = $now->copy()->subDays(self::OVERDUE_DAYS);
        $oldestPending = $pending->min('created_at');

        $pendingSummary = [
            'count' => $pending->count(),
            'quantity' => (int) $pending->sum('quantity'),
            'overdue_count' => $pending->filter(fn($r) => $r->created_at <= $overdueCutoff)->count(),
            'overdue_days' => self::OVERDUE_DAYS,
            'oldest_days' => $oldestPending
                ? (int) floor($now->diffInSeconds($oldestPending, true) / 86400)
                : null,
        ];

        // ── Average time for a campus to confirm (last 90 days) ──────────────
        $confirmed = $rows->filter(
            fn($r) => $r->received_at && $r->created_at >= $now->copy()->subDays(90),
        );
        $avgConfirmDays = $confirmed->isEmpty()
            ? null
            : round(
                $confirmed->avg(fn($r) => ($r->received_at->timestamp - $r->created_at->timestamp) / 86400),
                1,
            );

        $receivedLast30 = (int) $rows
            ->filter(fn($r) => $r->received_at && $r->received_at >= $now->copy()->subDays(30))
            ->sum('quantity');

        // ── Monthly trend (last 6 months) ────────────────────────────────────
        $monthly = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->startOfMonth()->subMonths($i);
            $key = $month->format('Y-m');

            $monthly[] = [
                'label' => $month->format('M'),
                'month' => $month->format('M Y'),
                'sent' => (int) $rows->filter(fn($r) => $r->created_at->format('Y-m') === $key)->sum('quantity'),
                'received' => (int) $rows->filter(fn($r) => $r->received_at && $r->received_at->format('Y-m') === $key)->sum('quantity'),
                'used' => $prints->filter(fn($p) => $p->created_at->format('Y-m') === $key)->count(),
            ];
        }

        // ── Per campus ───────────────────────────────────────────────────────
        $lastSent = InventoryReceipt::query()
            ->selectRaw('inventory_stock_id, MAX(created_at) as last_sent_at')
            ->groupBy('inventory_stock_id')
            ->pluck('last_sent_at', 'inventory_stock_id');

        $cutoff30 = $now->copy()->subDays(30);

        // Cards used in the last 30 days, per printing user's campus.
        $printed30 = $prints
            ->filter(fn($p) => $p->created_at >= $cutoff30)
            ->countBy('campus_key');

        $campuses = $stocks->map(function ($stock) use ($rows, $pending, $lastSent, $cutoff30, $printed30) {
            $campusPending = $pending->where('inventory_stock_id', $stock['id']);
            $key = InventoryBalance::bucket($stock['campus']);

            $used30 = (int) ($printed30[$key] ?? 0);
            $avgDaily = round($used30 / 30, 2);
            $balance = (int) $stock['quantity'];

            return [
                'stock_id' => $stock['id'],
                'campus' => $stock['campus'],
                'stock' => $balance,
                'has_discrepancy' => $stock['printed_total'] > $stock['received_total'],
                'sent_30' => (int) $rows
                    ->filter(fn($r) => $r->inventory_stock_id === $stock['id'] && $r->created_at >= $cutoff30)
                    ->sum('quantity'),
                'printed_30' => $used30,
                'received_total' => $stock['received_total'],
                'printed_total' => $stock['printed_total'],
                'avg_daily_use' => $avgDaily,
                // Days until the stock runs out at the last-30-day pace.
                'days_left' => ($balance > 0 && $avgDaily > 0)
                    ? (int) floor($balance / $avgDaily)
                    : null,
                'pending_quantity' => (int) $campusPending->sum('quantity'),
                'pending_count' => $campusPending->count(),
                'last_sent_at' => isset($lastSent[$stock['id']])
                    ? Carbon::parse($lastSent[$stock['id']])->toIso8601String()
                    : null,
            ];
        })->values();

        return [
            'totals' => [
                'stock' => (int) $stocks->sum('quantity'),
                'received' => (int) $stocks->sum('received_total'),
                'printed' => (int) $stocks->sum('printed_total'),
            ],
            'periods' => $periods,
            'pending' => $pendingSummary,
            'received_last_30' => $receivedLast30,
            'avg_confirm_days' => $avgConfirmDays,
            'monthly' => $monthly,
            'campuses' => $campuses,
        ];
    }
}