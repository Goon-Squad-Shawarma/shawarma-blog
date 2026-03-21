<?php

namespace App\Http\Controllers;

use App\Enums\OrganizationRole;
use App\Models\Blog;
use App\Models\Organization;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class BlogController extends Controller
{
    /**
     * Display a listing of blogs.
     */
    public function index(Request $request)
    {
        $query = Blog::where('visibility', 'public')
            ->with('user', 'organization', 'tags');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%");
            });
        }

        if ($request->filled('tags')) {
            foreach ((array) $request->tags as $tagSlug) {
                $query->whereHas('tags', fn ($q) => $q->where('slug', $tagSlug));
            }
        }

        if ($request->filled('author')) {
            $query->where('user_id', $request->author);
        }

        if ($request->filled('organization')) {
            $query->whereHas('organization', fn ($q) => $q->where('slug', $request->organization));
        }

        return Inertia::render('blogs/index', [
            'blogs' => $query->latest('published_at')->paginate(12)->withQueryString(),
            'tags' => Tag::orderBy('name')->get(['id', 'name', 'slug']),
            'organizations' => Organization::has('blogs')->orderBy('name')->get(['id', 'name', 'slug']),
            'filters' => $request->only(['search', 'tags', 'author', 'organization']),
        ]);
    }

    /**
     * Return paginated authors who have public blogs (JSON, for search suggestions).
     */
    public function authors(Request $request): JsonResponse
    {
        $authors = User::whereHas('blogs', fn ($q) => $q->where('visibility', 'public'))
            ->when($request->filled('search'), fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('first_name', 'like', "%{$request->search}%")
                    ->orWhere('last_name', 'like', "%{$request->search}%");
            }))
            ->orderBy('first_name')
            ->paginate(15, ['id', 'first_name', 'last_name', 'avatar_url']);

        return response()->json($authors);
    }

    /**
     * Show the form for creating a new blog.
     */
    public function create()
    {
        $this->authorize('create', Blog::class);

        $userOrganizations = auth()->user()->organizations()
            ->wherePivotIn('role', [OrganizationRole::ADMIN->value, OrganizationRole::EDITOR->value, OrganizationRole::AUTHOR->value])
            ->get(['organizations.id', 'organizations.name', 'organizations.slug']);

        return Inertia::render('blogs/create', [
            'tags' => Tag::all(),
            'organizations' => $userOrganizations,
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
            'banner' => 'nullable|image|max:5120',
            'visibility' => 'required|in:public,private',
            'published_at' => 'nullable|date',
            'organization_id' => 'nullable|exists:organizations,id',
            'tags' => 'array',
            'tags.*' => 'exists:tags,id',
        ]);

        if (isset($validated['organization_id'])) {
            $isMember = auth()->user()->organizations()
                ->where('organization_id', $validated['organization_id'])
                ->wherePivotIn('role', [OrganizationRole::ADMIN->value, OrganizationRole::EDITOR->value, OrganizationRole::AUTHOR->value])
                ->exists();

            abort_if(! $isMember, 403, 'You do not have permission to post on behalf of this organization.');
        }

        $bannerUrl = null;
        if ($request->hasFile('banner')) {
            $path = $request->file('banner')->store('banners', ['disk' => 's3']);
            $bannerUrl = Storage::disk('s3')->url($path);
        }

        $blog = auth()->user()->blogs()->create(array_merge(
            Arr::except($validated, ['banner', 'tags']),
            ['banner_url' => $bannerUrl]
        ));

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

        $blog->load('user', 'organization', 'tags', 'comments.user', 'comments.likes', 'comments.replies.user', 'comments.replies.likes', 'likes');

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

        $userOrganizations = auth()->user()->organizations()
            ->wherePivotIn('role', [OrganizationRole::ADMIN->value, OrganizationRole::EDITOR->value, OrganizationRole::AUTHOR->value])
            ->get(['organizations.id', 'organizations.name', 'organizations.slug']);

        return Inertia::render('blogs/edit', [
            'blog' => $blog,
            'tags' => Tag::all(),
            'selectedTags' => $blog->tags->pluck('id'),
            'organizations' => $userOrganizations,
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
            'banner' => 'nullable|image|max:5120',
            'visibility' => 'required|in:public,private',
            'published_at' => 'nullable|date',
            'organization_id' => 'nullable|exists:organizations,id',
            'tags' => 'array',
            'tags.*' => 'exists:tags,id',
        ]);

        $bannerUrl = $blog->banner_url;
        if ($request->hasFile('banner')) {
            $path = $request->file('banner')->store('banners', ['disk' => 's3']);
            $bannerUrl = Storage::disk('s3')->url($path);
        }

        $blog->update(array_merge(
            Arr::except($validated, ['banner', 'tags']),
            ['banner_url' => $bannerUrl]
        ));

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
