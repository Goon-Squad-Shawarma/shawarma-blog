<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Follow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserController extends Controller
{
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
}
