<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckStudentHasSession
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $expiresAt = session('validated_student_expires_at');

        // ✅ Has valid, non-expired session → go to form
        if (
            session()->has('validated_student') &&
            $expiresAt &&
            now()->lessThanOrEqualTo($expiresAt)
        ) {
            return redirect()->route('student.form');
        }

        // ❌ No session or expired → continue (show validation page)
        return $next($request);
    }
}
