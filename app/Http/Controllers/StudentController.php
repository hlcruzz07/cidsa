<?php

namespace App\Http\Controllers;

use App\Http\Requests\Registration\Step1Request;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('Register/StepOne/Index');
    }

    public function validateStepOne(Step1Request $request)
    {
        return $request;
    }

    public function validateStepTwo(Step1Request $request)
    {
        return $request;
    }

    public function store(Request $request)
    {
        // $this->validateStepOne($request);
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
