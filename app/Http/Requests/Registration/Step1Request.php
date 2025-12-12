<?php

namespace App\Http\Requests\Registration;

use Illuminate\Foundation\Http\FormRequest;

class Step1Request extends FormRequest
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
            'id_type' => 'required|in:new,replacement',
            'id_number' => 'required|unique:students,id_number|max:25',
            'affidavit_img' => 'required_if:id_type,replacement|nullable|mimes:jpg,jpeg|max:5120',
            'receipt_img' => 'required_if:id_type,replacement|nullable|mimes:jpg,jpeg|max:5120',
            'first_name' => 'required',
            'middle_name' => 'nullable|alpha|size:1',
            'last_name' => 'required',
            'suffix' => 'nullable',
            'emergency_first_name' => 'required',
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
            'section' => 'required|size:1'
        ];
    }

    public function messages()
    {
        return [
            // ID Information
            'id_type.required' => 'Please select an ID type.',
            'id_type.in' => 'ID type must be either New or Replacement.',

            'id_number.required' => 'Please enter the ID number.',
            'id_number.unique' => 'This ID number is already registered.',

            // Name Fields
            'first_name.required' => 'First name is required.',
            'middle_name.alpha' => 'Middle initial must contain letters only.',
            'middle_name.size' => 'Middle initial must be exactly 1 letter.',
            'last_name.required' => 'Last name is required.',

            // Emergency Contact Name
            'emergency_first_name.required' => 'Emergency contact first name is required.',
            'emergency_middle_init.alpha' => 'Emergency middle initial must contain letters only.',
            'emergency_middle_init.size' => 'Emergency middle initial must be exactly 1 letter.',
            'emergency_last_name.required' => 'Emergency contact last name is required.',

            // Relationship
            'relationship.required' => 'Please enter the relationship of the emergency contact.',

            // Contact Number
            'contact_number.required' => 'Contact number is required.',
            'contact_number.digits' => 'Contact number must be exactly 10 digits.',
            'contact_number.starts_with' => 'Contact number must start with 9.',

            // Address
            'province.required' => 'Province is required.',
            'city.required' => 'City is required.',
            'barangay.required' => 'Barangay is required.',
            'zip_code.required' => 'ZIP code is required.',
            'zip_code.digits' => 'ZIP code must be exactly 4 digits.',

            // School Information
            'campus.required' => 'Please select your campus.',
            'campus.in' => 'Selected campus is invalid.',

            'college.required' => 'Please select your college.',
            'program.required' => 'Program field is required.',
            'major.required_if' => 'You must select a major because the chosen program has available majors.',

            'year_level.required' => 'Year level is required.',
            'year_level.in' => 'Year level must be from 1 to 5.',
            'year_level.digits' => 'Year level must be a single digit only.',

            'section.required' => 'Section is required.',
        ];
    }

}
