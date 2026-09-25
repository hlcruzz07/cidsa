<?php

namespace App\Models;

use App\Enums\ActivityLogType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryStock extends Model
{
    protected $fillable = [
        'campus',
        'quantity',
    ];

    public function receipts(): HasMany
    {
        return $this->hasMany(InventoryReceipt::class);
    }

}