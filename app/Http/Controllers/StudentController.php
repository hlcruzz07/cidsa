<?php

namespace App\Http\Controllers;

use App\Exports\StudentsExport;
use App\Http\Requests\Registration\Step1Request;
use App\Http\Requests\Registration\Step2Request;
use App\Http\Requests\Registration\Step3Request;
use App\Models\Student;
use App\Repositories\StudentRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class StudentController extends Controller
{

    protected $students;

    public function __construct(StudentRepository $studentRepository)
    {
        $this->students = $studentRepository;
    }
    public function index()
    {
        return Inertia::render('Home/Index');
    }

    public function validateStepOne(Step1Request $request)
    {
        return back()->with('success', 'Step one completed');
    }

    public function validateStepTwo(Step2Request $request)
    {

        return back()->with('success', 'Step two completed');
    }

    public function store(Step3Request $request)
    {

        $this->students->create($request->all());

        return back()->with('success', 'CIDSA Information submitted.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Student $student)
    {
        //
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Student $student)
    {
        //
    }

    public function export(Request $request)
    {
        // Replace this with DB query if needed
        $students = [
            ['name' => 'Juan Dela Cruz', 'id_number' => '2025-001'],
            ['name' => 'Maria Santos', 'id_number' => '2025-002'],
        ];

        return Excel::download(new StudentsExport($students), 'students.xlsx');
    }
}
