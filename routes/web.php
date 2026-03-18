<?php

use App\Http\Controllers\BlogController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::redirect('dashboard', '/blogs')->name('dashboard');

// Public blog routes
Route::get('blogs', [BlogController::class, 'index'])->name('blogs.index');
Route::get('blogs/authors', [BlogController::class, 'authors'])->name('blogs.authors');

// Public user routes (before auth block and before wildcard)
Route::get('users/search', [UserController::class, 'search'])->name('users.search')->middleware('auth');

// Tags
Route::get('tags/search', [TagController::class, 'search'])->name('tags.search');
Route::post('tags', [TagController::class, 'store'])->name('tags.store')->middleware('auth');

// Authenticated blog routes
Route::middleware('auth')->group(function () {
    // Blog CRUD
    Route::get('blogs/create', [BlogController::class, 'create'])->name('blogs.create');
    Route::post('blogs', [BlogController::class, 'store'])->name('blogs.store');
    Route::get('blogs/{blog}/edit', [BlogController::class, 'edit'])->name('blogs.edit');
    Route::patch('blogs/{blog}', [BlogController::class, 'update'])->name('blogs.update');
    Route::delete('blogs/{blog}', [BlogController::class, 'destroy'])->name('blogs.destroy');
    Route::patch('blogs/{blog}/restore', [BlogController::class, 'restore'])->name('blogs.restore');
    Route::patch('blogs/{blog}/publish', [BlogController::class, 'publish'])->name('blogs.publish');
    Route::get('my-blogs', [BlogController::class, 'userBlogs'])->name('blogs.user-blogs');

    // Comments
    Route::post('blogs/{blog}/comments', [CommentController::class, 'store'])->name('comments.store');
    Route::get('blogs/{blog}/comments', [CommentController::class, 'index'])->name('comments.index');
    Route::patch('comments/{comment}', [CommentController::class, 'update'])->name('comments.update');
    Route::delete('comments/{comment}', [CommentController::class, 'destroy'])->name('comments.destroy');

    // Likes
    Route::post('blogs/{blog}/like', [LikeController::class, 'store'])->name('likes.store');
    Route::delete('blogs/{blog}/like', [LikeController::class, 'destroy'])->name('likes.destroy');
    Route::post('comments/{comment}/like', [LikeController::class, 'storeForComment'])->name('comment-likes.store');
    Route::delete('comments/{comment}/like', [LikeController::class, 'destroyForComment'])->name('comment-likes.destroy');

    // Organizations
    Route::get('organizations/create', [OrganizationController::class, 'create'])->name('organizations.create');
    Route::post('organizations', [OrganizationController::class, 'store'])->name('organizations.store');
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

    // User follow/unfollow
    Route::post('users/{user}/follow', [UserController::class, 'follow'])->name('users.follow');
    Route::delete('users/{user}/follow', [UserController::class, 'unfollow'])->name('users.unfollow');

    // Organization follow/unfollow
    Route::post('organizations/{organization}/follow', [OrganizationController::class, 'follow'])->name('organizations.follow');
    Route::delete('organizations/{organization}/follow', [OrganizationController::class, 'unfollow'])->name('organizations.unfollow');
});

// Public blog wildcard (after static routes to avoid swallowing 'create')
Route::get('blogs/{blog}', [BlogController::class, 'show'])->name('blogs.show');

// Public user routes
Route::get('users/{user}', [UserController::class, 'show'])->name('users.show');
Route::get('users/{user}/followers', [UserController::class, 'followers'])->name('users.followers');
Route::get('users/{user}/following', [UserController::class, 'following'])->name('users.following');

// Public organization routes
Route::get('organizations', [OrganizationController::class, 'index'])->name('organizations.index');
Route::get('organizations/{organization}', [OrganizationController::class, 'show'])->name('organizations.show');

require __DIR__.'/settings.php';
