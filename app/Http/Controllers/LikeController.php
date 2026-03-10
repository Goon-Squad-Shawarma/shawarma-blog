<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use App\Models\Like;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LikeController extends Controller
{
    /**
     * Like a blog.
     */
    public function store(Request $request, Blog $blog)
    {
        $this->authorize('create', Like::class);

        $like = Like::firstOrCreate([
            'user_id' => auth()->id(),
            'blog_id' => $blog->id,
        ]);

        return response()->json([
            'liked' => true,
            'likes_count' => $blog->likes()->count(),
        ]);
    }

    /**
     * Unlike a blog.
     */
    public function destroy(Blog $blog)
    {
        $like = $blog->likes()->where('user_id', auth()->id())->first();

        if (!$like) {
            return response()->json(['message' => 'Like not found.'], 404);
        }

        $this->authorize('delete', $like);

        $like->delete();

        return response()->json([
            'liked' => false,
            'likes_count' => $blog->likes()->count(),
        ]);
    }
}
