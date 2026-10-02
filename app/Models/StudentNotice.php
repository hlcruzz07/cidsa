<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudentNotice extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'id_number',
        'type',
        'message',
        'posted_by'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'id_number', 'id_number');
    }
}
