<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExportedStudent extends Model
{
    protected $fillable = ['export_id', 'student_id'];

    public function export()
    {
        return $this->belongsTo(ExportHistory::class, 'export_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}
