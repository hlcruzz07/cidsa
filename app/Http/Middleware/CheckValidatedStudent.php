<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckValidatedStudent
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $expiresAt = session('validated_student_expires_at');

        if (
            !session()->has('validated_student') ||
            !$expiresAt ||
            now()->greaterThan($expiresAt)
        ) {
            session()->forget([
                'validated_student',
                'validated_student_expires_at',
            ]);

            return redirect()->route('home');
        }
        return $next($request);
    }
}
