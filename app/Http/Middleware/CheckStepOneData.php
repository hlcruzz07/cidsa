<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckStepOneData
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        $hasStepOne = session()->has('stepOne_data');

        // If user tries to access Step Two (or higher) without Step One completed
        if (!$hasStepOne && $request->routeIs('register.stepTwo')) {
            return redirect()
                ->route('register.stepOne')
                ->with('warning', 'Please complete Step 1 before proceeding.');
        }

        // If user tries to access Step One but they already completed it
        // if ($hasStepOne && $request->routeIs('register.stepOne')) {
        //     return redirect()
        //         ->route('register.stepTwo')
        //         ->with('warning', 'You already completed Step 1.');
        // }

        return $next($request);
    }

}
