<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentChangeLog extends Model
{
    protected $fillable = [
        'student_id',
        'changed_fields',
        'previous_values',
        'new_values',
    ];

    protected $casts = [
        'changed_fields' => 'array',
        'previous_values' => 'array',
        'new_values' => 'array',
    ];

    /**
     * Only these fields are worth logging — things a student could
     * meaningfully dispute or that affect a printed ID. File fields
     * (picture, e_signature) and internal flags (is_completed) are
     * deliberately excluded since they'd just log opaque IDs/noise
     * on every resubmission.
     */
    public const TRACKED_FIELDS = [
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
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Build a log entry from a model that has already been saved, using
     * getChanges()/getOriginal() — restricted to TRACKED_FIELDS. Returns
     * null when nothing tracked actually changed, so callers can skip
     * creating a row entirely.
     */
    public static function fromChangedStudent(Student $student, array $originalBeforeSave): ?self
    {
        $trackedChanges = array_intersect_key(
            $student->getChanges(),
            array_flip(self::TRACKED_FIELDS),
        );

        if (empty($trackedChanges)) {
            return null;
        }

        return new self([
            'student_id' => $student->id,
            'changed_fields' => array_keys($trackedChanges),
            'previous_values' => array_intersect_key(
                $originalBeforeSave,
                $trackedChanges,
            ),
            'new_values' => $trackedChanges,
        ]);
    }
}