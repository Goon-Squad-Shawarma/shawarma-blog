<?php

namespace App\Policies;

use App\Enums\OrganizationRole;
use App\Models\Organization;
use App\Models\User;

class OrganizationPolicy
{
    /**
     * Determine if the user can view the organization.
     */
    public function view(User $user, Organization $organization): bool
    {
        // Anyone can view an organization (public profile)
        return true;
    }

    /**
     * Determine if the user can create an organization.
     */
    public function create(User $user): bool
    {
        // All authenticated users can create organizations
        return true;
    }

    /**
     * Determine if the user can update the organization.
     */
    public function update(User $user, Organization $organization): bool
    {
        // Only organization admins can update
        return $user->hasRole($organization, OrganizationRole::ADMIN);
    }

    /**
     * Determine if the user can delete the organization.
     */
    public function delete(User $user, Organization $organization): bool
    {
        // Only the organization owner can delete
        return $organization->owner_id === $user->id;
    }

    /**
     * Determine if the user can add members to the organization.
     */
    public function addMember(User $user, Organization $organization): bool
    {
        // Only admins can add members
        return $user->hasRole($organization, OrganizationRole::ADMIN);
    }

    /**
     * Determine if the user can remove members from the organization.
     */
    public function removeMember(User $user, Organization $organization): bool
    {
        // Only admins can remove members
        return $user->hasRole($organization, OrganizationRole::ADMIN);
    }

    /**
     * Determine if the user can update a member's role.
     */
    public function updateMemberRole(User $user, Organization $organization): bool
    {
        // Only admins can update roles
        return $user->hasRole($organization, OrganizationRole::ADMIN);
    }

    /**
     * Determine if the user can leave the organization.
     */
    public function leave(User $user, Organization $organization): bool
    {
        // Users can leave unless they're the owner
        return $organization->owner_id !== $user->id;
    }

    /**
     * Determine if the user is a member of the organization.
     */
    public function isMember(User $user, Organization $organization): bool
    {
        return $organization->users()->where('user_id', $user->id)->exists();
    }
}
