<?php

namespace App\Services;

use App\Models\InventoryReceipt;
use App\Models\InventoryStock;

/**
 * Reconciles one campus's confirmed deliveries against its print logs and
 * returns a summary, a list of findings, the printed students and a full
 * stock movement ledger.
 */
class InventoryAudit
{
    public const OVERDUE_DAYS = 7;

    public static function forStock(InventoryStock $stock): array
    {
        $campusKey = InventoryBalance::bucket($stock->campus);
        $fmt = fn($n) => number_format((int) $n);

        $receipts = InventoryReceipt::query()
            ->with('receiver:id,name')
            ->where('inventory_stock_id', $stock->id)
            ->orderBy('created_at')
            ->get();

        $confirmed = $receipts->filter(fn($r) => $r->received_at !== null)->values();
        $pending = $receipts->filter(fn($r) => $r->received_at === null)->values();

        // Same attribution as the stock widgets, so the numbers always agree.
        $prints = InventoryBalance::attributedPrints()
            ->where('campus_key', $campusKey)
            ->values();

        $movements = InventoryLedger::build($confirmed, $prints);

        // ── Totals ───────────────────────────────────────────────────────────
        $received = (int) $confirmed->sum('quantity');
        $printed = $prints->count();
        $balance = $received - $printed;
        $over = max(0, $printed - $received);
        $pendingQty = (int) $pending->sum('quantity');
        $overdueCutoff = now()->subDays(self::OVERDUE_DAYS);
        $overdue = $pending->filter(fn($r) => $r->created_at <= $overdueCutoff)->count();

        // ── Was a print ever made with no stock? ─────────────────────────────
        $running = 0;
        $lowest = 0;
        $firstNegativeAt = null;
        $unbacked = 0;

        foreach ($movements as $m) {
            if ($m['type'] === 'printed' && $running <= 0) {
                $unbacked++;
            }
            $running += $m['quantity'];
            $lowest = min($lowest, $running);
            if ($running < 0 && $firstNegativeAt === null) {
                $firstNegativeAt = strtotime($m['at']);
            }
        }

        // ── Findings ─────────────────────────────────────────────────────────
        $findings = [];

        if ($over > 0) {
            $findings[] = self::finding(
                'critical',
                'Printed more IDs than confirmed stock',
                sprintf(
                    '%s printed %s IDs, but only %s cards were confirmed as received. That is %s more than the campus ever had.',
                    $stock->campus,
                    $fmt($printed),
                    $fmt($received),
                    $fmt($over),
                ),
            );

            if ($pendingQty >= $over) {
                $findings[] = self::finding(
                    'info',
                    'Unconfirmed deliveries may explain the gap',
                    sprintf(
                        '%s cards are still waiting for confirmation, enough to cover the %s shortfall. If they were actually received, confirm them.',
                        $fmt($pendingQty),
                        $fmt($over),
                    ),
                );
            }
        }

        if ($unbacked > 0) {
            $findings[] = self::finding(
                'warning',
                'Prints were logged while there was no confirmed stock',
                sprintf(
                    '%s print(s) happened when the confirmed balance was zero or less%s. Receipts may have been confirmed late or dated incorrectly.',
                    $fmt($unbacked),
                    $firstNegativeAt
                    ? ', and the balance first went negative on ' . date('M j, Y', $firstNegativeAt)
                    : '',
                ),
            );
        }

        if ($overdue > 0) {
            $findings[] = self::finding(
                'warning',
                'Overdue deliveries',
                sprintf(
                    '%s delivery(ies) have been waiting more than %d days for confirmation.',
                    $fmt($overdue),
                    self::OVERDUE_DAYS,
                ),
            );
        }

        $early = $confirmed->filter(fn($r) => $r->received_at < $r->created_at)->count();
        if ($early > 0) {
            $findings[] = self::finding(
                'warning',
                'Receipts confirmed before they were sent',
                sprintf('%s receipt(s) have a received date earlier than their created date.', $fmt($early)),
            );
        }

        $noReceiver = $confirmed->filter(fn($r) => $r->received_by === null)->count();
        if ($noReceiver > 0) {
            $findings[] = self::finding(
                'warning',
                'Confirmed receipts with no receiver',
                sprintf('%s confirmed receipt(s) have no receiving user recorded.', $fmt($noReceiver)),
            );
        }

        $viaStudent = $prints->where('charged_via', 'student')->count();
        if ($viaStudent > 0) {
            $findings[] = self::finding(
                'info',
                'Some prints were charged using the student\'s campus',
                sprintf(
                    '%s print(s) were made by a super admin (campus "all"), so they were charged to this campus because the printed student belongs here.',
                    $fmt($viaStudent),
                ),
            );
        }

        if ($pendingQty > 0) {
            $findings[] = self::finding(
                'info',
                'Pending deliveries are not counted in stock',
                sprintf(
                    '%s cards (%s receipt(s)) were sent but not confirmed. If all are confirmed, the balance would be %s.',
                    $fmt($pendingQty),
                    $fmt($pending->count()),
                    $fmt($balance + $pendingQty),
                ),
            );
        }

        if (empty($findings)) {
            $findings[] = self::finding(
                'info',
                'No discrepancies found',
                sprintf(
                    'Confirmed deliveries (%s) minus prints (%s) gives a balance of %s.',
                    $fmt($received),
                    $fmt($printed),
                    $fmt($balance),
                ),
            );
        }

        $severities = array_column($findings, 'severity');
        $result = in_array('critical', $severities, true)
            ? 'fail'
            : (in_array('warning', $severities, true) ? 'warning' : 'pass');

        // ── Breakdowns ───────────────────────────────────────────────────────
        $byType = $prints
            ->groupBy(fn($p) => InventoryLedger::typeLabel($p->print_type))
            ->map(fn($g, $label) => ['label' => $label, 'count' => $g->count()])
            ->sortByDesc('count')
            ->values()
            ->all();

        $byUser = $prints
            ->groupBy(fn($p) => $p->user?->name ?: 'Unknown')
            ->map(fn($g, $label) => ['label' => $label, 'count' => $g->count()])
            ->sortByDesc('count')
            ->take(10)
            ->values()
            ->all();

        // Every printed student, newest first, with the stock left after it.
        $printedStudents = $movements
            ->where('type', 'printed')
            ->reverse()
            ->values()
            ->map(fn($m) => [
                'at' => $m['at'],
                'student' => $m['title'],
                'student_no' => $m['student_no'],
                'print_type' => $m['print_type'],
                'printed_by' => $m['actor'],
                'balance_after' => $m['balance'],
                'charged_via' => $m['charged_via'],
            ])
            ->all();

        $monthly = [];
        $earliest = collect([$confirmed->min('received_at'), $prints->min('created_at')])
            ->filter()
            ->min();

        if ($earliest) {
            $recBy = $confirmed
                ->groupBy(fn($r) => $r->received_at->format('Y-m'))
                ->map(fn($g) => (int) $g->sum('quantity'));
            $prBy = $prints
                ->groupBy(fn($p) => $p->created_at->format('Y-m'))
                ->map(fn($g) => $g->count());

            $cursor = $earliest->copy()->startOfMonth();
            $end = now()->startOfMonth();
            $run = 0;

            while ($cursor <= $end) {
                $k = $cursor->format('Y-m');
                $in = (int) ($recBy[$k] ?? 0);
                $out = (int) ($prBy[$k] ?? 0);
                $run += $in - $out;

                $monthly[] = [
                    'month' => $cursor->format('M Y'),
                    'received' => $in,
                    'printed' => $out,
                    'balance' => $run,
                ];

                $cursor = $cursor->copy()->addMonth();
            }

            $monthly = array_slice($monthly, -12);
        }

        $row = fn($r) => [
            'ref_no' => $r->ref_no,
            'quantity' => (int) $r->quantity,
            'delivered_by' => $r->delivered_by,
            'sent_at' => $r->created_at?->toIso8601String(),
            'received_at' => $r->received_at?->toIso8601String(),
            'received_by' => $r->receiver?->name,
        ];

        return [
            'stock_id' => $stock->id,
            'campus' => $stock->campus,
            'generated_at' => now()->toIso8601String(),
            'result' => $result,
            'totals' => [
                'received' => $received,
                'printed' => $printed,
                'balance' => $balance,
                'discrepancy' => $over,
                'pending_quantity' => $pendingQty,
                'pending_count' => $pending->count(),
                'overdue_count' => $overdue,
                'projected_balance' => $balance + $pendingQty,
            ],
            'ledger' => [
                'lowest_balance' => $lowest,
                'first_negative_at' => $firstNegativeAt ? date('c', $firstNegativeAt) : null,
                'unbacked_prints' => $unbacked,
            ],
            'findings' => $findings,
            'receipts' => [
                'confirmed' => $confirmed->map($row)->all(),
                'pending' => $pending->map($row)->all(),
            ],
            'printed_students' => $printedStudents,
            'movements' => $movements->reverse()->values()->all(),
            'prints_by_type' => $byType,
            'prints_by_user' => $byUser,
            'monthly' => $monthly,
            'period' => [
                'first_print' => $prints->first()?->created_at?->toIso8601String(),
                'last_print' => $prints->last()?->created_at?->toIso8601String(),
                'first_receipt' => $confirmed->min('received_at')?->toIso8601String(),
                'last_receipt' => $confirmed->max('received_at')?->toIso8601String(),
            ],
        ];
    }

    private static function finding(string $severity, string $title, string $detail): array
    {
        return compact('severity', 'title', 'detail');
    }
}