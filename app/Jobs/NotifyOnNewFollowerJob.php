<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\NovuService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class NotifyOnNewFollowerJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public User $follower,
        public User $followedUser,
    ) {}

    public function handle(NovuService $novu): void
    {
        $novu->triggerWorkflow('new_follower', $this->followedUser->uuid, [
            'follower_name' => $this->follower->first_name.' '.$this->follower->last_name,
            'follower_username' => $this->follower->username,
        ]);
    }
}
