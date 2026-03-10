<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BlogController extends Controller
{
    /**
     * Display a listing of blogs.
     */
    public function index(Request $request)
    {
        $blogs = Blog::where('visibility', 'public')
            ->with('user', 'organization', 'tags')
            ->latest('published_at')
            ->paginate(12);

        return Inertia::render('blogs/index', [
            'blogs' => $blogs,
        ]);
    }

    /**
     * Show the form for creating a new blog.
     */
    public function create()
    {
        $this->authorize('create', Blog::class);

        return Inertia::render('blogs/create', [
            'tags' => Tag::all(),
        ]);
    }

    /**
     * Store a newly created blog in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Blog::class);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'content' => 'required|string',
            'banner_url' => 'nullable|url',
            'visibility' => 'required|in:public,private',
            'published_at' => 'nullable|date',
            'tags' => 'array',
            'tags.*' => 'exists:tags,id',
        ]);

        $blog = auth()->user()->blogs()->create($validated);

        if ($request->has('tags')) {
            $blog->tags()->sync($request->input('tags'));
        }

        return redirect()->route('blogs.show', $blog)->with('success', 'Blog created successfully.');
    }

    /**
     * Display the specified blog.
     */
    public function show(Blog $blog)
    {
        $this->authorize('view', $blog);

        $blog->load('user', 'organization', 'tags', 'comments.user', 'likes');

        return Inertia::render('blogs/show', [
            'blog' => $blog,
            'canUpdate' => auth()->check() && auth()->user()->can('update', $blog),
            'canDelete' => auth()->check() && auth()->user()->can('delete', $blog),
            'canComment' => auth()->check(),
            'canLike' => auth()->check(),
            'userLiked' => auth()->check() ? $blog->likes()->where('user_id', auth()->id())->exists() : false,
        ]);
    }

    /**
     * Show the form for editing the specified blog.
     */
    public function edit(Blog $blog)
    {
        $this->authorize('update', $blog);

        $blog->load('tags');

        return Inertia::render('blogs/edit', [
            'blog' => $blog,
            'tags' => Tag::all(),
            'selectedTags' => $blog->tags->pluck('id'),
        ]);
    }

    /**
     * Update the specified blog in storage.
     */
    public function update(Request $request, Blog $blog)
    {
        $this->authorize('update', $blog);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'content' => 'required|string',
            'banner_url' => 'nullable|url',
            'visibility' => 'required|in:public,private',
            'published_at' => 'nullable|date',
            'tags' => 'array',
            'tags.*' => 'exists:tags,id',
        ]);

        $blog->update($validated);

        if ($request->has('tags')) {
            $blog->tags()->sync($request->input('tags'));
        }

        return redirect()->route('blogs.show', $blog)->with('success', 'Blog updated successfully.');
    }

    /**
     * Delete the specified blog from storage.
     */
    public function destroy(Blog $blog)
    {
        $this->authorize('delete', $blog);

        $blog->delete();

        return redirect()->route('blogs.index')->with('success', 'Blog deleted successfully.');
    }

    /**
     * Restore a soft-deleted blog.
     */
    public function restore(Blog $blog)
    {
        $this->authorize('restore', $blog);

        $blog->restore();

        return redirect()->route('blogs.show', $blog)->with('success', 'Blog restored successfully.');
    }

    /**
     * Get user's blogs.
     */
    public function userBlogs(Request $request)
    {
        $blogs = auth()->user()->blogs()
            ->with('tags', 'organization')
            ->latest()
            ->paginate(12);

        return Inertia::render('blogs/user-blogs', [
            'blogs' => $blogs,
        ]);
    }

    /**
     * Publish or schedule a blog.
     */
    public function publish(Request $request, Blog $blog)
    {
        $this->authorize('publish', $blog);

        $validated = $request->validate([
            'published_at' => 'nullable|date|after_or_equal:now',
        ]);

        $blog->update($validated);

        return redirect()->route('blogs.show', $blog)->with('success', 'Blog published successfully.');
    }
}
