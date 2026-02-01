<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use SebastianBergmann\Exporter\Exporter;

class ExportHistory extends Model
{
    protected $fillable = [
        'user_id',
        'file_name'
    ];

    public function exportedStudents()
    {
        return $this->hasMany(ExportedStudent::class, 'export_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
