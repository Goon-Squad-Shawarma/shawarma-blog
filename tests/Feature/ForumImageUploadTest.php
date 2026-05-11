<?php

use App\Models\Thread;
use App\Models\ThreadReply;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('s3');
});

test('user can create a thread with an image', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $file = UploadedFile::fake()->image('thread.jpg', 800, 600);

    $response = $this->actingAs($user)->post(route('forums.store'), [
        'title' => 'Hello world from a test',
        'body' => 'Some body content here long enough.',
        'category' => 'questions',
        'image' => $file,
    ]);

    $response->assertRedirect();

    $thread = Thread::query()->latest('id')->first();
    expect($thread)->not->toBeNull();
    expect($thread->image_url)->not->toBeNull();
    expect($thread->image_url)->toContain('forums/');

    $path = 'forums/'.basename(parse_url($thread->image_url, PHP_URL_PATH));
    Storage::disk('s3')->assertExists($path);
});

test('user can create a thread without an image', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($user)->post(route('forums.store'), [
        'title' => 'Hello world from a test',
        'body' => 'Some body content here long enough.',
        'category' => 'community',
    ])->assertRedirect();

    expect(Thread::query()->latest('id')->first()->image_url)->toBeNull();
});

test('thread image must be a real image', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $file = UploadedFile::fake()->create('not-an-image.pdf', 100, 'application/pdf');

    $this->actingAs($user)->post(route('forums.store'), [
        'title' => 'Hello world from a test',
        'body' => 'Some body content here long enough.',
        'category' => 'community',
        'image' => $file,
    ])->assertSessionHasErrors('image');
});

test('user can reply to a thread with an image', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $thread = Thread::factory()->create();
    $file = UploadedFile::fake()->image('reply.png', 400, 400);

    $this->actingAs($user)->post(route('forums.replies.store', $thread), [
        'body' => 'A reply with an image',
        'image' => $file,
    ])->assertRedirect();

    $reply = ThreadReply::query()->latest('id')->first();
    expect($reply->image_url)->not->toBeNull();
});
