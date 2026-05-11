<?php

namespace Database\Factories;

use App\Models\Thread;
use App\Models\ThreadReply;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ThreadReply>
 */
class ThreadReplyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'thread_id' => Thread::factory(),
            'user_id' => User::factory(),
            'body' => fake()->paragraph(),
        ];
    }
}
