<?php

namespace App\Http\Controllers;

use App\Enums\LikeType;
use App\Models\Blog;
use App\Models\Comment;
use App\Models\Like;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    /**
     * Like a blog post.
     */
    public function store(Request $request, Blog $blog)
    {
        $this->authorize('create', Like::class);

        Like::firstOrCreate([
            'user_id' => auth()->id(),
            'likeable_id' => $blog->id,
            'likeable_type' => Blog::class,
            'type' => LikeType::Like->value,
        ]);

        return response()->json([
            'liked' => true,
            'likes_count' => $blog->likes()->count(),
        ]);
    }

    /**
     * Unlike a blog post.
     */
    public function destroy(Blog $blog)
    {
        $like = $blog->likes()->where('user_id', auth()->id())->first();

        if (! $like) {
            return response()->json(['message' => 'Like not found.'], 404);
        }

        $this->authorize('delete', $like);

        $like->delete();

        return response()->json([
            'liked' => false,
            'likes_count' => $blog->likes()->count(),
        ]);
    }

    /**
     * Thumbs up or thumbs down a comment.
     * If the user already has the same reaction, it is removed (toggle).
     * If the user has the opposite reaction, it is replaced.
     */
    public function storeForComment(Request $request, Comment $comment)
    {
        $this->authorize('create', Like::class);

        $validated = $request->validate([
            'type' => ['required', 'in:thumbsup,thumbsdown'],
        ]);

        $type = LikeType::from($validated['type']);

        $existing = $comment->likes()->where('user_id', auth()->id())->first();

        if ($existing) {
            if ($existing->type === $type) {
                // Same reaction → toggle off
                $existing->delete();

                return response()->json([
                    'type' => null,
                    'thumbsup_count' => $comment->likes()->where('type', LikeType::ThumbsUp->value)->count(),
                    'thumbsdown_count' => $comment->likes()->where('type', LikeType::ThumbsDown->value)->count(),
                ]);
            }

            // Opposite reaction → replace
            $existing->update(['type' => $type->value]);

            return response()->json([
                'type' => $type->value,
                'thumbsup_count' => $comment->likes()->where('type', LikeType::ThumbsUp->value)->count(),
                'thumbsdown_count' => $comment->likes()->where('type', LikeType::ThumbsDown->value)->count(),
            ]);
        }

        $comment->likes()->create([
            'user_id' => auth()->id(),
            'type' => $type->value,
        ]);

        return response()->json([
            'type' => $type->value,
            'thumbsup_count' => $comment->likes()->where('type', LikeType::ThumbsUp->value)->count(),
            'thumbsdown_count' => $comment->likes()->where('type', LikeType::ThumbsDown->value)->count(),
        ]);
    }

    /**
     * Remove a comment reaction.
     */
    public function destroyForComment(Comment $comment)
    {
        $like = $comment->likes()->where('user_id', auth()->id())->first();

        if (! $like) {
            return response()->json(['message' => 'Reaction not found.'], 404);
        }

        $this->authorize('delete', $like);

        $like->delete();

        return response()->json([
            'type' => null,
            'thumbsup_count' => $comment->likes()->where('type', LikeType::ThumbsUp->value)->count(),
            'thumbsdown_count' => $comment->likes()->where('type', LikeType::ThumbsDown->value)->count(),
        ]);
    }
}
