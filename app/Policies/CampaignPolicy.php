<?php

namespace App\Policies;

use App\Enums\CampaignStatus;
use App\Enums\OrganizationRole;
use App\Models\Campaign;
use App\Models\User;

class CampaignPolicy
{
    /**
     * Determine whether the user can create campaigns.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the campaign.
     */
    public function view(User $user, Campaign $campaign): bool
    {
        return $this->isOwner($user, $campaign);
    }

    /**
     * Determine whether the user can send the campaign.
     */
    public function send(User $user, Campaign $campaign): bool
    {
        return $this->isOwner($user, $campaign);
    }

    /**
     * Determine whether the user can delete the campaign.
     */
    public function delete(User $user, Campaign $campaign): bool
    {
        return $this->isOwner($user, $campaign) && $campaign->status === CampaignStatus::Draft;
    }

    private function isOwner(User $user, Campaign $campaign): bool
    {
        if ($campaign->organization_id === null) {
            return $campaign->user_id === $user->id;
        }

        return $user->hasRole($campaign->organization, OrganizationRole::ADMIN);
    }
}
