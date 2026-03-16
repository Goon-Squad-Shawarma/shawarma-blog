<?php

use App\Enums\LikeType;
use App\Models\Blog;
use App\Models\Comment;
use App\Models\Like;
use App\Models\User;

// ── Blog likes ──────────────────────────────────────────────────────────────

test('authenticated user can like a blog', function () {
    $user = User::factory()->create();
    $blog = Blog::factory()->create();

    $response = $this->actingAs($user)->postJson(route('likes.store', $blog));

    $response->assertOk()->assertJsonStructure(['liked', 'likes_count']);
    $this->assertDatabaseHas('likes', [
        'user_id' => $user->id,
        'likeable_id' => $blog->id,
        'likeable_type' => Blog::class,
        'type' => LikeType::Like->value,
    ]);
});

test('guest cannot like a blog', function () {
    $blog = Blog::factory()->create();

    $this->postJson(route('likes.store', $blog))->assertUnauthorized();

    $this->assertDatabaseEmpty('likes');
});

test('like is idempotent', function () {
    $user = User::factory()->create();
    $blog = Blog::factory()->create();

    $this->actingAs($user)->postJson(route('likes.store', $blog));
    $this->actingAs($user)->postJson(route('likes.store', $blog));

    expect(Like::where([
        'user_id' => $user->id,
        'likeable_id' => $blog->id,
        'likeable_type' => Blog::class,
    ])->count())->toBe(1);
});

test('authenticated user can unlike a blog', function () {
    $user = User::factory()->create();
    $blog = Blog::factory()->create();
    Like::factory()->forBlog($blog)->byUser($user)->create();

    $response = $this->actingAs($user)->deleteJson(route('likes.destroy', $blog));

    $response->assertOk()->assertJson(['liked' => false]);
    $this->assertDatabaseMissing('likes', [
        'user_id' => $user->id,
        'likeable_id' => $blog->id,
        'likeable_type' => Blog::class,
    ]);
});

test('user cannot unlike a blog they have not liked', function () {
    $user = User::factory()->create();
    $blog = Blog::factory()->create();

    $this->actingAs($user)
        ->deleteJson(route('likes.destroy', $blog))
        ->assertNotFound();
});

// ── Comment likes ────────────────────────────────────────────────────────────

test('authenticated user can thumbs up a comment', function () {
    $user = User::factory()->create();
    $blog = Blog::factory()->create();
    $comment = Comment::factory()->create(['blog_id' => $blog->id]);

    $response = $this->actingAs($user)->postJson(
        route('comment-likes.store', $comment),
        ['type' => 'thumbsup'],
    );

    $response->assertOk()->assertJson(['type' => 'thumbsup']);
    $this->assertDatabaseHas('likes', [
        'user_id' => $user->id,
        'likeable_id' => $comment->id,
        'likeable_type' => Comment::class,
        'type' => LikeType::ThumbsUp->value,
    ]);
});

test('authenticated user can thumbs down a comment', function () {
    $user = User::factory()->create();
    $blog = Blog::factory()->create();
    $comment = Comment::factory()->create(['blog_id' => $blog->id]);

    $response = $this->actingAs($user)->postJson(
        route('comment-likes.store', $comment),
        ['type' => 'thumbsdown'],
    );

    $response->assertOk()->assertJson(['type' => 'thumbsdown']);
    $this->assertDatabaseHas('likes', [
        'user_id' => $user->id,
        'likeable_id' => $comment->id,
        'likeable_type' => Comment::class,
        'type' => LikeType::ThumbsDown->value,
    ]);
});

test('thumbs up toggles off when same reaction repeated', function () {
    $user = User::factory()->create();
    $blog = Blog::factory()->create();
    $comment = Comment::factory()->create(['blog_id' => $blog->id]);
    Like::factory()->thumbsUpForComment($comment)->byUser($user)->create();

    $response = $this->actingAs($user)->postJson(
        route('comment-likes.store', $comment),
        ['type' => 'thumbsup'],
    );

    $response->assertOk()->assertJson(['type' => null]);
    $this->assertDatabaseEmpty('likes');
});

test('thumbs down replaces existing thumbs up', function () {
    $user = User::factory()->create();
    $blog = Blog::factory()->create();
    $comment = Comment::factory()->create(['blog_id' => $blog->id]);
    Like::factory()->thumbsUpForComment($comment)->byUser($user)->create();

    $this->actingAs($user)->postJson(
        route('comment-likes.store', $comment),
        ['type' => 'thumbsdown'],
    );

    expect(Like::where('user_id', $user->id)->count())->toBe(1);
    $this->assertDatabaseHas('likes', [
        'user_id' => $user->id,
        'likeable_id' => $comment->id,
        'likeable_type' => Comment::class,
        'type' => LikeType::ThumbsDown->value,
    ]);
});

test('guest cannot react to a comment', function () {
    $blog = Blog::factory()->create();
    $comment = Comment::factory()->create(['blog_id' => $blog->id]);

    $this->postJson(route('comment-likes.store', $comment), ['type' => 'thumbsup'])
        ->assertUnauthorized();
});
