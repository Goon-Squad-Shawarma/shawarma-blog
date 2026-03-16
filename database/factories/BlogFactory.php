<?php

namespace Database\Factories;

use App\Enums\PostVisibility;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Blog>
 */
class BlogFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->sentence();

        return [
            'user_id' => User::factory(),
            'organization_id' => null,
            'title' => $title,
            'slug' => Str::slug($title).'-'.Str::random(5),
            'subtitle' => fake()->sentence(),
            'content' => fake()->paragraphs(5, true),
            'banner_url' => 'https://picsum.photos/seed/'.Str::random(8).'/1200/600',
            'published_at' => fake()->dateTimeBetween('-1 month', 'now'),
            'visibility' => PostVisibility::PUBLIC,
            'reading_time' => fake()->numberBetween(3, 15),
        ];
    }

    /**
     * Indicate that the blog is a draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'published_at' => null,
        ]);
    }

    /**
     * Indicate that the blog is scheduled for future publishing.
     */
    public function scheduled(): static
    {
        return $this->state(fn (array $attributes) => [
            'published_at' => fake()->dateTimeBetween('now', '+1 month'),
        ]);
    }

    /**
     * Indicate that the blog belongs to an organization.
     */
    public function forOrganization(Organization $organization): static
    {
        return $this->state(fn (array $attributes) => [
            'organization_id' => $organization->id,
        ]);
    }

    /**
     * Indicate that the blog should be private.
     */
    public function private(): static
    {
        return $this->state(fn (array $attributes) => [
            'visibility' => PostVisibility::PRIVATE,
        ]);
    }
}
