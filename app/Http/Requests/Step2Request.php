<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class Step2Request extends FormRequest
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
            'picture' => 'required|max:2048',
            'e_signature' => 'required|max:1024',
        ];
    }

    public function messages(): array
    {
        return [
            'picture.required' => 'Please upload your picture.',
            'picture.max' => 'The picture must not be larger than 2MB.',

            'e_signature.required' => 'Please provide your e-signature.',
            'e_signature.max' => 'The e-signature file must not exceed 1MB.',
        ];
    }
}