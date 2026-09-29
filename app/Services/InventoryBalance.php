<?php

namespace App\Services;

use App\Enums\ActivityLogType;
use App\Enums\UserCampus;
use App\Models\ActivityLog;
use App\Models\InventoryReceipt;
use App\Models\InventoryStock;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Stock is never stored. It is always:
 *
 *   balance = confirmed receipts (received_at NOT NULL) - PRINT rows in activity_logs
 *
 * Which campus a print is charged to is decided in ONE place (resolveCampus):
 *   1. the campus of the user who printed, unless that user is a super admin ("all");
 *   2. otherwise the printed student's campus.
 * Every screen (stock widgets, summary, audit, ledger) uses attributedPrints(),
 * so the numbers can never disagree.
 */
class InventoryBalance
{
    /**
     * @param  Collection<int, InventoryStock>  $stocks
     * @return array<int, array{received:int, printed:int, balance:int}>  keyed by stock id
     */
    public static function forStocks(Collection $stocks): array
    {
        $received = InventoryReceipt::query()
            ->whereNotNull('received_at')
            ->selectRaw('inventory_stock_id, SUM(quantity) as total')
            ->groupBy('inventory_stock_id')
            ->pluck('total', 'inventory_stock_id');

        $printed = self::attributedPrints()->countBy('campus_key');

        $result = [];

        foreach ($stocks as $stock) {
            $key = self::bucket($stock->campus);
            $in = (int) ($received[$stock->id] ?? 0);
            $out = (int) ($printed[$key] ?? 0);

            $result[$stock->id] = [
                'received' => $in,
                'printed' => $out,
                'balance' => $in - $out,
            ];
        }

        return $result;
    }

    public static function forStock(InventoryStock $stock): array
    {
        return self::forStocks(collect([$stock]))[$stock->id];
    }

    /**
     * Every PRINT activity log, each tagged with:
     *   campus_key  - normalized campus bucket it is charged to (null = unassignable)
     *   charged_via - "user" (printing user's campus) or "student" (super-admin fallback)
     *
     * @return Collection<int, ActivityLog>  oldest first
     */
    public static function attributedPrints(?Carbon $since = null): Collection
    {
        return ActivityLog::query()
            ->with(['user:id,name,campus', 'student'])
            ->where('action', ActivityLogType::PRINT ->value)
            ->when($since, fn($q) => $q->where('created_at', '>=', $since))
            ->orderBy('created_at')
            ->orderBy('id')
            ->get()
            ->each(function (ActivityLog $log) {
                [$key, $via] = self::resolveCampus($log);
                $log->setAttribute('campus_key', $key);
                $log->setAttribute('charged_via', $via);
            })
            ->values();
    }

    /** Prints that could not be matched to any campus. */
    public static function unassignedPrintCount(): int
    {
        return self::attributedPrints()->whereNull('campus_key')->count();
    }

    /** @return array{0: ?string, 1: string} */
    private static function resolveCampus(ActivityLog $log): array
    {
        $all = strtolower((string) UserCampus::ALL->value);

        $userKey = self::bucket($log->user?->campus);
        if ($userKey !== null && $userKey !== $all) {
            return [$userKey, 'user'];
        }

        return [self::bucket($log->student?->campus), 'student'];
    }

    /**
     * Call this inside the print action, in a transaction, before writing
     * the ActivityLog. Locking the stock row serialises concurrent prints
     * for the same campus so the balance can't go negative.
     */
    public static function assertAvailable(InventoryStock $stock, int $needed = 1): void
    {
        $locked = InventoryStock::query()->lockForUpdate()->findOrFail($stock->id);

        abort_if(
            self::forStock($locked)['balance'] < $needed,
            422,
            'Not enough ID cards in stock for this campus.',
        );
    }

    /**
     * Normalise enum / label / value to the value stored in users.campus.
     */
    public static function campusKey(mixed $campus): ?string
    {
        if ($campus instanceof UserCampus) {
            return $campus->value;
        }

        if ($campus === null) {
            return null;
        }

        return UserCampus::fromLabelOrValue($campus)?->value ?? (string) $campus;
    }

    /**
     * Comparison key: campusKey() lower-cased and trimmed, so
     * "Talisay", "talisay" and the enum all land in the same bucket.
     */
    public static function bucket(mixed $campus): ?string
    {
        $key = self::campusKey($campus);

        if ($key === null) {
            return null;
        }

        $key = strtolower(trim((string) $key));

        return $key === '' ? null : $key;
    }
}