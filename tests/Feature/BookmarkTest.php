<?php

use App\Models\Blog;
use App\Models\Bookmark;
use App\Models\User;

test('authenticated user can bookmark a blog', function () {
    $user = User::factory()->create();
    $blog = Blog::factory()->create();

    $response = $this->actingAs($user)->postJson(route('bookmarks.store', $blog));

    $response->assertOk();
    $this->assertDatabaseHas('bookmarks', [
        'user_id' => $user->id,
        'blog_id' => $blog->id,
    ]);
});

test('guest cannot bookmark a blog', function () {
    $blog = Blog::factory()->create();

    $this->postJson(route('bookmarks.store', $blog))->assertUnauthorized();

    $this->assertDatabaseEmpty('bookmarks');
});

test('bookmark is idempotent', function () {
    $user = User::factory()->create();
    $blog = Blog::factory()->create();

    $this->actingAs($user)->postJson(route('bookmarks.store', $blog));
    $this->actingAs($user)->postJson(route('bookmarks.store', $blog));

    expect(Bookmark::where(['user_id' => $user->id, 'blog_id' => $blog->id])->count())->toBe(1);
});

test('user can remove a bookmark', function () {
    $user = User::factory()->create();
    $blog = Blog::factory()->create();
    Bookmark::factory()->create(['user_id' => $user->id, 'blog_id' => $blog->id]);

    $response = $this->actingAs($user)->deleteJson(route('bookmarks.destroy', $blog));

    $response->assertOk();
    $this->assertDatabaseMissing('bookmarks', [
        'user_id' => $user->id,
        'blog_id' => $blog->id,
    ]);
});

test('bookmarks index page returns paginated bookmarks', function () {
    $user = User::factory()->create();
    $blogs = Blog::factory(3)->create();
    foreach ($blogs as $blog) {
        Bookmark::factory()->create(['user_id' => $user->id, 'blog_id' => $blog->id]);
    }

    $this->actingAs($user)->get(route('bookmarks.index'))->assertOk();
});
