<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\User;

class CommentPolicy
{
    /**
     * Determine if the user can view comments on a blog.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine if the user can create a comment.
     */
    public function create(User $user): bool
    {
        // All authenticated users can comment
        return true;
    }

    /**
     * Determine if the user can update the comment.
     */
    public function update(User $user, Comment $comment): bool
    {
        // Only the comment author can update their comment
        return $comment->user_id === $user->id;
    }

    /**
     * Determine if the user can delete the comment.
     */
    public function delete(User $user, Comment $comment): bool
    {
        // Comment author can delete their own comment
        if ($comment->user_id === $user->id) {
            return true;
        }

        // Blog author can delete comments on their blog
        if ($comment->blog->user_id === $user->id) {
            return true;
        }

        // Organization admins can delete comments on their org's blogs
        if ($comment->blog->organization_id) {
            return $user->hasRole($comment->blog->organization, \App\Enums\OrganizationRole::ADMIN);
        }

        return false;
    }

    /**
     * Determine if the user can restore the comment.
     */
    public function restore(User $user, Comment $comment): bool
    {
        return $this->delete($user, $comment);
    }

    /**
     * Determine if the user can permanently delete the comment.
     */
    public function forceDelete(User $user, Comment $comment): bool
    {
        return $this->delete($user, $comment);
    }
}
