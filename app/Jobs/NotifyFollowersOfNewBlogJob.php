<?php

namespace App\Jobs;

use App\Models\Blog;
use App\Services\NovuService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class NotifyFollowersOfNewBlogJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public Blog $blog) {}

    public function handle(NovuService $novu): void
    {
        $this->blog->load('user.followers');

        foreach ($this->blog->user->followers as $follower) {
            $novu->triggerWorkflow('new_blog_from_following', $follower->uuid, [
                'blog_title' => $this->blog->title,
                'blog_slug' => $this->blog->slug,
                'author_name' => $this->blog->user->first_name.' '.$this->blog->user->last_name,
            ]);
        }
    }
}
