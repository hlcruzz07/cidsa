<?php

namespace App\Http\Middleware;

use App\Models\PrintedStudents;
use App\Repositories\StudentRepository;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ValidateStudent
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    protected $students;

    public function __construct(StudentRepository $studentRepository)
    {
        $this->students = $studentRepository;
    }
    public function handle(Request $request, Closure $next): Response
    {
        $id_number = $request->id_number;
        $first_name = $request->first_name;
        $last_name = $request->last_name;

        $isExisting = $this->students->isStudentExisting($id_number, $first_name, $last_name);
        $isCompleted = $this->students->isStudentCompleted($id_number);
        $isPrinted = PrintedStudents::where('id_number', $id_number)->exists();

        if ($isPrinted) {
            return redirect()->back()->with(
                'error',
                'You already have an existing student ID. Please contact our office if you require a replacement or have concerns regarding with your ID.'
            );
        }

        if (!$isExisting) {
            return redirect()->back()->with('error', 'Invalid student credentials');
        }

        if ($isCompleted) {
            return redirect()->back()->with(
                'success',
                'You have already submitted your information. Please wait for the release of your student ID.'
            );
        }

        $request->session()->put([
            'validated_student' => $id_number,
            'validated_student_expires_at' => now()->addMinutes((int) config('session.lifetime', 500)),
        ]);

        return $next($request);
    }
}
