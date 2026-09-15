<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;

class ValidateStaffRequest extends FormRequest
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
            'digital_id' => [
                'required',
                'string',
                function (string $attribute, mixed $value, $fail) {
                    $employee = DB::connection('armvs')
                        ->table('tbl_employee')
                        ->join('tbl_campus', 'tbl_employee.campus_id', '=', 'tbl_campus.id')
                        ->join('tbl_designation', 'tbl_employee.designation_id', '=', 'tbl_designation.id')
                        ->join('tbl_department', 'tbl_employee.department_id', '=', 'tbl_department.id')
                        ->where('tbl_employee.digital_id', trim($value))
                        ->select(
                            'tbl_employee.digital_id',
                            'tbl_employee.fname',
                            'tbl_employee.mname',
                            'tbl_employee.lname',
                            'tbl_campus.campus',
                            'tbl_designation.designation',
                            'tbl_department.department'
                        )
                        ->first();

                    if (!$employee) {
                        $fail('Faculty / Staff not found.');
                        return;
                    }

                    $designation = strtolower(trim((string) ($employee->designation)));

                    if (in_array($designation, ['Part Time', 'Jpa', 'Guard'], true)) {
                        $fail('Your designation is not eligible for requesting an ID.');
                    }
                },
            ],
        ];
    }
}
