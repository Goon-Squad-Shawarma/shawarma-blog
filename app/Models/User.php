<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use App\Enums\OrganizationRole;
use App\Jobs\SendVerificationEmailJob;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Fortify\TwoFactorAuthenticatable;
use OffloadProject\InviteOnly\Traits\CanBeInvited;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use CanBeInvited, HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'uuid',
        'first_name',
        'last_name',
        'username',
        'email',
        'password',
        'avatar_url',
        'background_url',
        'website',
        'bio',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    protected function avatarUrl(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $this->resolveS3Url($value),
        );
    }

    protected function backgroundUrl(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $this->resolveS3Url($value),
        );
    }

    private function resolveS3Url(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        // Support legacy full URLs stored before path-only approach
        if (str_starts_with($value, 'http')) {
            $urlPath = parse_url($value, PHP_URL_PATH);
            $value = ltrim(preg_replace('#^/[^/]+/#', '', $urlPath), '/');
        }

        return Storage::disk('s3')->temporaryUrl($value, now()->addWeek());
    }

    public function sendEmailVerificationNotification(): void
    {
        SendVerificationEmailJob::dispatch($this);
    }

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            if (empty($user->uuid)) {
                $user->uuid = (string) Str::uuid();
            }
        });
    }

    public function blogs(): HasMany
    {
        return $this->hasMany(Blog::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(Like::class);
    }

    public function organizations(): BelongsToMany
    {
        return $this->belongsToMany(Organization::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    public function ownedOrganizations(): HasMany
    {
        return $this->hasMany(Organization::class, 'owner_id');
    }

    public function followingUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'user_id', 'following_user_id')
            ->withTimestamps();
    }

    public function followers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'following_user_id', 'user_id')
            ->withTimestamps();
    }

    public function followingOrganizations(): BelongsToMany
    {
        return $this->belongsToMany(Organization::class, 'follows', 'user_id', 'following_organization_id')
            ->withTimestamps();
    }

    public function isFollowing($target): bool
    {
        if ($target instanceof User) {
            return $this->followingUsers()->where('following_user_id', $target->id)->exists();
        } elseif ($target instanceof Organization) {
            return $this->followingOrganizations()->where('following_organization_id', $target->id)->exists();
        }

        return false;
    }

    public function hasRole(Organization $org, OrganizationRole $role): bool
    {
        return $this->organizations()->wherePivot('organization_id', $org->id)->wherePivot('role', $role->value)->exists();
    }
}
