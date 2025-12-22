<?php

namespace App\Http\Controllers;

use App\Http\Requests\Registration\Step1Request;
use App\Http\Requests\Registration\Step2Request;
use App\Http\Requests\Registration\Step3Request;
use App\Models\Student;
use App\Repositories\StudentRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

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

        return redirect()->route('home')
            ->with('success', 'CIDSA Information submitted.');
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
}
