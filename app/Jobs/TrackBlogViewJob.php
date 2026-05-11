<?php

namespace App\Jobs;

use App\Models\Blog;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;

class TrackBlogViewJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public function __construct(
        public Blog $blog,
        public ?int $userId,
    ) {}

    public function handle(): void
    {
        if ($this->userId === null) {
            return;
        }

        DB::table('blog_views')->updateOrInsert(
            ['blog_id' => $this->blog->id, 'user_id' => $this->userId],
            ['created_at' => now()]
        );
    }
}
