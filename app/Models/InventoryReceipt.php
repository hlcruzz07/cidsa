<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryReceipt extends Model
{
    protected $fillable = [
        'inventory_stock_id',
        'quantity',
        'ref_no',
        'delivered_by',
        'remarks',
        'received_at',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'received_at' => 'datetime',
    ];

    public function stock(): BelongsTo
    {
        return $this->belongsTo(InventoryStock::class);
    }
}