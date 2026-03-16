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
        return true;
    }

    /**
     * Determine if the user can delete a like.
     */
    public function delete(User $user, Like $like): bool
    {
        return $like->user_id === $user->id;
    }
}
