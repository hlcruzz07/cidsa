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
    public function stepOne()
    {
        return Inertia::render('Register/StepOne/Index');
    }

    public function stepTwo()
    {
        return Inertia::render('Register/StepTwo/Index');
    }

    public function storeStepOne(Step1Request $request)
    {
        $validated = $request->validated();

        session()->put('stepOne_data', $validated);

        return redirect()->route('register.stepTwo');
    }


    public function storeStepTwo()
    {

        $stepOne = session('stepOne_data');

        dd($stepOne);

    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {

    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Student $student)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Student $student)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Student $student)
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
