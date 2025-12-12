<?php

namespace App\Http\Requests\Registration;

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
            'picture' => 'required|mimes:jpg|max:2048',
            'e_signature' => 'required|mimes:jpg|max:1024'

        ];
    }

    public function messages()
    {
        return [
            'picture.required' => 'Please upload your picture.',
            'picture.mimes' => 'The picture must be in JPG format only.',
            'picture.image' => 'The uploaded file must be a valid image.',
            'picture.max' => 'The picture must not be larger than 2MB.',

            'e_signature.required' => 'Please provide your e-signature.',
            'e_signature.mimes' => 'The e-signature must be in BMP format.',
            'e_signature.image' => 'The e-signature must be a valid image.',
            'e_signature.max' => 'The e-signature file must not exceed 1MB.',
        ];
    }
}
