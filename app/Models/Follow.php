<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Follow extends Model
{
    use HasFactory;

    protected $table = 'follows';

    protected $fillable = [
        'user_id',
        'following_user_id',
        'following_organization_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The user who is following.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The user being followed (if following a user).
     */
    public function followingUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'following_user_id');
    }

    /**
     * The organization being followed (if following an organization).
     */
    public function followingOrganization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'following_organization_id');
    }

    /**
     * Check if this follow is following a user.
     */
    public function isFollowingUser(): bool
    {
        return $this->following_user_id !== null;
    }

    /**
     * Check if this follow is following an organization.
     */
    public function isFollowingOrganization(): bool
    {
        return $this->following_organization_id !== null;
    }

    /**
     * Get the followable model (User or Organization).
     */
    public function getFollowable()
    {
        if ($this->isFollowingUser()) {
            return $this->followingUser;
        } elseif ($this->isFollowingOrganization()) {
            return $this->followingOrganization;
        }
        return null;
    }
}
