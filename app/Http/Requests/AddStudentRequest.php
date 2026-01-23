<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AddStudentRequest extends FormRequest
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
            'id_number' => 'required|unique:students,id_number|max:25',
            'first_name' => 'required|max:25',
            'middle_init' => 'nullable|max:1',
            'last_name' => 'required|max:25',
            'suffix' => 'nullable|max:5',
            'campus' => 'required|in:Talisay,Alijis,Binalbagan,Fortune Towne',
        ];
    }
}
