<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function (Response $response, Throwable $e, Request $request) {
            if (! $request->inertia()) {
                return $response;
            }

            $status = $response->getStatusCode();

            if ($status === 403) {
                return redirect()->back()->with('error', "You don't have permission to perform this action.");
            }

            if ($status === 404) {
                return redirect()->back()->with('warning', 'The resource you were looking for could not be found.');
            }

            if (in_array($status, [500, 503])) {
                return Inertia::render('error', [
                    'status' => $status,
                ])->toResponse($request)->setStatusCode($status);
            }
        });
    })->create();
