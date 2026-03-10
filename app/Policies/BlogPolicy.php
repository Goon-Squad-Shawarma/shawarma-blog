<?php

namespace App\Policies;

use App\Enums\OrganizationRole;
use App\Models\Blog;
use App\Models\User;

class BlogPolicy
{
    /**
     * Determine if the user can view the blog.
     */
    public function view(User $user, Blog $blog): bool
    {
        // If blog is public, anyone can view
        if ($blog->visibility === 'public') {
            return true;
        }

        // If blog is private, only the author can view
        if ($blog->visibility === 'private') {
            return $blog->user_id === $user->id;
        }

        return false;
    }

    /**
     * Determine if the user can create a blog.
     */
    public function create(User $user): bool
    {
        // All authenticated users can create blogs
        return true;
    }

    /**
     * Determine if the user can update the blog.
     */
    public function update(User $user, Blog $blog): bool
    {
        // If blog has no organization (user-owned)
        if ($blog->organization_id === null) {
            return $blog->user_id === $user->id;
        }

        // If blog belongs to an organization, check user's role
        return $user->hasRole($blog->organization, OrganizationRole::ADMIN) ||
               $user->hasRole($blog->organization, OrganizationRole::EDITOR) ||
               ($user->hasRole($blog->organization, OrganizationRole::AUTHOR) && $blog->user_id === $user->id);
    }

    /**
     * Determine if the user can delete the blog.
     */
    public function delete(User $user, Blog $blog): bool
    {
        // If blog has no organization (user-owned)
        if ($blog->organization_id === null) {
            return $blog->user_id === $user->id;
        }

        // If blog belongs to an organization, only ADMIN can delete
        return $user->hasRole($blog->organization, OrganizationRole::ADMIN);
    }

    /**
     * Determine if the user can restore the blog (soft delete).
     */
    public function restore(User $user, Blog $blog): bool
    {
        return $this->delete($user, $blog);
    }

    /**
     * Determine if the user can permanently delete the blog.
     */
    public function forceDelete(User $user, Blog $blog): bool
    {
        return $this->delete($user, $blog);
    }

    /**
     * Determine if the user can publish/schedule the blog.
     */
    public function publish(User $user, Blog $blog): bool
    {
        return $this->update($user, $blog);
    }
}
