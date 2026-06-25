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

        if (!$isExisting) {
            return redirect()->back()->with('error', 'Invalid student credentials');
        }

        $student = $this->students->findStudentByIdNumber($id_number);

        return redirect()->route('student.form')->with([
            'student' => $student
        ]);
    }
}
