<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    protected $casts = [
        'is_completed' => 'boolean'
    ];
    protected $fillable = [
        'id_number',
        'picture',
        'e_signature',

        'first_name',
        'middle_init',
        'last_name',
        'suffix',

        'emergency_first_name',
        'emergency_middle_init',
        'emergency_last_name',
        'emergency_suffix',
        'relationship',
        'contact_number',

        'province',
        'city',
        'barangay',
        'zip_code',

        'campus',
        'college',
        'college_name',
        'program',
        'major',
        'year',

        'is_completed',

    ];

    public function printed()
    {
        return $this->hasOne(
            PrintedStudents::class,
            'id_number',
            'id_number'
        );
    }

    public function replacements()
    {
        return $this->hasMany(StudentReplacement::class, 'student_id');
    }
}