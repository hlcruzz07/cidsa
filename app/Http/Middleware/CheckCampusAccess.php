<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckCampusAccess
{
    /**
     * Handle an incoming request.
     *
     * Super admins bypass the campus check entirely.
     * Admins are only allowed if their assigned campus matches
     * the campus specified in the route parameter or request.
     *
     * Usage:
     *   ->middleware('campus:route_param')   // checks $request->route('campus')
     *   ->middleware('campus')               // checks $request->input('campus') or $request->route('campus')
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string|null  $param  The route/request parameter name that holds the target campus value.
     */
    public function handle(Request $request, Closure $next, string $param = 'campus'): Response
    {
        $user = $request->user();

        // Must be authenticated
        if (! $user) {
            abort(401, 'Unauthenticated.');
        }

        // Super admins bypass all campus restrictions
        if ($user->role === 'super admin') {
            return $next($request);
        }

        // For regular admins, resolve the target campus from the route or request input
        $targetCampus = $request->route($param) ?? $request->input($param);

        // If no target campus could be resolved, deny access to be safe
        if (! $targetCampus) {
            abort(403, 'Campus not specified.');
        }

        // Admin must be assigned to the requested campus
        if ($user->campus !== $targetCampus) {
            abort(403, 'You do not have access to this campus.');
        }

        return $next($request);
    }
}
