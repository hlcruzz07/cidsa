<?php

namespace App\Http\Requests\Registration;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class Step1Request extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_type' => ['required', Rule::in(['new', 'replacement'])],
            'id_number' => [
                'required',
                'max:25',
                $this->id_type === 'new'
                ? Rule::unique('students', 'id_number')
                    ->where(fn($query) => $query->where('id_type', 'new'))
                : null,
            ],
            'affidavit_img' => 'required_if:id_type,replacement|nullable|mimes:jpg,jpeg|max:5120',
            'receipt_img' => 'required_if:id_type,replacement|nullable|mimes:jpg,jpeg|max:5120',

            'first_name' => 'required',
            'middle_name' => 'nullable|alpha|size:1',
            'last_name' => 'required',
            'suffix' => 'nullable',

            // Custom rule for emergency contact vs student
            'emergency_first_name' => [
                'required',
                function ($attribute, $value, $fail) {
                    $studentFirst = $this->first_name;
                    $studentLast = $this->last_name;
                    $studentSuffix = $this->suffix;
                    $emergencyLast = $this->emergency_last_name;
                    $emergencySuffix = $this->emergency_suffix;

                    // Check if full name matches
                    if (
                        strtolower($value) === strtolower($studentFirst) &&
                        strtolower($emergencyLast) === strtolower($studentLast)
                    ) {
                        // Allow if suffixes match Sr./Jr.
                        if (
                            !(
                                strtolower($emergencySuffix) === 'sr.' &&
                                strtolower($studentSuffix) === 'jr.'
                            )
                        ) {
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

            'campus' => 'required|in:Talisay,Binalbagan,Fortune Towne,Alijis',
            'college' => 'required',
            'program' => 'required',
            'major' => 'required_if:hasMajor,true|nullable',

            'year_level' => 'required|in:1,2,3,4,5|digits:1',
            'section' => 'required|min:1|max:2',


        ];
    }

    public function messages()
    {
        return [
            'id_type.required' => 'Please select an ID type.',
            'id_type.in' => 'ID type must be either New or Replacement.',

            'id_number.required' => 'Please enter the ID number.',
            'id_number.unique' => 'The ID number is already registered for a new ID. Please enter a different one.',

            'first_name.required' => 'First name is required.',
            'middle_name.alpha' => 'Middle initial must contain letters only.',
            'middle_name.size' => 'Middle initial must be exactly 1 letter.',
            'last_name.required' => 'Last name is required.',

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
            'campus.in' => 'Selected campus is invalid.',

            'college.required' => 'Please select your college.',
            'program.required' => 'Program field is required.',
            'major.required_if' => 'You must select a major because the chosen program has available majors.',

            'year_level.required' => 'Year level is required.',
            'year_level.in' => 'Year level must be from 1 to 5.',
            'year_level.digits' => 'Year level must be a single digit only.',

            'section.required' => 'Section is required.',

            'affidavit_img.required_if' =>
                'An affidavit image is required when applying for a replacement ID.',
            'affidavit_img.mimes' => 'The affidavit must be a JPG or JPEG image.',
            'affidavit_img.max' => 'The affidavit image must not exceed 5 MB.',

            'receipt_img.required_if' =>
                'A receipt image is required when applying for a replacement ID.',
            'receipt_img.mimes' => 'The receipt must be a JPG or JPEG image.',
            'receipt_img.max' => 'The receipt image must not exceed 5 MB.',
        ];
    }
}
