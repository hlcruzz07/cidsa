<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryReceipt;
use App\Models\InventoryStock;
use App\Models\User;
use App\Services\InventoryBalance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InventoryApiController extends Controller
{
    private const SORTABLE = [
        'received_at',
        'created_at',
        'quantity',
        'ref_no',
        'delivered_by',
    ];

    public function paginate(Request $request)
    {
        $perPage = max(1, min((int) $request->query('perPage', 10), 100));

        $sort = in_array($request->query('sort'), self::SORTABLE, true)
            ? $request->query('sort')
            : 'created_at';
        $order = $request->query('order') === 'asc' ? 'asc' : 'desc';

        $receipts = InventoryReceipt::query()
            ->with(['stock:id,campus', 'receiver:id,name'])
            ->when($request->filled('campus'), function ($q) use ($request) {
                $q->whereHas('stock', fn($s) => $s->where('campus', $request->query('campus')));
            })
            ->when($request->query('status') === 'pending', fn($q) => $q->whereNull('received_at'))
            ->when($request->query('status') === 'received', fn($q) => $q->whereNotNull('received_at'))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%' . $request->query('search') . '%';
                $q->where(function ($w) use ($term) {
                    $w->where('ref_no', 'like', $term)
                        ->orWhere('delivered_by', 'like', $term)
                        ->orWhere('remarks', 'like', $term);
                });
            })
            ->when($request->filled('from'), fn($q) => $q->where('received_at', '>=', $request->query('from')))
            ->when($request->filled('to'), fn($q) => $q->where('received_at', '<=', $request->query('to')))
            ->when($request->filled('min_quantity'), fn($q) => $q->where('quantity', '>=', (int) $request->query('min_quantity')))
            ->when($request->filled('max_quantity'), fn($q) => $q->where('quantity', '<=', (int) $request->query('max_quantity')))
            ->orderBy($sort, $order)
            ->orderBy('id', 'desc')
            ->paginate($perPage);

        return response()->json($receipts);
    }

    /**
     * Record a delivery as PENDING. Stock is not touched.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'inventory_stock_id' => ['required', 'integer', 'exists:inventory_stocks,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:1000000'],
            'delivered_by' => ['nullable', 'string', 'max:255'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        $validated = array_merge($validated, [
            'ref_no' => $this->generateRefNo(),
        ]);

        $receipt = InventoryReceipt::create($validated);

        return response()->json(
            $receipt->load(['stock:id,campus', 'receiver:id,name']),
            201,
        );
    }

    /**
     * Confirm a pending receipt. This only stamps received_at / received_by.
     * The stock balance is derived (receipts - print logs), so nothing is
     * incremented here.
     */
    public function receive(Request $request, InventoryReceipt $receipt)
    {
        $validated = $request->validate([
            'received_at' => ['required', 'date', 'before_or_equal:now'],
        ]);

        $user = $request->user();

        DB::transaction(function () use ($receipt, $validated, $user) {
            $locked = InventoryReceipt::query()->lockForUpdate()->findOrFail($receipt->id);

            abort_if($locked->received_at !== null, 409, 'This receipt has already been confirmed.');

            $stock = InventoryStock::query()->findOrFail($locked->inventory_stock_id);

            abort_unless(
                $this->canReceive($user, $stock),
                403,
                'Only a user from the receiving campus can confirm this receipt.',
            );

            $locked->update([
                'received_at' => $validated['received_at'],
                'received_by' => $user->id,
            ]);
        });

        $receipt = $receipt->refresh()->load(['stock:id,campus', 'receiver:id,name']);

        return response()->json(array_merge($receipt->toArray(), [
            'stock_balance' => InventoryBalance::forStock($receipt->stock),
        ]));
    }

    /**
     * Compares normalised values so it works whether campus is stored as an
     * enum value or a label, and whether User casts it to the enum or not.
     */
    private function canReceive(User $user, InventoryStock $stock): bool
    {
        return InventoryBalance::campusKey($user->campus) === InventoryBalance::campusKey($stock->campus);
    }

    private function generateRefNo(): string
    {
        do {
            $refNo = 'IR-' . Str::upper(Str::random(8));
        } while (InventoryReceipt::where('ref_no', $refNo)->exists());

        return $refNo;
    }
}