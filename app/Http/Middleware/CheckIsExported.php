<?php

namespace App\Http\Middleware;

use App\Repositories\StudentRepository;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckIsExported
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

        $result = $this->students->isStudentExported($id);
        if ($result) {
            return back()->with('error', 'Student already exported');
        }
        return $next($request);
    }
}
