<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Blog;
use App\Models\Comment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Comment>
 */
class CommentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'blog_id' => Blog::factory(),
            'content' => fake()->paragraph(),
            'parent_id' => null,
        ];
    }

    /**
     * Indicate that the comment is a reply to another comment.
     */
    public function asReplyTo(Comment $parent): static
    {
        return $this->state(fn (array $attributes) => [
            'blog_id' => $parent->blog_id,
            'parent_id' => $parent->id,
        ]);
    }

    /**
     * Indicate that the comment belongs to a specific blog.
     */
    public function forBlog(Blog $blog): static
    {
        return $this->state(fn (array $attributes) => [
            'blog_id' => $blog->id,
        ]);
    }

    /**
     * Indicate that the comment is from a specific user.
     */
    public function byUser(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
        ]);
    }
}
