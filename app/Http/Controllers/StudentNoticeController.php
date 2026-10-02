<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\StudentNotice;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class StudentNoticeController extends Controller
{
    public const TYPE_NEW_STUDENT = 'new_student';
    public const TYPE_REPLACEMENT = 'replacement';

    public function store(Request $request)
    {
        $data = $request->validate([
            'id_number' => ['required', 'string'],
            'type' => [
                'required',
                'string',
                Rule::in([self::TYPE_NEW_STUDENT, self::TYPE_REPLACEMENT]),
            ],
            'message' => ['required', 'string', 'max:250'],
        ]);

        $student = Student::where('id_number', $data['id_number'])->first();

        if (!$student) {
            throw ValidationException::withMessages([
                'message' => 'Student not found.',
            ]);
        }

        // Notices only make sense before the relevant ID is printed.
        if ($data['type'] === self::TYPE_REPLACEMENT) {
            // A replacement student's original ID is already printed, so check
            // for a replacement request that is still waiting to be printed.
            $hasPendingReplacement = $student->replacements()
                ->where('is_printed', false)
                ->exists();

            if (!$hasPendingReplacement) {
                throw ValidationException::withMessages([
                    'message' => 'This student has no pending replacement request. Notices can only be sent before the replacement is printed.',
                ]);
            }
        } else {
            if ($student->printed()->exists()) {
                throw ValidationException::withMessages([
                    'message' => 'This student has already been printed. Notices can only be sent before printing.',
                ]);
            }
        }

        // One active notice per student per type. Soft-deleted (resolved)
        // notices are excluded by default, so resolving one frees the slot.
        $alreadySent = StudentNotice::where('id_number', $data['id_number'])
            ->where('type', $data['type'])
            ->exists();

        if ($alreadySent) {
            throw ValidationException::withMessages([
                'message' => 'A notice was already sent to this student. Resolve it first.',
            ]);
        }

        StudentNotice::create([
            'id_number' => $data['id_number'],
            'type' => $data['type'],
            'message' => $data['message'],
            'posted_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Notice sent successfully!');
    }

    public function destroy(StudentNotice $studentNotice)
    {
        $studentNotice->delete(); // soft delete

        return back()->with('success', 'Notice removed successfully!');
    }
}