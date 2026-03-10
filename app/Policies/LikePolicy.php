<?php

namespace App\Policies;

use App\Models\Like;
use App\Models\User;

class LikePolicy
{
    /**
     * Determine if the user can create a like.
     */
    public function create(User $user): bool
    {
        // All authenticated users can like
        return true;
    }

    /**
     * Determine if the user can delete a like.
     */
    public function delete(User $user, Like $like): bool
    {
        // Only the user who created the like can delete it
        return $like->user_id === $user->id;
    }

    /**
     * Determine if the user can delete any like (for moderation).
     */
    public function deleteAny(User $user, Like $like): bool
    {
        // User can delete their own like
        if ($like->user_id === $user->id) {
            return true;
        }

        // Blog author can remove likes from their blog
        if ($like->blog->user_id === $user->id) {
            return true;
        }

        return false;
    }
}
