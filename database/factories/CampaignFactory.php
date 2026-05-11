<?php

namespace Database\Factories;

use App\Enums\CampaignStatus;
use App\Models\Campaign;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Campaign>
 */
class CampaignFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'organization_id' => null,
            'subject' => fake()->sentence(6),
            'body' => '<p>'.fake()->paragraphs(3, true).'</p>',
            'status' => CampaignStatus::Draft,
            'recipient_count' => 0,
            'sent_at' => null,
        ];
    }

    public function sent(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => CampaignStatus::Sent,
            'recipient_count' => fake()->numberBetween(1, 100),
            'sent_at' => now(),
        ]);
    }
}
