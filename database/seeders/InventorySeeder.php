<?php

namespace Database\Seeders;

use App\Enums\UserCampus;
use App\Models\InventoryReceipt;
use App\Models\InventoryStock;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InventorySeeder extends Seeder
{
    /**
     * Campuses to seed (labels or enum values both work).
     */
    private const CAMPUSES = [
        'Talisay',
        'Alijis',
        'Fortune Towne',
        'Binalbagan',
    ];

    private const SUPPLIERS = [
        'JB Printing Supplies',
        'Negros Office Depot',
        'PrintTech Trading',
        'Visayas Card Solutions',
        'Bacolod Paper Hub',
    ];

    private const REMARKS = [
        'Complete delivery, no damaged items.',
        'Received in good condition.',
        'Partial delivery, balance to follow.',
        'Checked and counted by property custodian.',
        'Replenishment for the semester enrollment.',
        null,
        null,
    ];

    /**
     * Number of receipts to generate per campus.
     */
    private const RECEIPTS_PER_CAMPUS = 30;

    /**
     * Chance (0-100) that a seeded receipt is still pending.
     */
    private const PENDING_CHANCE = 20;

    /**
     * ref_no values already generated during this run.
     *
     * @var array<string, true>
     */
    private array $usedRefNos = [];

    public function run(): void
    {
        DB::transaction(function () {
            // Every user id that actually exists in the users table.
            $allUserIds = User::query()->pluck('id')->all();

            foreach (self::CAMPUSES as $campus) {
                // Stock is derived (confirmed receipts - print logs), so the
                // row only identifies the campus. No quantity is stored.
                $stock = InventoryStock::firstOrCreate(['campus' => $campus]);

                // Idempotent: don't add more receipts if this campus already has some.
                if ($stock->receipts()->exists()) {
                    continue;
                }

                // users.campus stores the enum value, so convert the label first.
                $campusValue = UserCampus::fromLabelOrValue($campus)?->value ?? $campus;

                // Prefer users from this campus; fall back to any existing user.
                $campusUserIds = User::query()
                    ->where('campus', $campusValue)
                    ->pluck('id')
                    ->all();
                $receiverPool = $campusUserIds ?: $allUserIds;

                for ($i = 0; $i < self::RECEIPTS_PER_CAMPUS; $i++) {
                    $quantity = fake()->randomElement([50, 100, 150, 200, 250, 300, 500]);
                    $createdAt = Carbon::instance(
                        fake()->dateTimeBetween('-12 months', '-1 week'),
                    );

                    // No users at all means nothing can be confirmed, so it stays pending.
                    $isPending = empty($receiverPool)
                        || fake()->boolean(self::PENDING_CHANCE);

                    $receipt = new InventoryReceipt([
                        'inventory_stock_id' => $stock->id,
                        'quantity' => $quantity,
                        'ref_no' => $this->uniqueRefNo($createdAt),
                        'delivered_by' => fake()->randomElement(self::SUPPLIERS),
                        'remarks' => fake()->randomElement(self::REMARKS),
                        'received_at' => $isPending
                            ? null
                            : $createdAt->copy()->addDays(fake()->numberBetween(1, 5)),
                        'received_by' => $isPending
                            ? null
                            : fake()->randomElement($receiverPool),
                    ]);
                    $receipt->created_at = $createdAt;
                    $receipt->save();
                }
            }
        });
    }

    /**
     * Random reference number, unique within this run and in the database.
     */
    private function uniqueRefNo(Carbon $date): string
    {
        do {
            $refNo = sprintf('DR-%s-%s', $date->format('Y'), Str::upper(Str::random(8)));
        } while (
            isset($this->usedRefNos[$refNo])
            || InventoryReceipt::where('ref_no', $refNo)->exists()
        );

        $this->usedRefNos[$refNo] = true;

        return $refNo;
    }
}