<?php

namespace App\Http\Requests;

use App\Models\Student;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class CompleteStudentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return session()->has('validated_student');
    }

    protected function failedAuthorization()
    {
        throw new HttpResponseException(
            redirect()->route('home')->with('error', 'Session Expired')
        );
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {

        return [

            'type' => [
                'required',
                'in:new,replacement',
                function ($attribute, $value, $fail) {
                    $student = Student::where(
                        'id_number',
                        session('validated_student')
                    )->first();

                    if (!$student) {
                        return;
                    }

                    // NEW application
                    if ($value === 'new') {

                        if ($student->printed()->exists()) {
                            $fail(
                                'Your ID has already been printed. If you need changes or a new ID, please submit a Replacement request instead.'
                            );

                            return;
                        }

                        if ($student->is_completed) {
                            $fail(
                                'You have already submitted your ID application. Your ID is currently being processed for printing. Please wait for the official announcement regarding the release schedule.'
                            );
                        }
                    }

                    // REPLACEMENT application
                    if ($value === 'replacement') {

                        $hasPendingReplacement = $student->replacements()
                            ->where('is_printed', false)
                            ->exists();

                        if ($hasPendingReplacement) {
                            $fail(
                                'You already have a pending replacement request. Please wait for it to be printed before submitting another replacement request.'
                            );
                        }
                    }
                },
            ],
            'receipt' => [
                'required_if:type,replacement',
                'max:2048',
            ],

            'reason' => [
                'nullable',
                'string',
                'max:250',
            ],
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
                        if (!($studentSuffix === 'JR' && $emergencySuffix === 'SR')) {
                            $fail('Emergency contact name cannot be the same as the student.');
                        }
                    }
                },
            ],
            'emergency_middle_init' => 'nullable|alpha|size:1',
            'emergency_last_name' => 'required',
            'emergency_suffix' => 'nullable',

            'relationship' => 'required',
            'contact_number' => 'required|digits:10|starts_with:9',

            'province' => 'required',
            'city' => 'required',
            'barangay' => 'required',
            'zip_code' => 'required|digits:4',
            'campus' => 'required',
            'college' => 'required',
            'program' => 'required',
            'major' => 'required_if:hasMajor,true|nullable',
            'year' => 'required|in:1st Year,2nd Year,3rd Year,4th Year,5th Year',


            'picture' => 'required|max:2048',
            'e_signature' => 'required|max:1024',

            'confirm_info' => 'required|accepted',
            'data_privacy' => 'required|accepted'
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
            'campus.required' => 'Please select your campus.',
            'college.required' => 'Please select your college.',
            'program.required' => 'Program field is required.',
            'major.required_if' => 'You must select a major because the chosen program has available majors.',

            'picture.required' => 'Please upload your picture.',
            'picture.max' => 'The picture must not be larger than 2MB.',

            'e_signature.required' => 'Please provide your e-signature.',
            'e_signature.max' => 'The e-signature file must not exceed 1MB.',

            'confirm_info.required' => 'Please confirm that the information you provided is true and correct.',
            'confirm_info.accepted' => 'You must confirm that all provided information is accurate before proceeding.',

            'data_privacy.required' => 'You must agree to the Data Privacy Act to continue.',
            'data_privacy.accepted' => 'Consent to data privacy is required to proceed with your application.',
        ];
    }
}
