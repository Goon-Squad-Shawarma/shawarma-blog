<?php

namespace App\Models;

use App\Enums\OrganizationRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Organization extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'logo_url',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    public function blogs(): HasMany
    {
        return $this->hasMany(Blog::class);
    }

    public function followers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'following_organization_id', 'user_id')
        ->withTimestamps();
    }

    protected static function booted()
    {
        static::creating (function ($organization) {
            if (!$organization->slug) {
                $organization->slug = Str::slug($organization->name);
            }
        });
    }

    public function membersWithRoles(OrganizationRole $role)
    {
        return $this->users()->wherePivot('role', $role->value)->get();
    }
}
