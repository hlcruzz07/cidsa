<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $fillable = [
        'user_id',
        'student_id',
        'action',
        'ip_address',
        'user_agent',
        'browser',
        'print_type'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}
