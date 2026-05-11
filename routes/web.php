<?php

use App\Http\Controllers\AiController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\BookmarkController;
use App\Http\Controllers\CampaignController;
use App\Http\Controllers\CampaignTrackingController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\FeedController;
use App\Http\Controllers\ForumController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\UnsubscribeController;
use App\Http\Controllers\UserController;
use App\Models\Blog;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
        'recentBlogs' => Blog::where('visibility', 'public')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->with(['user:id,first_name,last_name,avatar_url', 'tags:id,name,slug'])
            ->latest('published_at')
            ->limit(6)
            ->get(['id', 'title', 'subtitle', 'slug', 'banner_url', 'reading_time', 'published_at', 'user_id']),
    ]);
})->name('home');

Route::get('/mvp', function () {
    return Inertia::render('mvp', [
        'videoUrl' => config('app.mvp_showcase_url'),
    ]);
})->name('mvp');

// Public blog routes — visible to guests; BlogPolicy::view enforces visibility.
Route::get('blogs', [BlogController::class, 'index'])->name('blogs.index');
Route::get('blogs/{blog}', [BlogController::class, 'show'])
    ->where('blog', '(?!create|authors)[A-Za-z0-9\-_]+')
    ->name('blogs.show');
Route::get('blogs/{blog}/comments', [CommentController::class, 'index'])->name('comments.index');

// Forums (public read)
Route::get('forums', [ForumController::class, 'index'])->name('forums.index');
Route::get('forums/{thread}', [ForumController::class, 'show'])
    ->where('thread', '(?!create)[A-Za-z0-9\-_]+')
    ->name('forums.show');

// Unsubscribe (public, token-gated)
Route::get('unsubscribe/{token}', [UnsubscribeController::class, 'show'])->name('unsubscribe.show');
Route::post('unsubscribe/{token}', [UnsubscribeController::class, 'update'])->name('unsubscribe.update');

// Campaign open-tracking pixel (public, token-gated)
Route::get('e/o/{token}.gif', [CampaignTrackingController::class, 'open'])->name('campaigns.track.open');

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard (personalized feed)
    Route::get('dashboard', [FeedController::class, 'index'])->name('dashboard');

    // Analytics
    Route::get('my/analytics', [AnalyticsController::class, 'personal'])->name('analytics.personal');
    Route::get('organizations/{organization}/analytics', [AnalyticsController::class, 'organization'])->name('analytics.organization');

    // Bookmarks
    Route::get('bookmarks', [BookmarkController::class, 'index'])->name('bookmarks.index');
    Route::post('blogs/{blog}/bookmark', [BookmarkController::class, 'store'])->name('bookmarks.store')->middleware('throttle:bookmarks');
    Route::delete('blogs/{blog}/bookmark', [BookmarkController::class, 'destroy'])->name('bookmarks.destroy')->middleware('throttle:bookmarks');

    // Campaigns
    Route::get('campaigns', [CampaignController::class, 'index'])->name('campaigns.index');
    Route::get('campaigns/create', [CampaignController::class, 'create'])->name('campaigns.create');
    Route::post('campaigns', [CampaignController::class, 'store'])->name('campaigns.store');
    Route::get('campaigns/{campaign}', [CampaignController::class, 'show'])->name('campaigns.show');
    Route::delete('campaigns/{campaign}', [CampaignController::class, 'destroy'])->name('campaigns.destroy');
    Route::post('campaigns/{campaign}/send', [CampaignController::class, 'send'])->name('campaigns.send')->middleware('throttle:campaigns');

    // AI draft
    Route::post('ai/draft', [AiController::class, 'draft'])->name('ai.draft');

    // Forums (authed write)
    Route::post('forums', [ForumController::class, 'store'])->name('forums.store');
    Route::post('forums/{thread}/replies', [ForumController::class, 'storeReply'])->name('forums.replies.store');
    Route::delete('forums/{thread}', [ForumController::class, 'destroy'])->name('forums.destroy');
    Route::post('forums/{thread}/vote', [ForumController::class, 'toggleVote'])->name('forums.vote');
    Route::post('forums/reactions', [ForumController::class, 'toggleReaction'])->name('forums.reactions');

    // Blog authors search (must precede any wildcard usage)
    Route::get('blogs/authors', [BlogController::class, 'authors'])->name('blogs.authors');

    // Static blog routes
    Route::get('blogs/create', [BlogController::class, 'create'])->name('blogs.create');
    Route::post('blogs', [BlogController::class, 'store'])->name('blogs.store');
    Route::get('my-blogs', [BlogController::class, 'userBlogs'])->name('blogs.user-blogs');

    // Authed blog actions
    Route::get('blogs/{blog}/edit', [BlogController::class, 'edit'])->name('blogs.edit');
    Route::patch('blogs/{blog}', [BlogController::class, 'update'])->name('blogs.update');
    Route::delete('blogs/{blog}', [BlogController::class, 'destroy'])->name('blogs.destroy');
    Route::patch('blogs/{blog}/restore', [BlogController::class, 'restore'])->name('blogs.restore');
    Route::patch('blogs/{blog}/publish', [BlogController::class, 'publish'])->name('blogs.publish');

    // Comments
    Route::post('blogs/{blog}/comments', [CommentController::class, 'store'])->name('comments.store');
    Route::patch('comments/{comment}', [CommentController::class, 'update'])->name('comments.update');
    Route::delete('comments/{comment}', [CommentController::class, 'destroy'])->name('comments.destroy');

    // Likes
    Route::post('blogs/{blog}/like', [LikeController::class, 'store'])->name('likes.store');
    Route::delete('blogs/{blog}/like', [LikeController::class, 'destroy'])->name('likes.destroy');
    Route::post('comments/{comment}/like', [LikeController::class, 'storeForComment'])->name('comment-likes.store');
    Route::delete('comments/{comment}/like', [LikeController::class, 'destroyForComment'])->name('comment-likes.destroy');

    // Tags
    Route::get('tags/search', [TagController::class, 'search'])->name('tags.search');
    Route::post('tags', [TagController::class, 'store'])->name('tags.store');

    // Users
    Route::get('users/search', [UserController::class, 'search'])->name('users.search');
    Route::get('network', [UserController::class, 'network'])->name('users.network');
    Route::get('users/{user}', [UserController::class, 'show'])->name('users.show');
    Route::get('users/{user}/followers', [UserController::class, 'followers'])->name('users.followers');
    Route::get('users/{user}/following', [UserController::class, 'following'])->name('users.following');
    Route::post('users/{user}/follow', [UserController::class, 'follow'])->name('users.follow');
    Route::delete('users/{user}/follow', [UserController::class, 'unfollow'])->name('users.unfollow');

    // Organizations
    Route::get('organizations', [OrganizationController::class, 'index'])->name('organizations.index');
    Route::get('organizations/create', [OrganizationController::class, 'create'])->name('organizations.create');
    Route::post('organizations', [OrganizationController::class, 'store'])->name('organizations.store');
    Route::get('organizations/{organization}', [OrganizationController::class, 'show'])->name('organizations.show');
    Route::get('organizations/{organization}/edit', [OrganizationController::class, 'edit'])->name('organizations.edit');
    Route::patch('organizations/{organization}', [OrganizationController::class, 'update'])->name('organizations.update');
    Route::delete('organizations/{organization}', [OrganizationController::class, 'destroy'])->name('organizations.destroy');
    Route::post('organizations/{organization}/members', [OrganizationController::class, 'addMember'])->name('organizations.add-member');
    Route::delete('organizations/{organization}/members/{user}', [OrganizationController::class, 'removeMember'])->name('organizations.remove-member');
    Route::patch('organizations/{organization}/members/{user}/role', [OrganizationController::class, 'updateMemberRole'])->name('organizations.update-member-role');

    // Organization invitations
    Route::post('organizations/{organization}/invitations', [InvitationController::class, 'store'])->name('organizations.invite');
    Route::delete('organizations/{organization}/invitations/{invitation}', [InvitationController::class, 'cancel'])->name('organizations.invitation-cancel');
    Route::post('organizations/{organization}/invitations/{invitation}/resend', [InvitationController::class, 'resend'])->name('organizations.invitation-resend');

    // Organization follow/unfollow
    Route::post('organizations/{organization}/follow', [OrganizationController::class, 'follow'])->name('organizations.follow');
    Route::delete('organizations/{organization}/follow', [OrganizationController::class, 'unfollow'])->name('organizations.unfollow');
});

require __DIR__.'/settings.php';
