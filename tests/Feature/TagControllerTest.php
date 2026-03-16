<?php

use App\Models\Tag;
use App\Models\User;
use Illuminate\Support\Facades\Route;

test('anyone can search tags', function () {
    Tag::factory()->createMany([
        ['name' => 'Laravel', 'slug' => 'laravel'],
        ['name' => 'React', 'slug' => 'react'],
        ['name' => 'Vue', 'slug' => 'vue'],
    ]);

    $response = $this->getJson(route('tags.search', ['q' => 'la']));

    $response->assertOk()
        ->assertJsonCount(1)
        ->assertJsonFragment(['name' => 'Laravel']);
});

test('search with no query returns all tags', function () {
    Tag::factory()->count(5)->create();

    $response = $this->getJson(route('tags.search'));

    $response->assertOk()
        ->assertJsonCount(5);
});

test('authenticated users can create a new tag', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->postJson(route('tags.store'), ['name' => 'Brand New Tag']);

    $response->assertCreated()
        ->assertJsonFragment(['name' => 'Brand New Tag', 'slug' => 'brand-new-tag']);

    $this->assertDatabaseHas('tags', ['slug' => 'brand-new-tag']);
});

test('creating a tag with a duplicate slug returns the existing tag', function () {
    $existing = Tag::factory()->create(['name' => 'Laravel', 'slug' => 'laravel']);
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->postJson(route('tags.store'), ['name' => 'Laravel']);

    $response->assertOk()
        ->assertJsonFragment(['id' => $existing->id, 'slug' => 'laravel']);

    $this->assertDatabaseCount('tags', 1);
});

test('tags store route requires authentication', function () {
    $route = Route::getRoutes()->getByName('tags.store');
    expect($route->gatherMiddleware())->toContain('auth');
});

test('tag name is required when creating', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('tags.store'), [])
        ->assertSessionHasErrors(['name']);
});
