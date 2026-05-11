<?php

namespace App\Models;

use Database\Factories\BlogViewFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlogView extends Model
{
    /** @use HasFactory<BlogViewFactory> */
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'blog_id',
        'user_id',
        'ip_address',
        'session_id',
    ];

    public function blog(): BelongsTo
    {
        return $this->belongsTo(Blog::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
