<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\NovuService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class CreateNovuSubscriberJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public User $user) {}

    public function handle(NovuService $novu): void
    {
        $novu->createSubscriber($this->user);
        $novu->triggerWorkflow('welcome', $this->user->uuid);
    }
}
