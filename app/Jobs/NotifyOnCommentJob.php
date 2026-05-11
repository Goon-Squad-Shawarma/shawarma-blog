<?php

namespace App\Jobs;

use App\Models\Comment;
use App\Services\NovuService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class NotifyOnCommentJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public Comment $comment) {}

    public function handle(NovuService $novu): void
    {
        // Notify the blog author (if commenter is not the author)
        if ($this->comment->user_id !== $this->comment->blog->user_id) {
            $novu->triggerWorkflow('blog_comment', $this->comment->blog->user->uuid, [
                'commenter_name' => $this->comment->user->first_name.' '.$this->comment->user->last_name,
                'blog_title' => $this->comment->blog->title,
                'blog_slug' => $this->comment->blog->slug,
            ]);
        }

        // If it's a reply, also notify the parent comment author
        if ($this->comment->parent_id && $this->comment->parent?->user_id !== $this->comment->user_id) {
            $novu->triggerWorkflow('comment_reply', $this->comment->parent->user->uuid, [
                'commenter_name' => $this->comment->user->first_name.' '.$this->comment->user->last_name,
                'blog_title' => $this->comment->blog->title,
                'blog_slug' => $this->comment->blog->slug,
            ]);
        }
    }
}
