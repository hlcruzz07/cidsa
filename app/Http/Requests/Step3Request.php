<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class Step3Request extends FormRequest
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
            'confirm_info' => 'required|accepted',
            'data_privacy' => 'required|accepted'
        ];
    }

    public function messages(): array
    {
        return [
            'confirm_info.required' => 'Please confirm that the information you provided is true and correct.',
            'confirm_info.accepted' => 'You must confirm that all provided information is accurate before proceeding.',

            'data_privacy.required' => 'You must agree to the Data Privacy Act to continue.',
            'data_privacy.accepted' => 'Consent to data privacy is required to proceed with your application.',
        ];
    }
}
