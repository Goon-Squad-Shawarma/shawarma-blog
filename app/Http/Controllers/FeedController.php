<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FeedController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $followedUserIds = $user->followingUsers()->pluck('users.id');
        $followedOrgIds = $user->followingOrganizations()->pluck('organizations.id');

        $followingBlogs = Blog::where('visibility', 'public')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->where(function ($q) use ($followedUserIds, $followedOrgIds) {
                $q->whereIn('user_id', $followedUserIds)
                    ->orWhereIn('organization_id', $followedOrgIds);
            })
            ->with(['user:id,first_name,last_name,avatar_url,username', 'organization:id,name,slug', 'tags'])
            ->withCount(['likes', 'bookmarks', 'views'])
            ->latest('published_at')
            ->paginate(12);

        $discoverBlogs = Blog::where('visibility', 'public')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->whereNotIn('user_id', $followedUserIds)
            ->whereNotIn('organization_id', $followedOrgIds->toArray())
            ->with(['user:id,first_name,last_name,avatar_url,username', 'organization:id,name,slug', 'tags'])
            ->withCount(['likes', 'bookmarks', 'views'])
            ->latest('published_at')
            ->paginate(12);

        return Inertia::render('dashboard', [
            'followingBlogs' => $followingBlogs,
            'discoverBlogs' => $discoverBlogs,
        ]);
    }
}
