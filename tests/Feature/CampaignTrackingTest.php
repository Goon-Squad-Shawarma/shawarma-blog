<?php

use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Models\User;

it('records first open and increments campaign opened_count', function () {
    $campaign = Campaign::factory()->sent()->create(['recipient_count' => 1, 'opened_count' => 0]);
    $user = User::factory()->create();
    $recipient = CampaignRecipient::create([
        'campaign_id' => $campaign->id,
        'user_id' => $user->id,
        'email' => $user->email,
        'token' => 'test-token-123',
        'sent_at' => now(),
    ]);

    $response = $this->get(route('campaigns.track.open', ['token' => 'test-token-123']));

    $response->assertOk()->assertHeader('Content-Type', 'image/gif');

    $recipient->refresh();
    expect($recipient->opened_at)->not->toBeNull()
        ->and($recipient->open_count)->toBe(1);

    expect($campaign->fresh()->opened_count)->toBe(1);
});

it('only increments campaign opened_count once per recipient', function () {
    $campaign = Campaign::factory()->sent()->create(['recipient_count' => 1, 'opened_count' => 0]);
    $user = User::factory()->create();
    CampaignRecipient::create([
        'campaign_id' => $campaign->id,
        'user_id' => $user->id,
        'email' => $user->email,
        'token' => 'tok-abc',
        'sent_at' => now(),
    ]);

    $this->get(route('campaigns.track.open', ['token' => 'tok-abc']))->assertOk();
    $this->get(route('campaigns.track.open', ['token' => 'tok-abc']))->assertOk();
    $this->get(route('campaigns.track.open', ['token' => 'tok-abc']))->assertOk();

    expect($campaign->fresh()->opened_count)->toBe(1);
    expect(CampaignRecipient::where('token', 'tok-abc')->first()->open_count)->toBe(3);
});

it('returns a pixel even for an unknown token', function () {
    $this->get(route('campaigns.track.open', ['token' => 'nope']))
        ->assertOk()
        ->assertHeader('Content-Type', 'image/gif');
});
