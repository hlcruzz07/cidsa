<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Staff extends Model
{
    protected $fillable = [
        'digital_id',
        'name',
        'campus',
        'blood_type',
        'department',
        'designation',
        'emergency_fname',
        'emergency_mname',
        'emergency_lname',
        'emergency_suffix',
        'emergency_phone',
        'emergency_address'
    ];


}
