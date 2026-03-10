<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Determine if the user can view another user's profile.
     */
    public function view(User $user, User $target): bool
    {
        // Users can view any public profile
        return true;
    }

    /**
     * Determine if the user can update their own profile.
     */
    public function update(User $user, User $target): bool
    {
        // Users can only update their own profile
        return $user->id === $target->id;
    }

    /**
     * Determine if the user can follow another user.
     */
    public function follow(User $user, User $target): bool
    {
        // Users cannot follow themselves
        if ($user->id === $target->id) {
            return false;
        }

        return true;
    }

    /**
     * Determine if the user can unfollow another user.
     */
    public function unfollow(User $user, User $target): bool
    {
        // Users can unfollow anyone except themselves
        return $user->id !== $target->id;
    }

    /**
     * Determine if the user can view another user's followers.
     */
    public function viewFollowers(User $user, User $target): bool
    {
        // Anyone can view followers
        return true;
    }

    /**
     * Determine if the user can view who they're following.
     */
    public function viewFollowing(User $user, User $target): bool
    {
        // Users can view this information (but can restrict in frontend)
        return true;
    }

    /**
     * Determine if the user is following the target user.
     */
    public function isFollowing(User $user, User $target): bool
    {
        return $user->isFollowing($target);
    }
}
