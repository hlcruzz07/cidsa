<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{

    protected $fillable = [
        'id_type',
        'id_number',
        'affidavit_img',
        'receipt_img',
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
        'year_level',
        'section',
        'picture',
        'e_signature',
    ];

}