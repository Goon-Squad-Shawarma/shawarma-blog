<?php

use App\Models\Follow;
use App\Models\Organization;
use App\Models\User;

test('authenticated user can follow an organization', function () {
    $user = User::factory()->create();
    $organization = Organization::factory()->create();

    $this->actingAs($user)
        ->post(route('organizations.follow', $organization))
        ->assertRedirect();

    $this->assertDatabaseHas('follows', [
        'user_id' => $user->id,
        'following_organization_id' => $organization->id,
    ]);
});

test('authenticated user can unfollow an organization', function () {
    $user = User::factory()->create();
    $organization = Organization::factory()->create();

    Follow::create([
        'user_id' => $user->id,
        'following_organization_id' => $organization->id,
    ]);

    $this->actingAs($user)
        ->delete(route('organizations.unfollow', $organization))
        ->assertRedirect();

    $this->assertDatabaseMissing('follows', [
        'user_id' => $user->id,
        'following_organization_id' => $organization->id,
    ]);
});

test('following an organization is idempotent', function () {
    $user = User::factory()->create();
    $organization = Organization::factory()->create();

    $this->actingAs($user)->post(route('organizations.follow', $organization));
    $this->actingAs($user)->post(route('organizations.follow', $organization));

    expect(Follow::where('user_id', $user->id)->where('following_organization_id', $organization->id)->count())->toBe(1);
});

test('guest cannot follow an organization', function () {
    $organization = Organization::factory()->create();

    $this->post(route('organizations.follow', $organization))
        ->assertRedirect(route('login'));

    $this->assertDatabaseEmpty('follows');
});

test('organization show page includes follow state and followers count', function () {
    $user = User::factory()->create();
    $organization = Organization::factory()->create();

    Follow::create([
        'user_id' => $user->id,
        'following_organization_id' => $organization->id,
    ]);

    $response = $this->actingAs($user)->get(route('organizations.show', $organization));

    $response->assertInertia(fn ($page) => $page
        ->component('organizations/show')
        ->where('isFollowing', true)
        ->where('followersCount', 1),
    );
});
