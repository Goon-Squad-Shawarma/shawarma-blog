<?php

use App\Models\Blog;
use App\Models\Follow;
use App\Models\User;

test('dashboard page loads for authenticated user', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get(route('dashboard'))->assertOk();
});

test('guest is redirected from dashboard', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('following feed shows blogs from followed users', function () {
    $follower = User::factory()->create();
    $author = User::factory()->create();
    Follow::factory()->create(['user_id' => $follower->id, 'following_user_id' => $author->id]);
    $blog = Blog::factory()->published()->create(['user_id' => $author->id]);

    $response = $this->actingAs($follower)->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->has('followingBlogs.data', 1)
        ->where('followingBlogs.data.0.id', $blog->id)
    );
});

test('discover feed shows public published blogs', function () {
    $user = User::factory()->create();
    Blog::factory()->published()->count(3)->create();

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->has('discoverBlogs'));
});
