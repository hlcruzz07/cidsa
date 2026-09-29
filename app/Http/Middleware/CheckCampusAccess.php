<?php

namespace App\Http\Middleware;

use App\Enums\UserCampus;
use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckCampusAccess
{
    public function handle(Request $request, Closure $next, string $param = 'campus'): Response
    {
        $user = $request->user();

        // Must be authenticated
        if (!$user) {
            return redirect()->route('login');
        }

        // Super admins bypass all campus restrictions
        if ($user->role === UserRole::SUPER_ADMIN->value) {
            return $next($request);
        }

        // For regular admins, resolve the target campus from the route or request input
        $targetCampusRaw = $request->route($param) ?? $request->input($param);

        // If no target campus could be resolved, deny access to be safe
        if (!$targetCampusRaw) {
            abort(403, 'User Unauthorized');
        }

        $targetCampus = UserCampus::fromLabelOrValue((string) $targetCampusRaw);

        if (!$targetCampus) {
            abort(403, 'User Unauthorized');
        }

        // Admin must be assigned to the requested campus
        if ($user->campus !== $targetCampus->value) {
            abort(403, 'User Unauthorized');
        }

        return $next($request);
    }
}