<?php

namespace App\Http\Controllers;

use App\Http\Requests\ValidateStaffRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StaffController extends Controller
{
    public function validate(ValidateStaffRequest $request)
    {
        return back()->with('error', 'This module is currently under development.');

        $data = $request->validated();

        $employee = DB::connection('armvs')
            ->table('tbl_employee')
            ->join('tbl_campus', 'tbl_employee.campus_id', '=', 'tbl_campus.id')
            ->join('tbl_designation', 'tbl_employee.designation_id', '=', 'tbl_designation.id')
            ->join('tbl_department', 'tbl_employee.department_id', '=', 'tbl_department.id')
            ->where('tbl_employee.digital_id', trim($data['digital_id']))
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

        session([
            'staff_data' => [
                'digital_id' => $employee->digital_id,
                'name' => collect([
                    strtoupper($employee->fname),
                    empty($employee->mname)
                    ? null
                    : (str_ends_with($employee->mname, '.')
                        ? strtoupper($employee->mname)
                        : strtoupper($employee->mname) . '.'),
                    strtoupper($employee->lname),
                ])->filter()->join(' '),
                'campus' => strtoupper($employee->campus),
                'designation' => null,
                'department' => strtoupper($employee->department) === 'NO DEPARTMENT' ? null : strtoupper($employee->department),
            ]
        ]);

        return redirect()->route('form.staff');
    }

    public function form()
    {
        $staff = session('staff_data');

        if (!$staff) {
            return redirect()->route('home');
        }

        $departments = DB::connection('armvs')
            ->table('tbl_department')
            ->where('department', '!=', 'No Department')
            ->orderBy('department', 'asc')
            ->pluck('department')
            ->toArray();


        return Inertia::render('Staff/Index', [
            'staff' => $staff,
            'departments' => $departments
        ]);
    }

    public function store(Request $request)
    {
        dd($request->all());
    }

}
