<?php

namespace App\Models;

use App\Enums\PostVisibility;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class Blog extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'organization_id',
        'title',
        'slug',
        'subtitle',
        'content',
        'banner_url',
        'published_at',
        'visibility',
        'reading_time'
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'visibility' => PostVisibility::class,
        'reading_time' => 'integer'
    ];

    /**
     * The Author of the post.
     */
    public function user(): BelongsTo 
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The Organization of the post.
     */
    public function organization(): BelongsTo 
    {
        return $this->belongsTo(Organization::class);

    }

    public function tags(): BelongsToMany 
    {
        return $this->belongsToMany(Tag::class, 'post_tag', 'blog_id', 'tag_id')->withTimestamps();
    }

    public function likes(): HasMany
    {
        return $this->hasMany(Like::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function likedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'likes')->withTimestamps();
    }

    public function isDraft(): bool
    {
        return $this->published_at === null;
    }

    public function isPublished(): bool
    {
        return $this->published_at !== null && $this->published_at->isPast();
    }

    public function isScheduled(): bool
    {
        return $this->published_at !== null && $this->published_at->isFuture();
    }
    
    protected static function booted() 
    {
        static::saving(function ($blog) {
            // Generate a slug when saving
            if ($blog->isDirty('slug')){
                $blog->slug = Str::slug($blog->title) . '-' . Str::random(5);
            }
            // Calculate reading time when saving (200 words per minute)
            $wordCount = str_word_count(strip_tags($blog->content));
            $blog->reading_time = ceil($wordCount / 200);
        });
    }

}
