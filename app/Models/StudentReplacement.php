<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentReplacement extends Model
{
    protected $fillable = [
        'student_id',
        'receipt',
        'reason',
        'is_printed',
        'printed_at'
    ];


    protected function casts(): array
    {
        return [
            'is_printed' => 'boolean',
        ];
    }
    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}
