<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Follow>
 */
class FollowFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Default to following a user
        return [
            'user_id' => User::factory(),
            'following_user_id' => User::factory(),
            'following_organization_id' => null,
        ];
    }

    /**
     * Indicate that the follow is from a specific user.
     */
    public function byUser(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
        ]);
    }

    /**
     * Indicate that the follow is following a specific user.
     */
    public function followingUser(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'following_user_id' => $user->id,
            'following_organization_id' => null,
        ]);
    }

    /**
     * Indicate that the follow is following a specific organization.
     */
    public function followingOrganization(Organization $organization): static
    {
        return $this->state(fn (array $attributes) => [
            'following_user_id' => null,
            'following_organization_id' => $organization->id,
        ]);
    }
}
