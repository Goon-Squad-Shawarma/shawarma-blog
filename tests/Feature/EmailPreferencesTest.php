<?php

use App\Jobs\SendCampaignJob;
use App\Mail\CampaignMailable;
use App\Models\Campaign;
use App\Models\Follow;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

test('campaign job skips followers who opted out of campaigns', function () {
    Mail::fake();

    $author = User::factory()->create();
    $optedOut = User::factory()->create([
        'email_preferences' => array_merge(User::defaultEmailPreferences(), ['campaigns' => false]),
    ]);
    $optedIn = User::factory()->create();

    Follow::factory()->create(['user_id' => $optedOut->id, 'following_user_id' => $author->id]);
    Follow::factory()->create(['user_id' => $optedIn->id, 'following_user_id' => $author->id]);

    $campaign = Campaign::factory()->create(['user_id' => $author->id, 'organization_id' => null]);

    (new SendCampaignJob($campaign))->handle();

    Mail::assertQueued(CampaignMailable::class, 1);
    Mail::assertQueued(CampaignMailable::class, fn ($mail) => $mail->hasTo($optedIn->email));
    Mail::assertNotQueued(CampaignMailable::class, fn ($mail) => $mail->hasTo($optedOut->email));

    expect($campaign->fresh()->recipient_count)->toBe(1);
});

test('notification settings page renders for authenticated users', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($user)
        ->get(route('notifications.edit'))
        ->assertOk();
});

test('user can update notification preferences', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($user)
        ->patch(route('notifications.update'), [
            'campaigns' => false,
            'daily_digest' => true,
            'digest_frequency' => 'weekly',
        ])
        ->assertRedirect();

    $prefs = $user->refresh()->effectiveEmailPreferences();
    expect($prefs['campaigns'])->toBeFalse();
    expect($prefs['digest_frequency'])->toBe('weekly');
});

test('user has unsubscribe token after creation', function () {
    $user = User::factory()->create();

    expect($user->unsubscribe_token)->not->toBeNull();
    expect(strlen($user->unsubscribe_token))->toBe(48);
});

test('unsubscribe link disables campaigns preference', function () {
    $user = User::factory()->create();

    $this->post(route('unsubscribe.update', ['token' => $user->unsubscribe_token]), [
        'type' => 'campaigns',
    ])->assertRedirect();

    expect($user->refresh()->effectiveEmailPreferences()['campaigns'])->toBeFalse();
});

test('unsubscribe link with all type disables everything', function () {
    $user = User::factory()->create();

    $this->post(route('unsubscribe.update', ['token' => $user->unsubscribe_token]), [
        'type' => 'all',
    ])->assertRedirect();

    $prefs = $user->refresh()->effectiveEmailPreferences();
    expect($prefs['campaigns'])->toBeFalse();
    expect($prefs['daily_digest'])->toBeFalse();
    expect($prefs['digest_frequency'])->toBe('off');
});

test('unsubscribe rejects invalid token', function () {
    $this->post(route('unsubscribe.update', ['token' => 'bogus']), ['type' => 'all'])
        ->assertNotFound();
});
