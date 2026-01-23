<?php

namespace App\Http\Requests;

use App\Models\Student;
use Illuminate\Foundation\Http\FormRequest;

class Step1Request extends FormRequest
{

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {

        return [

            'emergency_first_name' => [
                'required',
                function ($attribute, $value, $fail) {
                    $student = Student::where(
                        'id_number',
                        '=',
                        session('validated_student')
                    )->firstOrFail();

                    $studentFirst = strtoupper(trim($student->first_name));
                    $studentLast = strtoupper(trim($student->last_name));
                    $studentSuffix = strtoupper(trim($student->suffix ?? ''));

                    $emergencyFirst = strtoupper(trim($value));
                    $emergencyLast = strtoupper(trim($this->emergency_last_name));
                    $emergencySuffix = strtoupper(trim($this->emergency_suffix ?? ''));

                    // Same first + last name?
                    if (
                        $emergencyFirst === $studentFirst &&
                        $emergencyLast === $studentLast
                    ) {
                        // Allow only JR (student) ↔ SR (emergency)
                        if (!($studentSuffix === 'JR.' && $emergencySuffix === 'SR.')) {
                            $fail('Emergency contact name cannot be the same as the student.');
                        }
                    }
                },
            ],
            'emergency_middle_init' => 'nullable|alpha|size:1',
            'emergency_last_name' => 'required',
            'emergency_suffix' => 'nullable',

            'relationship' => 'required|in:Father,Mother,Brother,Sister,Uncle,Aunt,Cousin,Spouse',
            'contact_number' => 'required|digits:10|starts_with:9',

            'province' => 'required',
            'city' => 'required',
            'barangay' => 'required',
            'zip_code' => 'required|digits:4',
            'college' => 'required',
            'program' => 'required',
            'major' => 'required_if:hasMajor,true|nullable',
        ];
    }

    public function messages()
    {
        return [
            'emergency_first_name.required' => 'Emergency contact first name is required.',
            'emergency_middle_init.alpha' => 'Emergency middle initial must contain letters only.',
            'emergency_middle_init.size' => 'Emergency middle initial must be exactly 1 letter.',
            'emergency_last_name.required' => 'Emergency contact last name is required.',

            'relationship.required' => 'Please enter the relationship of the emergency contact.',

            'contact_number.required' => 'Contact number is required.',
            'contact_number.digits' => 'Contact number must be exactly 10 digits.',
            'contact_number.starts_with' => 'Contact number must start with 9.',

            'province.required' => 'Province is required.',
            'city.required' => 'City is required.',
            'barangay.required' => 'Barangay is required.',
            'zip_code.required' => 'ZIP code is required.',
            'zip_code.digits' => 'ZIP code must be exactly 4 digits.',

            'college.required' => 'Please select your college.',
            'program.required' => 'Program field is required.',
            'major.required_if' => 'You must select a major because the chosen program has available majors.',
        ];
    }
}
