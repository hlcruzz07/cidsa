<?php

namespace App\Http\Middleware;

use App\Repositories\StudentRepository;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckStudentExportable
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
        $id = $request->route('id');

        $isCompleted = $this->students->isStudentCompletedById($id);

        if (!$isCompleted) {
            return redirect()->back()->with('error', 'Student data is not completed.');
        }

        return $next($request);
    }
}