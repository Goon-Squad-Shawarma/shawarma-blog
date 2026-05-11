<?php

namespace App\Jobs;

use App\Models\Blog;
use App\Models\User;
use App\Services\NovuService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class NotifyOnLikeJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Blog $blog,
        public User $liker,
    ) {}

    public function handle(NovuService $novu): void
    {
        if ($this->blog->user_id !== $this->liker->id) {
            $novu->triggerWorkflow('blog_liked', $this->blog->user->uuid, [
                'liker_name' => $this->liker->first_name.' '.$this->liker->last_name,
                'blog_title' => $this->blog->title,
                'blog_slug' => $this->blog->slug,
            ]);
        }
    }
}
