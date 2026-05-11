<?php

namespace App\Providers;

use App\Enums\OrganizationRole;
use App\Models\Organization;
use App\Services\NovuService;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use OffloadProject\InviteOnly\Events\InvitationAccepted;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(NovuService::class, fn () => new NovuService(
            secretKey: config('novu.secret_key'),
        ));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->registerInvitationListeners();
        $this->registerRateLimiters();
    }

    /**
     * Register event listeners for the invitation system.
     */
    protected function registerInvitationListeners(): void
    {
        Event::listen(InvitationAccepted::class, function (InvitationAccepted $event): void {
            $organization = $event->invitation->invitable;
            $user = $event->user;

            if (! $organization instanceof Organization || ! $user) {
                return;
            }

            $role = $event->invitation->role ?? OrganizationRole::AUTHOR->value;

            $organization->users()->syncWithoutDetaching([
                $user->id => ['role' => $role],
            ]);
        });
    }

    /**
     * Register rate limiters for throttle middleware.
     */
    protected function registerRateLimiters(): void
    {
        RateLimiter::for('follow', fn (Request $request) => Limit::perMinute(30)->by($request->user()?->id ?: $request->ip()));
        RateLimiter::for('bookmarks', fn (Request $request) => Limit::perMinute(60)->by($request->user()?->id ?: $request->ip()));
        RateLimiter::for('campaigns', fn (Request $request) => Limit::perMinute(5)->by($request->user()?->id ?: $request->ip()));
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }
}
