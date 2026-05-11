<?php

use App\Jobs\TrackBlogViewJob;
use App\Models\Blog;
use App\Models\BlogView;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

test('viewing a published blog dispatches TrackBlogViewJob', function () {
    Queue::fake();
    $user = User::factory()->create();
    $blog = Blog::factory()->published()->create();

    $this->actingAs($user)->get(route('blogs.show', $blog));

    Queue::assertPushed(TrackBlogViewJob::class, fn ($job) => $job->blog->id === $blog->id);
});

test('TrackBlogViewJob records a view for authenticated user', function () {
    $user = User::factory()->create();
    $blog = Blog::factory()->published()->create();

    dispatch(new TrackBlogViewJob($blog, $user->id));

    $this->assertDatabaseHas('blog_views', [
        'blog_id' => $blog->id,
        'user_id' => $user->id,
    ]);
});

test('TrackBlogViewJob does nothing for guests', function () {
    $blog = Blog::factory()->published()->create();

    dispatch(new TrackBlogViewJob($blog, null));

    expect(BlogView::where('blog_id', $blog->id)->count())->toBe(0);
});

test('duplicate authenticated user view is not double counted', function () {
    $user = User::factory()->create();
    $blog = Blog::factory()->published()->create();

    dispatch(new TrackBlogViewJob($blog, $user->id));
    dispatch(new TrackBlogViewJob($blog, $user->id));

    expect(BlogView::where('blog_id', $blog->id)->where('user_id', $user->id)->count())->toBe(1);
});
