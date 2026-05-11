<?php

use App\Jobs\SendCampaignJob;
use App\Models\Campaign;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

test('user can create a draft campaign', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('campaigns.store'), [
        'subject' => 'Test Subject',
        'body' => '<p>Hello</p>',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('campaigns', [
        'user_id' => $user->id,
        'subject' => 'Test Subject',
        'status' => 'draft',
    ]);
});

test('guest cannot create a campaign', function () {
    $this->post(route('campaigns.store'), ['subject' => 'Test', 'body' => 'body'])
        ->assertRedirect(route('login'));
});

test('user can send a draft campaign', function () {
    Queue::fake();
    $user = User::factory()->create();
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'status' => 'draft']);

    $this->actingAs($user)->post(route('campaigns.send', $campaign))->assertRedirect();

    Queue::assertPushedOn('campaigns', SendCampaignJob::class);
    $this->assertDatabaseHas('campaigns', ['id' => $campaign->id, 'status' => 'sending']);
});

test('user cannot send an already sent campaign', function () {
    $user = User::factory()->create();
    $campaign = Campaign::factory()->sent()->create(['user_id' => $user->id]);

    $this->actingAs($user)->post(route('campaigns.send', $campaign))->assertStatus(422);
});

test('user can delete a draft campaign', function () {
    $user = User::factory()->create();
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'status' => 'draft']);

    $this->actingAs($user)->delete(route('campaigns.destroy', $campaign))->assertRedirect();

    $this->assertDatabaseMissing('campaigns', ['id' => $campaign->id]);
});
