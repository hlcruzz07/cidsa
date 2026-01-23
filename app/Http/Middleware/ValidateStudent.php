<?php

namespace App\Http\Middleware;

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

        if (!$isExisting) {
            return redirect()->back()->with('error', 'Invalid student credentials');
        }

        if ($isCompleted) {
            return redirect()->back()->with('warning', 'Student already submitted');
        }

        $request->session()->put([
            'validated_student' => $id_number,
            'validated_student_expires_at' => now()->addMinutes(500),
        ]);

        return $next($request);
    }
}
