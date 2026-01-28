<?php

namespace App\Http\Requests;

use App\Models\Student;
use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // 🧑 Student name
            'first_name' => 'required|string|max:25',
            'middle_init' => 'nullable|alpha|size:1',
            'last_name' => 'required|string|max:25',
            'suffix' => 'nullable|string',

            // 🚨 Emergency contact
            'emergency_first_name' => [
                'required',
                function ($attribute, $value, $fail) {
                    $studentId = $this->route('id'); // from /student/update/{id}
                    $student = Student::findOrFail($studentId);

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
                        if (!($studentSuffix === 'JR' && $emergencySuffix === 'SR')) {
                            $fail('Emergency contact name cannot be the same as the student.');
                        }
                    }
                },
            ],
            'emergency_middle_init' => 'nullable|alpha|size:1',
            'emergency_last_name' => 'required|string|max:25',
            'emergency_suffix' => 'nullable|string',

            // 📞 Relationship & contact
            'relationship' => 'required|in:Father,Mother,Brother,Sister,Uncle,Aunt,Cousin,Spouse',
            'contact_number' => 'required|digits:10|starts_with:9',

            // 📍 Address
            'province' => 'required|string',
            'city' => 'required|string',
            'barangay' => 'required|string',
            'zip_code' => 'required|digits:4',

            // 🎓 Academic
            'college' => 'required|string',
            'program' => 'required|string',
            'major' => 'required_if:hasMajor,true|nullable|string',
            'year' => 'required|in:1st Year,2nd Year,3rd Year,4th Year,5th Year',
            'section' => 'required|string',
        ];
    }


    public function messages()
    {
        return [
            // 🧑 Student name
            'first_name.required' => 'First name is required.',
            'last_name.required' => 'Last name is required.',
            'middle_init.alpha' => 'Middle initial must contain letters only.',
            'middle_init.size' => 'Middle initial must be exactly 1 letter.',

            // 🚨 Emergency contact
            'emergency_first_name.required' => 'Emergency contact first name is required.',
            'emergency_middle_init.alpha' => 'Emergency middle initial must contain letters only.',
            'emergency_middle_init.size' => 'Emergency middle initial must be exactly 1 letter.',
            'emergency_last_name.required' => 'Emergency contact last name is required.',

            // 📞 Contact
            'relationship.required' => 'Please enter the relationship of the emergency contact.',
            'contact_number.required' => 'Contact number is required.',
            'contact_number.digits' => 'Contact number must be exactly 10 digits.',
            'contact_number.starts_with' => 'Contact number must start with 9.',

            // 📍 Address
            'province.required' => 'Province is required.',
            'city.required' => 'City is required.',
            'barangay.required' => 'Barangay is required.',
            'zip_code.required' => 'ZIP code is required.',
            'zip_code.digits' => 'ZIP code must be exactly 4 digits.',

            // 🎓 Academic
            'college.required' => 'Please select your college.',
            'program.required' => 'Program field is required.',
            'major.required_if' => 'You must select a major because the chosen program has available majors.',
            'year.required' => 'Year level is required.',
            'section.required' => 'Section is required.',
        ];
    }

}
