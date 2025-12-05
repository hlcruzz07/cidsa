<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    protected $fillable = [
        'id_type',
        'id_number',
        'first_name',
        'middle_init',
        'last_name',
        'emergency_first_name',
        'emergency_middle_init',
        'emergency_last_name',
        'relationship',
        'contact_number',
        'province',
        'city',
        'barangay',
        'zip_code',
        'campus',
        'college',
        'program',
        'major',
        'year_level',
        'section',
    ];
}