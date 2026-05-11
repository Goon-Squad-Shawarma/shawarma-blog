<?php

namespace App\Jobs;

use App\Mail\CampaignMailable;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class SendCampaignJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public Campaign $campaign)
    {
        $this->onQueue('campaigns');
    }

    public function handle(): void
    {
        if ($this->campaign->user_id) {
            $followers = User::whereHas('followingUsers', fn ($q) => $q->where('following_user_id', $this->campaign->user_id))->get();
        } else {
            $followers = User::whereHas('followingOrganizations', fn ($q) => $q->where('following_organization_id', $this->campaign->organization_id))->get();
        }

        $followers = $followers->filter(fn (User $user) => $user->wantsCampaigns());

        $count = $followers->count();
        $this->campaign->update(['recipient_count' => $count, 'status' => 'sending']);

        foreach ($followers->chunk(50) as $chunk) {
            foreach ($chunk as $follower) {
                $recipient = CampaignRecipient::create([
                    'campaign_id' => $this->campaign->id,
                    'user_id' => $follower->id,
                    'email' => $follower->email,
                    'token' => Str::random(40),
                    'sent_at' => now(),
                ]);

                Mail::to($follower->email)->queue(new CampaignMailable($this->campaign, $follower, $recipient->token));
            }
        }

        $this->campaign->update(['status' => 'sent', 'sent_at' => now()]);
    }

    public function failed(\Throwable $exception): void
    {
        $this->campaign->update(['status' => 'failed']);
    }
}
