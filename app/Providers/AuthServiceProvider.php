<?php

namespace App\Providers;

use App\Models\Blog;
use App\Models\Comment;
use App\Models\Like;
use App\Models\Organization;
use App\Models\User;
use App\Policies\BlogPolicy;
use App\Policies\CommentPolicy;
use App\Policies\LikePolicy;
use App\Policies\OrganizationPolicy;
use App\Policies\UserPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Blog::class => BlogPolicy::class,
        Comment::class => CommentPolicy::class,
        Like::class => LikePolicy::class,
        Organization::class => OrganizationPolicy::class,
        User::class => UserPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
    }
}
