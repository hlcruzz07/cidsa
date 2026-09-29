<?php

use App\Http\Middleware\CheckCampusAccess;
use App\Http\Middleware\CheckStudentHasSession;
use App\Http\Middleware\CheckUserRole;
use App\Http\Middleware\CheckValidatedStudent;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\ValidateStudent;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        // Middleware aliases here
        $middleware->alias([
            'check.role' => CheckUserRole::class,
            'campus' => CheckCampusAccess::class,
            'validate.student' => ValidateStudent::class,
            'student.validated' => CheckValidatedStudent::class,
            'student.has.session' => CheckStudentHasSession::class,
        ]);
        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,


        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function ($response, Throwable $e, Request $request) {
            if ($response->getStatusCode() === 403 && !$request->expectsJson()) {
                return Inertia::render('Errors/Forbidden', [
                    'message' => $e instanceof HttpExceptionInterface ? $e->getMessage() : null,
                ])
                    ->toResponse($request)
                    ->setStatusCode(403);
            }

            return $response;
        });
    })->create();
