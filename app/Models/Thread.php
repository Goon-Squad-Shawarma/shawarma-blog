<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Str;

class Thread extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'slug',
        'body',
        'category',
        'status',
        'image_url',
        'upvotes_count',
    ];

    protected static function booted(): void
    {
        static::creating(function (Thread $thread): void {
            if (empty($thread->slug)) {
                $base = Str::slug($thread->title);
                $thread->slug = $base.'-'.Str::lower(Str::random(5));
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function replies(): HasMany
    {
        return $this->hasMany(ThreadReply::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(ThreadVote::class);
    }

    public function reactions(): MorphMany
    {
        return $this->morphMany(ThreadReaction::class, 'reactable');
    }
}
