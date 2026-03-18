<?php

use App\Enums\OrganizationRole;
use App\Models\Blog;
use App\Models\Organization;
use App\Models\User;

test('user can create a blog under their personal account', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('blogs.store'), [
            'title' => 'My Personal Post',
            'content' => json_encode(['root' => ['children' => []]]),
            'visibility' => 'public',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('blogs', [
        'user_id' => $user->id,
        'organization_id' => null,
        'title' => 'My Personal Post',
    ]);
});

test('org member can create a blog under their organization', function () {
    $user = User::factory()->create();
    $organization = Organization::factory()->create();
    $organization->users()->attach($user->id, ['role' => OrganizationRole::AUTHOR->value]);

    $this->actingAs($user)
        ->post(route('blogs.store'), [
            'title' => 'Org Post',
            'content' => json_encode(['root' => ['children' => []]]),
            'visibility' => 'public',
            'organization_id' => $organization->id,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('blogs', [
        'user_id' => $user->id,
        'organization_id' => $organization->id,
        'title' => 'Org Post',
    ]);
});

test('non-member cannot create a blog under an organization', function () {
    $user = User::factory()->create();
    $organization = Organization::factory()->create();

    $this->actingAs($user)
        ->post(route('blogs.store'), [
            'title' => 'Sneaky Post',
            'content' => json_encode(['root' => ['children' => []]]),
            'visibility' => 'public',
            'organization_id' => $organization->id,
        ])
        ->assertForbidden();

    $this->assertDatabaseMissing('blogs', ['title' => 'Sneaky Post']);
});

test('blog create page passes user organizations to frontend', function () {
    $user = User::factory()->create();
    $organization = Organization::factory()->create();
    $organization->users()->attach($user->id, ['role' => OrganizationRole::EDITOR->value]);

    $response = $this->actingAs($user)->get(route('blogs.create'));

    $response->assertInertia(fn ($page) => $page
        ->component('blogs/create')
        ->has('organizations', 1),
    );
});

test('blog create page shows no organizations for users without memberships', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('blogs.create'));

    $response->assertInertia(fn ($page) => $page
        ->component('blogs/create')
        ->has('organizations', 0),
    );
});

test('user can change an existing blog to be under an organization', function () {
    $user = User::factory()->create();
    $organization = Organization::factory()->create();
    $organization->users()->attach($user->id, ['role' => OrganizationRole::AUTHOR->value]);

    $blog = Blog::factory()->create(['user_id' => $user->id, 'organization_id' => null]);

    $this->actingAs($user)
        ->patch(route('blogs.update', $blog), [
            'title' => $blog->title,
            'content' => $blog->content,
            'visibility' => 'public',
            'organization_id' => $organization->id,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('blogs', [
        'id' => $blog->id,
        'organization_id' => $organization->id,
    ]);
});

test('blog edit page passes user organizations to frontend', function () {
    $user = User::factory()->create();
    $organization = Organization::factory()->create();
    $organization->users()->attach($user->id, ['role' => OrganizationRole::ADMIN->value]);

    $blog = Blog::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->get(route('blogs.edit', $blog));

    $response->assertInertia(fn ($page) => $page
        ->component('blogs/edit')
        ->has('organizations', 1),
    );
});
