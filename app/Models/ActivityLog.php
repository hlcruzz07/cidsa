<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    public const UPDATED_AT = null;

    public const ACTION_LOGIN = 'login';
    public const ACTION_PRINT = 'print';
    public const ACTION_EXPORT = 'export';
    public const ACTION_SYNC_DATA = 'sync_data';

    protected $fillable = [
        'action',
        'user_id',
        'student_id',
        'staff_id',
        'ip_address',
        'user_agent',
        'browser',
        'print_type',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }
}