<?php

namespace App\Http\Controllers;

use App\Http\Requests\Registration\Step1Request;
use App\Http\Requests\Registration\Step2Request;
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
