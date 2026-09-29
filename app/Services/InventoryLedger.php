<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\InventoryReceipt;
use App\Models\InventoryStock;
use Illuminate\Support\Collection;

/**
 * A running stock ledger for one campus:
 *   +N  a confirmed delivery
 *   -1  an ID printed (with the student it was printed for)
 * Oldest first, each row carries the balance after it.
 */
class InventoryLedger
{
    public static function forStock(InventoryStock $stock): Collection
    {
        $receipts = InventoryReceipt::query()
            ->with('receiver:id,name')
            ->where('inventory_stock_id', $stock->id)
            ->whereNotNull('received_at')
            ->get();

        $prints = InventoryBalance::attributedPrints()
            ->where('campus_key', InventoryBalance::bucket($stock->campus));

        return self::build($receipts, $prints);
    }

    /**
     * @param  Collection<int, InventoryReceipt>  $receipts  confirmed only
     * @param  Collection<int, ActivityLog>  $prints
     */
    public static function build(Collection $receipts, Collection $prints): Collection
    {
        $events = [];

        foreach ($receipts as $r) {
            $events[] = [
                'ts' => $r->received_at->timestamp,
                'order' => 0, // deliveries before prints at the same second
                'row' => [
                    'type' => 'received',
                    'at' => $r->received_at->toIso8601String(),
                    'quantity' => (int) $r->quantity,
                    'title' => 'Delivery ' . $r->ref_no,
                    'detail' => $r->delivered_by ? 'Delivered by ' . $r->delivered_by : null,
                    'actor' => $r->receiver?->name,
                    'student_no' => null,
                    'print_type' => null,
                    'charged_via' => null,
                ],
            ];
        }

        foreach ($prints as $p) {
            $no = self::studentNumber($p->student);
            $type = self::typeLabel($p->print_type);

            $events[] = [
                'ts' => $p->created_at->timestamp,
                'order' => 1,
                'row' => [
                    'type' => 'printed',
                    'at' => $p->created_at->toIso8601String(),
                    'quantity' => -1,
                    'title' => self::studentName($p->student) ?? 'Unknown student',
                    'detail' => implode(' · ', array_filter([$no, $type])),
                    'actor' => $p->user?->name,
                    'student_no' => $no,
                    'print_type' => $type,
                    'charged_via' => $p->getAttribute('charged_via'),
                ],
            ];
        }

        usort($events, fn($a, $b) => [$a['ts'], $a['order']] <=> [$b['ts'], $b['order']]);

        $balance = 0;

        return collect($events)->map(function ($e) use (&$balance) {
            $balance += $e['row']['quantity'];

            return $e['row'] + ['balance' => $balance];
        })->values();
    }

    public static function typeLabel(mixed $type): string
    {
        $value = $type instanceof \BackedEnum ? $type->value : (string) $type;

        return $value === ''
            ? 'Unspecified'
            : ucwords(str_replace('_', ' ', strtolower($value)));
    }

    /** Adjust the column lists to match your students table. */
    private static function studentName($s): ?string
    {
        if (!$s) {
            return null;
        }

        foreach (['full_name', 'name'] as $col) {
            if (filled($s->getAttribute($col))) {
                return (string) $s->getAttribute($col);
            }
        }

        $first = $s->getAttribute('first_name');
        $last = $s->getAttribute('last_name');

        if (filled($first) || filled($last)) {
            return trim($last . ($last && $first ? ', ' : '') . $first);
        }

        return 'Student #' . $s->getKey();
    }

    private static function studentNumber($s): ?string
    {
        if (!$s) {
            return null;
        }

        foreach (['student_no', 'student_number', 'student_id', 'id_number', 'lrn'] as $col) {
            if (filled($s->getAttribute($col))) {
                return (string) $s->getAttribute($col);
            }
        }

        return null;
    }
}