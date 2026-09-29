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
        'received_by'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'received_at' => 'datetime',
    ];

    public function stock(): BelongsTo
    {
        return $this->belongsTo(InventoryStock::class, 'inventory_stock_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'received_by');
    }
}