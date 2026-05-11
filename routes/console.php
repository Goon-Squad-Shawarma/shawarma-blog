<?php

use App\Jobs\SendDailyDigestJob;
use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('digest:send {--user=}', function () {
    $userOption = $this->option('user');

    $query = User::query()
        ->whereHas('blogs', fn ($q) => $q->where('visibility', 'public')
            ->whereNotNull('published_at')
            ->where('published_at', '>=', now()->subDay())
            ->where('published_at', '<=', now()))
        ->whereHas('followers');

    if ($userOption) {
        $query->where('id', $userOption);
    }

    $authors = $query->get(['id']);

    foreach ($authors as $author) {
        SendDailyDigestJob::dispatch($author->id);
    }

    $this->info("Queued digests for {$authors->count()} author(s).");
})->purpose('Queue daily digest emails for authors who published in the last 24h');

Schedule::command('digest:send')->dailyAt('08:00')->withoutOverlapping();
