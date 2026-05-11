<?php

namespace App\Jobs;

use App\Mail\DailyDigestMailable;
use App\Models\Blog;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable as QueueableTrait;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;

class SendDailyDigestJob implements ShouldQueue
{
    use QueueableTrait;

    public function __construct(public int $authorId, public ?int $since = null)
    {
        $this->onQueue('campaigns');
    }

    public function handle(): void
    {
        $author = User::find($this->authorId);
        if (! $author) {
            return;
        }

        $since = $this->since
            ? Carbon::createFromTimestamp($this->since)
            : now()->subDay();

        $blogs = Blog::query()
            ->where('user_id', $author->id)
            ->where('visibility', 'public')
            ->whereNotNull('published_at')
            ->where('published_at', '>=', $since)
            ->where('published_at', '<=', now())
            ->latest('published_at')
            ->get(['id', 'title', 'subtitle', 'slug', 'banner_url', 'reading_time', 'published_at']);

        if ($blogs->isEmpty()) {
            return;
        }

        $followerIds = $author->followers()->pluck('users.id');

        foreach ($followerIds->chunk(50) as $chunk) {
            $followers = User::whereIn('id', $chunk)->get(['id', 'email', 'first_name', 'email_preferences']);
            foreach ($followers as $follower) {
                if (! $follower->wantsDailyDigest()) {
                    continue;
                }
                $freq = $follower->effectiveEmailPreferences()['digest_frequency'] ?? 'daily';
                if ($freq === 'weekly' && ! now()->isMonday()) {
                    continue;
                }
                Mail::to($follower->email)->queue(new DailyDigestMailable($author, $follower, $blogs));
            }
        }
    }
}
