<?php

use App\Enums\OrganizationRole;
use App\Models\Blog;
use App\Models\BlogView;
use App\Models\Bookmark;
use App\Models\Campaign;
use App\Models\Like;
use App\Models\Organization;
use App\Models\User;

it('renders personal analytics for an authenticated user', function () {
    $user = User::factory()->create();
    $blog = Blog::factory()->create(['user_id' => $user->id, 'organization_id' => null]);

    BlogView::factory()->count(3)->create(['blog_id' => $blog->id]);
    Like::factory()->count(2)->create(['likeable_id' => $blog->id, 'likeable_type' => Blog::class]);
    Bookmark::factory()->create(['blog_id' => $blog->id]);

    $this->actingAs($user)
        ->get(route('analytics.personal'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('analytics/personal')
            ->where('totals.blogs', 1)
            ->where('totals.views', 3)
            ->where('totals.likes', 2)
            ->where('totals.bookmarks', 1)
            ->has('engagement', 30)
            ->has('followerSeries', 30)
            ->has('topBlogs', 1)
        );
});

it('excludes other users blogs from personal analytics', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $mine = Blog::factory()->create(['user_id' => $user->id, 'organization_id' => null]);
    $theirs = Blog::factory()->create(['user_id' => $other->id, 'organization_id' => null]);

    BlogView::factory()->count(5)->create(['blog_id' => $mine->id]);
    BlogView::factory()->count(7)->create(['blog_id' => $theirs->id]);

    $this->actingAs($user)
        ->get(route('analytics.personal'))
        ->assertInertia(fn ($page) => $page->where('totals.views', 5)->where('totals.blogs', 1));
});

it('excludes organization-owned blogs from personal analytics', function () {
    $user = User::factory()->create();
    $org = Organization::factory()->create();
    $personal = Blog::factory()->create(['user_id' => $user->id, 'organization_id' => null]);
    Blog::factory()->create(['user_id' => $user->id, 'organization_id' => $org->id]);

    BlogView::factory()->count(2)->create(['blog_id' => $personal->id]);

    $this->actingAs($user)
        ->get(route('analytics.personal'))
        ->assertInertia(fn ($page) => $page->where('totals.blogs', 1)->where('totals.views', 2));
});

it('renders organization analytics for a member', function () {
    $user = User::factory()->create();
    $org = Organization::factory()->create();
    $org->users()->attach($user->id, ['role' => OrganizationRole::ADMIN->value]);
    $blog = Blog::factory()->create(['user_id' => $user->id, 'organization_id' => $org->id]);

    BlogView::factory()->count(4)->create(['blog_id' => $blog->id]);
    Campaign::factory()->sent()->create(['user_id' => $user->id, 'organization_id' => $org->id]);

    $this->actingAs($user)
        ->get(route('analytics.organization', $org))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('analytics/organization')
            ->where('organization.id', $org->id)
            ->where('totals.blogs', 1)
            ->where('totals.views', 4)
            ->where('totals.campaigns_sent', 1)
            ->has('campaigns', 1)
        );
});

it('forbids organization analytics for non-members', function () {
    $user = User::factory()->create();
    $org = Organization::factory()->create();

    $this->actingAs($user)
        ->get(route('analytics.organization', $org))
        ->assertForbidden();
});

it('requires authentication for analytics pages', function () {
    $org = Organization::factory()->create();

    $this->get(route('analytics.personal'))->assertRedirect(route('login'));
    $this->get(route('analytics.organization', $org))->assertRedirect(route('login'));
});
