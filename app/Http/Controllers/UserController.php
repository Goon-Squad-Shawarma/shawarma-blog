<?php

namespace App\Http\Controllers;

use App\Jobs\NotifyOnNewFollowerJob;
use App\Models\Follow;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Search users by name or email (for member management).
     */
    public function search(Request $request): JsonResponse
    {
        $users = User::when(
            $request->filled('q'),
            fn ($query) => $query->where(function ($query) use ($request) {
                $query->where('first_name', 'like', "%{$request->q}%")
                    ->orWhere('last_name', 'like', "%{$request->q}%")
                    ->orWhere('email', 'like', "%{$request->q}%");
            })
        )
            ->orderBy('first_name')
            ->limit(15)
            ->get(['id', 'first_name', 'last_name', 'email', 'avatar_url']);

        return response()->json($users);
    }

    /**
     * Display the user's profile.
     */
    public function show(User $user)
    {
        $user->load('blogs', 'followers', 'followingUsers', 'followingOrganizations');

        $isFollowing = auth()->check() ? auth()->user()->isFollowing($user) : false;
        $followers_count = $user->followers()->count();
        $following_count = $user->followingUsers()->count() + $user->followingOrganizations()->count();

        return Inertia::render('users/show', [
            'user' => $user,
            'isFollowing' => $isFollowing,
            'followers_count' => $followers_count,
            'following_count' => $following_count,
            'canFollow' => auth()->check() && auth()->user()->can('follow', $user),
        ]);
    }

    /**
     * Follow a user.
     */
    public function follow(Request $request, User $user)
    {
        $this->authorize('follow', $user);

        Follow::firstOrCreate([
            'user_id' => auth()->id(),
            'following_user_id' => $user->id,
        ]);

        NotifyOnNewFollowerJob::dispatch(auth()->user(), $user);

        return response()->json(['message' => 'Now following user.']);
    }

    /**
     * Unfollow a user.
     */
    public function unfollow(User $user)
    {
        $this->authorize('unfollow', $user);

        Follow::where('user_id', auth()->id())
            ->where('following_user_id', $user->id)
            ->delete();

        return response()->json(['message' => 'Unfollowed user.']);
    }

    /**
     * Get user's followers.
     */
    public function followers(User $user)
    {
        $followers = $user->followers()->paginate(20);

        return Inertia::render('users/followers', [
            'user' => $user,
            'followers' => $followers,
        ]);
    }

    /**
     * Get users that the user is following.
     */
    public function following(User $user)
    {
        $following = $user->followingUsers()->paginate(20);

        return Inertia::render('users/following', [
            'user' => $user,
            'following' => $following,
        ]);
    }

    /**
     * Display the authenticated user's network (followers + following).
     */
    public function network(Request $request)
    {
        $user = auth()->user();

        return Inertia::render('users/network', [
            'followers' => $user->followers()
                ->select('users.id', 'first_name', 'last_name', 'avatar_url', 'bio')
                ->paginate(20, ['*'], 'followersPage')
                ->withQueryString(),
            'following' => $user->followingUsers()
                ->select('users.id', 'first_name', 'last_name', 'avatar_url', 'bio')
                ->paginate(20, ['*'], 'followingPage')
                ->withQueryString(),
        ]);
    }
}
