<?php
use App\Http\Middleware\CheckStudentComplete;
use App\Http\Middleware\CheckStudentExportable;
use App\Http\Middleware\CheckStudentHasSession;
use App\Http\Middleware\CheckStudentInfo;
use App\Http\Middleware\CheckUserRole;
use App\Http\Middleware\CheckValidatedStudent;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\StudentSuccess;
use App\Http\Middleware\ValidateStudent;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

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
        //
    })->create();
