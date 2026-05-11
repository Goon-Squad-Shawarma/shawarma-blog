<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use App\Models\Bookmark;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BookmarkController extends Controller
{
    public function index(Request $request)
    {
        $bookmarks = auth()->user()
            ->bookmarks()
            ->with(['blog.user', 'blog.tags'])
            ->latest()
            ->paginate(12);

        return Inertia::render('bookmarks/index', [
            'bookmarks' => $bookmarks,
        ]);
    }

    public function store(Request $request, Blog $blog)
    {
        $this->authorize('create', Bookmark::class);

        Bookmark::firstOrCreate([
            'user_id' => auth()->id(),
            'blog_id' => $blog->id,
        ]);

        return response()->json([
            'bookmarked' => true,
            'bookmarks_count' => $blog->bookmarks()->count(),
        ]);
    }

    public function destroy(Blog $blog)
    {
        $bookmark = Bookmark::where('user_id', auth()->id())
            ->where('blog_id', $blog->id)
            ->firstOrFail();

        $this->authorize('delete', $bookmark);

        $bookmark->delete();

        return response()->json([
            'bookmarked' => false,
            'bookmarks_count' => $blog->bookmarks()->count(),
        ]);
    }
}
