<?php

namespace Database\Factories;

use App\Enums\LikeType;
use App\Models\Blog;
use App\Models\Comment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Like>
 */
class LikeFactory extends Factory
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
            'likeable_id' => Blog::factory(),
            'likeable_type' => Blog::class,
            'type' => LikeType::Like->value,
        ];
    }

    /**
     * Indicate that the like is from a specific user.
     */
    public function byUser(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
        ]);
    }

    /**
     * Indicate that the like is for a specific blog.
     */
    public function forBlog(Blog $blog): static
    {
        return $this->state(fn (array $attributes) => [
            'likeable_id' => $blog->id,
            'likeable_type' => Blog::class,
            'type' => LikeType::Like->value,
        ]);
    }

    /**
     * Indicate that the like is a thumbs up for a comment.
     */
    public function thumbsUpForComment(Comment $comment): static
    {
        return $this->state(fn (array $attributes) => [
            'likeable_id' => $comment->id,
            'likeable_type' => Comment::class,
            'type' => LikeType::ThumbsUp->value,
        ]);
    }

    /**
     * Indicate that the like is a thumbs down for a comment.
     */
    public function thumbsDownForComment(Comment $comment): static
    {
        return $this->state(fn (array $attributes) => [
            'likeable_id' => $comment->id,
            'likeable_type' => Comment::class,
            'type' => LikeType::ThumbsDown->value,
        ]);
    }
}
