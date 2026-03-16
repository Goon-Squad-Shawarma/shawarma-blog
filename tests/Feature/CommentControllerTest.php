<?php

use App\Models\Blog;
use App\Models\Comment;
use App\Models\User;

test('authenticated user can post a comment on a blog', function () {
    $user = User::factory()->create();
    $blog = Blog::factory()->create();

    $response = $this->actingAs($user)->post(route('comments.store', $blog), [
        'content' => 'Great post!',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('comments', [
        'blog_id' => $blog->id,
        'user_id' => $user->id,
        'content' => 'Great post!',
    ]);
});

test('guest cannot post a comment', function () {
    $blog = Blog::factory()->create();

    $this->post(route('comments.store', $blog), ['content' => 'Sneaky!'])
        ->assertRedirect(route('login'));

    $this->assertDatabaseEmpty('comments');
});

test('comment content is required', function () {
    $user = User::factory()->create();
    $blog = Blog::factory()->create();

    $this->actingAs($user)
        ->post(route('comments.store', $blog), ['content' => ''])
        ->assertSessionHasErrors('content');
});

test('author can delete their own comment', function () {
    $user = User::factory()->create();
    $blog = Blog::factory()->create();
    $comment = Comment::factory()->create(['user_id' => $user->id, 'blog_id' => $blog->id]);

    $response = $this->actingAs($user)->delete(route('comments.destroy', $comment));

    $response->assertRedirect();
    $this->assertDatabaseMissing('comments', ['id' => $comment->id]);
});

test('user cannot delete another user comment', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $blog = Blog::factory()->create();
    $comment = Comment::factory()->create(['user_id' => $owner->id, 'blog_id' => $blog->id]);

    $this->actingAs($other)
        ->delete(route('comments.destroy', $comment))
        ->assertForbidden();

    $this->assertDatabaseHas('comments', ['id' => $comment->id]);
});
