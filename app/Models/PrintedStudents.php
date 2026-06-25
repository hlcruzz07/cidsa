<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrintedStudents extends Model
{
    protected $fillable = [
        'id_number',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class, 'id_number');
    }
}
