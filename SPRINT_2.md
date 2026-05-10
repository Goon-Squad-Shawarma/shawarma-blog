# Sprint 2 — Community & Growth

## Context for the Implementing AI

This is a **Laravel 12 + Inertia.js v2 + React 19 + Tailwind v4 + shadcn/ui** blogging platform.
Read this document top to bottom before writing a single line of code.
Every file reference, class name, and Artisan command in this document is exact — verified against the actual codebase.

### Key Conventions You Must Follow
- All PHP is formatted by **Pint** (`vendor/bin/pint --dirty --format agent`) — run it after every PHP file change.
- All tests use **Pest v4** (`php artisan test --compact`). Write a test for every new backend feature.
- All Form Requests live in `app/Http/Requests/`. Always use Form Request classes — never inline `$request->validate()` in controllers (look at how existing controllers do it — currently they use inline validation but the CLAUDE.md rule requires Form Requests, so use them for all NEW controllers).
- All React components use **shadcn/ui** components from `resources/js/components/ui/`. Never write makeshift HTML button/card/input elements. Look at existing components in `resources/js/components/` for patterns.
- Routes use **Wayfinder** — import from `@/routes/{resource}` in TSX files. Run `php artisan wayfinder:generate` after adding routes.
- New models go through `php artisan make:model ModelName -mf` (migration + factory together).
- Type declarations: every PHP method needs explicit return types. Use constructor property promotion.
- Middleware is registered in `bootstrap/app.php`, not a Kernel. Rate limiting is registered in `AppServiceProvider`.

### Existing Infrastructure Already In Place (Do Not Re-implement)
- **Novu in-app notifications**: `@novu/react` SDK is installed. `resources/js/components/navbar-components/notification-menu.tsx` already renders `<Notifications />` from Novu with a live unread badge. Novu workflows are triggered via `App\Services\NovuService::triggerWorkflow(string $workflowId, string $subscriberUuid, array $payload)`. The service gracefully logs failures.
- **Auth**: Fortify handles login/register/2FA/email-verify. `routes/web.php` has all auth routes.
- **S3**: All file uploads go through the `s3` disk. URL resolution happens in model Attribute accessors.
- **Queue**: Laravel queue is configured. Jobs extend `Illuminate\Foundation\Queue\Queueable` and implement `ShouldQueue`. See `app/Jobs/CreateNovuSubscriberJob.php` for the exact pattern.
- **Follow system**: `follows` table has `user_id`, `following_user_id` (nullable), `following_organization_id` (nullable). `User` model has `followingUsers()`, `followers()`, `followingOrganizations()` BelongsToMany methods.
- **Policies**: Registered in `app/Providers/AuthServiceProvider.php`. All policies live in `app/Policies/`. See `LikePolicy` for the minimal pattern.
- **Route model binding**: Blogs resolve by `slug` not `id`. Users resolve by default `id`.

---

## Milestones (strict dependency order — implement in this sequence)

| # | Milestone | Depends On |
|---|-----------|------------|
| 1 | **Landing Page Public Feed** | Nothing — purely UI |
| 2 | **Bookmarks** | Role 1 policy, Role 2 migration |
| 3 | **View Tracking** | Role 2 migration |
| 4 | **Personalized Feed (Dashboard)** | Bookmarks + Views data |
| 5 | **Novu Notification Triggers** | Existing Novu infra |
| 6 | **Email Digest Campaigns** | Follows data, Mailable, Queue |
| 7 | **AI Post Assistant** | `laravel/ai` package |

---

## Role 1 — Security

### Goal
Add all new policies and rate limits before any controller is written.

### Tasks

#### 1.1 — BookmarkPolicy
Create: `php artisan make:policy BookmarkPolicy --model=Bookmark`
File: `app/Policies/BookmarkPolicy.php`

```php
// Pattern: identical to LikePolicy (app/Policies/LikePolicy.php)
// create(): return true (any auth user can bookmark)
// delete(): return $bookmark->user_id === $user->id
```

Register in `app/Providers/AuthServiceProvider.php` under `$policies`:
```php
\App\Models\Bookmark::class => \App\Policies\BookmarkPolicy::class,
```

#### 1.2 — CampaignPolicy
Create: `php artisan make:policy CampaignPolicy --model=Campaign`
File: `app/Policies/CampaignPolicy.php`

Rules:
- `create(User $user): bool` — return `true` (any auth user)
- `send(User $user, Campaign $campaign): bool` — if `$campaign->organization_id` is null, return `$campaign->user_id === $user->id`. If org campaign, return `$user->hasRole($campaign->organization, OrganizationRole::ADMIN)`.
- `view(User $user, Campaign $campaign): bool` — same logic as `send`.
- `delete(User $user, Campaign $campaign): bool` — same logic as `send`, AND `$campaign->status === 'draft'`.

Register in `AuthServiceProvider`.

#### 1.3 — Extend BlogPolicy
File: `app/Policies/BlogPolicy.php`

Add method `viewAnalytics(User $user, Blog $blog): bool`:
```php
// Return true if $user is the blog author ($blog->user_id === $user->id)
// OR if the blog belongs to an org and $user has ADMIN or EDITOR role in that org
// Pattern: look at the existing update() method in the same file — same logic
```

#### 1.4 — Rate Limiting
File: `app/Providers/AppServiceProvider.php` — add inside `boot()`:

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

RateLimiter::for('follow', fn (Request $request) => Limit::perMinute(30)->by($request->user()?->id ?: $request->ip()));
RateLimiter::for('bookmarks', fn (Request $request) => Limit::perMinute(60)->by($request->user()?->id ?: $request->ip()));
RateLimiter::for('campaigns', fn (Request $request) => Limit::perMinute(5)->by($request->user()?->id ?: $request->ip()));
```

Apply in routes (Role 5 will add `->middleware('throttle:follow')` etc. to the relevant route groups).

---

## Role 2 — Database

### Goal
Four new migrations, four new models, four new factories. Run them in order.

### Tasks

#### 2.1 — blog_views table
```bash
php artisan make:model BlogView -mf
```

Migration columns:
```php
$table->id();
$table->foreignId('blog_id')->constrained('blogs')->cascadeOnDelete();
$table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
$table->string('ip_address', 45)->nullable(); // supports IPv6
$table->string('session_id', 100)->nullable();
$table->timestamps(); // only created_at is actually used; updatedAt() can be disabled
// Unique constraint: one view per user per blog (for logged-in users)
$table->unique(['blog_id', 'user_id']); // guests tracked differently, no unique on IP
```

Model `app/Models/BlogView.php`:
```php
// $fillable: ['blog_id', 'user_id', 'ip_address', 'session_id']
// public $timestamps = false; — only store created_at, add $table->timestamp('created_at')->useCurrent(); instead
// BelongsTo: blog(), user()
```

Factory: generate with random `ip_address` using `fake()->ipv4()`, `user_id` from existing user.

#### 2.2 — bookmarks table
```bash
php artisan make:model Bookmark -mf
```

Migration columns:
```php
$table->id();
$table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
$table->foreignId('blog_id')->constrained('blogs')->cascadeOnDelete();
$table->timestamps();
$table->unique(['user_id', 'blog_id']); // no duplicate bookmarks
```

Model `app/Models/Bookmark.php`:
```php
// $fillable: ['user_id', 'blog_id']
// BelongsTo: user(), blog()
```

Factory: use existing `UserFactory` and `BlogFactory` states.

Add to `User` model (`app/Models/User.php`):
```php
public function bookmarks(): HasMany
{
    return $this->hasMany(Bookmark::class);
}
```

Add to `Blog` model (`app/Models/Blog.php`):
```php
public function bookmarks(): HasMany
{
    return $this->hasMany(Bookmark::class);
}

public function views(): HasMany
{
    return $this->hasMany(BlogView::class);
}
```

#### 2.3 — campaigns table
```bash
php artisan make:model Campaign -mf
```

Migration columns:
```php
$table->id();
$table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
$table->foreignId('organization_id')->nullable()->constrained('organizations')->cascadeOnDelete();
$table->string('subject');
$table->longText('body'); // HTML from the rich text editor
$table->enum('status', ['draft', 'sending', 'sent', 'failed'])->default('draft');
$table->unsignedInteger('recipient_count')->default(0);
$table->timestamp('sent_at')->nullable();
$table->timestamps();
// At least one of user_id or organization_id must be set — enforce in validation, not DB
```

Model `app/Models/Campaign.php`:
```php
// $fillable: ['user_id', 'organization_id', 'subject', 'body', 'status', 'recipient_count', 'sent_at']
// casts(): 'sent_at' => 'datetime', 'status' => CampaignStatus::class (see Role 2.5)
// BelongsTo: user(), organization()
// Scopes: scopeDraft($q), scopeSent($q)
```

#### 2.4 — CampaignStatus Enum
```bash
php artisan make:enum Enums/CampaignStatus --backed=string
```
File: `app/Enums/CampaignStatus.php`
Cases: `Draft = 'draft'`, `Sending = 'sending'`, `Sent = 'sent'`, `Failed = 'failed'`

#### 2.5 — Update DatabaseSeeder
File: `database/seeders/DatabaseSeeder.php`

Add after existing seeder logic:
- 3 bookmarks per seeded user (random blogs)
- 5–10 blog views per seeded blog (mix of user and guest views)
- 1 draft campaign per first test user

#### 2.6 — Run migrations
```bash
php artisan migrate
```

---

## Role 3 — UI/UX

### Goal
Two UI deliverables: (1) public post feed on the landing page, (2) BookmarkButton component.
All components must use shadcn/ui primitives from `resources/js/components/ui/`.

### Tasks

#### 3.1 — Landing Page Public Feed
File to modify: `resources/js/pages/welcome.tsx`

**What to add**: Below the existing `<ShaderBackground>` hero section, add a full-width section that shows the 6 most recently published public blogs.

**Data source**: The backend (`routes/web.php` — the `/` route) must pass `recentBlogs` as an Inertia prop. Each blog object includes: `id`, `title`, `subtitle`, `slug`, `banner_url`, `reading_time`, `published_at`, `user` (with `first_name`, `last_name`, `avatar_url`), `tags` (array).

**Layout**: A responsive grid — 1 column on mobile, 2 on tablet, 3 on desktop. Each card uses `<Card>` from `resources/js/components/ui/card.tsx`. The card shows:
- Banner image (if present) at top — `<img>` with `object-cover` and fixed height
- Author avatar + name row — use `<Avatar>` from `resources/js/components/ui/avatar.tsx`
- Blog title (bold, clamp to 2 lines)
- Subtitle (text-muted-foreground, clamp to 2 lines)
- Footer row: reading time + published date + tag badges using `<Badge>` from `resources/js/components/ui/badge.tsx`
- Entire card is clickable — `<Link href={route.url}>` using Wayfinder's `show` from `@/routes/blogs`

**Section header**: "What's Being Written" with a "Browse all →" link to `/blogs`.

**Guest CTA**: Below the grid, a centered banner: "Join to read, write, and follow authors you love" with Register + Login buttons. Only shown when `auth.user` is null.

**Backend change** (`routes/web.php`):
```php
Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
        'recentBlogs' => \App\Models\Blog::where('visibility', 'public')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->with(['user:id,first_name,last_name,avatar_url', 'tags:id,name,slug'])
            ->latest('published_at')
            ->limit(6)
            ->get(['id', 'title', 'subtitle', 'slug', 'banner_url', 'reading_time', 'published_at', 'user_id']),
    ]);
})->name('home');
```

#### 3.2 — BookmarkButton Component
File to create: `resources/js/components/bookmarks/bookmark-button.tsx`

**Pattern**: Copy `resources/js/components/likes/like-button.tsx` exactly — same optimistic state pattern, same fetch + CSRF approach.

Props interface:
```ts
interface BookmarkButtonProps {
  blogSlug: string
  bookmarked: boolean
  bookmarksCount: number
}
```

Use `BookmarkIcon` from `lucide-react` (filled when bookmarked, outline when not).
Import routes from `@/routes/bookmarks` (Wayfinder — generated after routes are added).
On success: toggle state, update count. On failure: revert state, show an error toast (import `ErrorToast` from `resources/js/components/error-toast.tsx`).

Add `BookmarkButton` to the blog show page (`resources/js/pages/blogs/show.tsx`) in the same action row as `LikeButton` and `ShareButton`.

#### 3.3 — Trending Sidebar on Blogs Index
File to modify: `resources/js/pages/blogs/index.tsx`

Add a right sidebar (visible on `lg:` screens and up) that shows "Trending This Week" — a list of 5 blog cards (compact: title + author name + view count + like count). Data comes from a `trendingBlogs` prop passed by `BlogController::index()`.

Each item links to the blog show page via Wayfinder `show({ slug })`.

#### 3.4 — Campaign Composer Page
File to create: `resources/js/pages/campaigns/create.tsx`

Layout: two-column on desktop (form left, preview right). Form fields:
- Subject — `<Input>` from shadcn/ui
- Body — use the existing rich text editor. Check `resources/js/components/editor/` for the existing editor component (used in blog create/edit). Reuse it.
- Recipient preview — a read-only count: "This will be sent to {N} followers". Fetched from the backend when the page loads (passed as `followerCount` prop).
- Submit button: "Save Draft" (default) and "Send Now" (destructive variant, triggers confirmation dialog using `<AlertDialog>` from shadcn/ui)

---

## Role 4 — Frontend

### Goal
Four new pages + new TypeScript types. All pages use `AppLayout` from `resources/js/layouts/app-layout.tsx`.

### Tasks

#### 4.1 — TypeScript Types
File to modify: create `resources/js/types/models.ts` (new file, then re-export from `resources/js/types/index.ts`).

Add these types:
```ts
export type BlogView = {
    id: number;
    blog_id: number;
    user_id: number | null;
    ip_address: string | null;
    created_at: string;
};

export type Bookmark = {
    id: number;
    user_id: number;
    blog_id: number;
    blog?: Blog; // eager loaded
    created_at: string;
};

export type Campaign = {
    id: number;
    user_id: number | null;
    organization_id: number | null;
    subject: string;
    body: string;
    status: 'draft' | 'sending' | 'sent' | 'failed';
    recipient_count: number;
    sent_at: string | null;
    created_at: string;
    updated_at: string;
    user?: User;
    organization?: Organization;
};

// Blog type — extend what's already in use across pages
export type Blog = {
    id: number;
    title: string;
    subtitle: string | null;
    slug: string;
    content: string;
    banner_url: string | null;
    reading_time: number;
    published_at: string | null;
    visibility: 'public' | 'private';
    user_id: number;
    organization_id: number | null;
    user?: User;
    organization?: Organization;
    tags?: Tag[];
    likes_count?: number;
    bookmarks_count?: number;
    views_count?: number;
    is_liked?: boolean;
    is_bookmarked?: boolean;
    created_at: string;
    updated_at: string;
};

export type Tag = {
    id: number;
    name: string;
    slug: string;
};

export type PaginatedResponse<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};
```

Add to `resources/js/types/index.ts`:
```ts
export type * from './models';
```

#### 4.2 — Dashboard (Personalized Feed)
File to modify: `resources/js/pages/dashboard.tsx`
Currently this page does not exist meaningfully — `routes/web.php` redirects `/dashboard` to `/blogs`. **Remove the redirect** and wire a real controller (Role 5 handles the controller, this task is the React page).

The page receives:
```ts
{
  followingBlogs: PaginatedResponse<Blog>   // blogs from followed users + orgs
  discoverBlogs: PaginatedResponse<Blog>    // trending/recent public blogs not from followed
  activeTab: 'following' | 'discover'
}
```

Layout:
- Use `<Tabs>` from shadcn/ui (`resources/js/components/ui/toggle-group.tsx` may help, but check if shadcn Tabs is available — if not, use toggle buttons to switch state).
- "Following" tab: paginated list of blog cards (same card design as `blogs/index.tsx`)
- "Discover" tab: same layout with different data
- Empty state for "Following" when user follows nobody: use `<Empty>` from `resources/js/components/ui/empty.tsx` with a CTA to browse authors

#### 4.3 — Bookmarks Page
File to create: `resources/js/pages/bookmarks/index.tsx`

Receives: `{ bookmarks: PaginatedResponse<Bookmark> }` where each `Bookmark` has `blog` eagerly loaded.
Layout: identical to `blogs/index.tsx` — same card grid. If empty, show `<Empty>` with text "No saved posts yet — bookmark posts to read them later."

#### 4.4 — Campaigns List Page
File to create: `resources/js/pages/campaigns/index.tsx`

Receives: `{ campaigns: PaginatedResponse<Campaign>, followerCount: number }`
Layout: a table using `<Card>` wrapper with rows showing subject, status badge (`<Badge>` with color variants: draft=secondary, sending=warning, sent=success, failed=destructive), recipient count, sent_at date, and actions (View / Delete for drafts / Send for drafts).

#### 4.5 — Campaign Show Page
File to create: `resources/js/pages/campaigns/show.tsx`

Receives: `{ campaign: Campaign }`
Shows: subject, status, recipient count, sent_at, and the rendered HTML body in a read-only `<div dangerouslySetInnerHTML={{ __html: campaign.body }} />` wrapper (safe because it is the author's own content).

#### 4.6 — Wayfinder Generation
After all routes are added (Role 5), run:
```bash
php artisan wayfinder:generate
```
This generates files in `resources/js/routes/` and `resources/js/actions/`. Import from these in TSX files.

---

## Role 5 — Backend

### Goal
Seven new controllers. All controllers follow the `LikeController` / `OrganizationController` patterns — use `$this->authorize()`, return `Inertia::render()` for page responses and `response()->json()` for API responses.

### Tasks

#### 5.1 — Remove the dashboard redirect and add FeedController
In `routes/web.php`, remove:
```php
Route::redirect('dashboard', '/blogs')->name('dashboard');
```

Add inside the `auth + verified` middleware group:
```php
Route::get('dashboard', [FeedController::class, 'index'])->name('dashboard');
```

Create controller:
```bash
php artisan make:controller FeedController
```

File: `app/Http/Controllers/FeedController.php`

`index(Request $request)` logic:
```php
// Get IDs of followed users and orgs
$user = auth()->user();
$followedUserIds = $user->followingUsers()->pluck('users.id');
$followedOrgIds = $user->followingOrganizations()->pluck('organizations.id');

// Following feed
$followingBlogs = Blog::where('visibility', 'public')
    ->whereNotNull('published_at')
    ->where('published_at', '<=', now())
    ->where(function ($q) use ($followedUserIds, $followedOrgIds) {
        $q->whereIn('user_id', $followedUserIds)
          ->orWhereIn('organization_id', $followedOrgIds);
    })
    ->with(['user:id,first_name,last_name,avatar_url,username', 'organization:id,name,slug', 'tags'])
    ->withCount(['likes', 'bookmarks', 'views'])
    ->latest('published_at')
    ->paginate(12);

// Discover feed — public blogs NOT from followed
$discoverBlogs = Blog::where('visibility', 'public')
    ->whereNotNull('published_at')
    ->where('published_at', '<=', now())
    ->whereNotIn('user_id', $followedUserIds)
    ->whereNotIn('organization_id', $followedOrgIds->toArray())
    ->with(['user:id,first_name,last_name,avatar_url,username', 'organization:id,name,slug', 'tags'])
    ->withCount(['likes', 'bookmarks', 'views'])
    ->latest('published_at')
    ->paginate(12);

return Inertia::render('dashboard', [
    'followingBlogs' => $followingBlogs,
    'discoverBlogs' => $discoverBlogs,
]);
```

#### 5.2 — BookmarkController
```bash
php artisan make:controller BookmarkController
```

File: `app/Http/Controllers/BookmarkController.php`

Routes to add in `routes/web.php` (inside auth+verified group, with `throttle:bookmarks` middleware):
```php
Route::get('bookmarks', [BookmarkController::class, 'index'])->name('bookmarks.index');
Route::post('blogs/{blog}/bookmark', [BookmarkController::class, 'store'])->name('bookmarks.store')->middleware('throttle:bookmarks');
Route::delete('blogs/{blog}/bookmark', [BookmarkController::class, 'destroy'])->name('bookmarks.destroy')->middleware('throttle:bookmarks');
```

Methods:
- `index(Request $request)`: Load `auth()->user()->bookmarks()->with('blog.user', 'blog.tags')->latest()->paginate(12)`. Return `Inertia::render('bookmarks/index', ['bookmarks' => ...])`.
- `store(Request $request, Blog $blog)`: `$this->authorize('create', Bookmark::class)`. Use `Bookmark::firstOrCreate(['user_id' => auth()->id(), 'blog_id' => $blog->id])`. Return JSON `{bookmarked: true, bookmarks_count: $blog->bookmarks()->count()}`.
- `destroy(Blog $blog)`: Find bookmark, `$this->authorize('delete', $bookmark)`, delete. Return JSON `{bookmarked: false, bookmarks_count: ...}`.

#### 5.3 — BlogViewController (view tracking)
```bash
php artisan make:controller BlogViewController
```

This controller has no routes — it is called internally from `BlogController::show()`.
Add a private method or dispatch a job directly. See Role 6 (`TrackBlogViewJob`) for the job.

Modify `BlogController::show(Blog $blog)` — after the authorization check and before `Inertia::render()`, dispatch:
```php
TrackBlogViewJob::dispatch($blog, auth()->id(), request()->ip(), session()->getId());
```

Also add `views_count`, `bookmarks_count`, and `is_bookmarked` to the Inertia props returned by `show()`:
```php
'views_count' => $blog->views()->count(),
'bookmarks_count' => $blog->bookmarks()->count(),
'is_bookmarked' => auth()->check() ? $blog->bookmarks()->where('user_id', auth()->id())->exists() : false,
```

#### 5.4 — Trending query in BlogController
In `BlogController::index()`, add to the returned Inertia props:
```php
'trendingBlogs' => Blog::where('visibility', 'public')
    ->whereNotNull('published_at')
    ->where('published_at', '>=', now()->subDays(7))
    ->withCount(['likes', 'views'])
    ->orderByRaw('(likes_count + views_count) DESC')
    ->limit(5)
    ->with('user:id,first_name,last_name')
    ->get(['id', 'title', 'slug', 'reading_time', 'user_id']),
```

#### 5.5 — CampaignController
```bash
php artisan make:controller CampaignController
```

Routes (inside auth+verified group):
```php
Route::get('campaigns', [CampaignController::class, 'index'])->name('campaigns.index');
Route::get('campaigns/create', [CampaignController::class, 'create'])->name('campaigns.create');
Route::post('campaigns', [CampaignController::class, 'store'])->name('campaigns.store');
Route::get('campaigns/{campaign}', [CampaignController::class, 'show'])->name('campaigns.show');
Route::delete('campaigns/{campaign}', [CampaignController::class, 'destroy'])->name('campaigns.destroy');
Route::post('campaigns/{campaign}/send', [CampaignController::class, 'send'])->name('campaigns.send')->middleware('throttle:campaigns');
```

Form Request: `php artisan make:request StoreCampaignRequest`
Rules: `subject` required|string|max:255, `body` required|string, `organization_id` nullable|exists:organizations,id

`index()`: Load campaigns where `user_id = auth()->id()` OR `organization_id` is in orgs the user admins. Include `followerCount` = total unique followers.

`create()`: `$this->authorize('create', Campaign::class)`. Calculate `followerCount` = `auth()->user()->followers()->count()`. Return Inertia render.

`store(StoreCampaignRequest $request)`: Create campaign with status `draft`. Redirect to `campaigns.show`.

`send(Campaign $campaign)`:
```php
$this->authorize('send', $campaign);
abort_if($campaign->status !== 'draft', 422, 'Campaign already sent.');
$campaign->update(['status' => 'sending']);
SendCampaignJob::dispatch($campaign)->onQueue('campaigns');
return redirect()->route('campaigns.show', $campaign)->with('success', 'Campaign is being sent.');
```

`destroy(Campaign $campaign)`:
```php
$this->authorize('delete', $campaign);
$campaign->delete();
return redirect()->route('campaigns.index')->with('success', 'Campaign deleted.');
```

---

## Role 6 — Feature Dev

### Goal
Install `laravel/ai`, write all queued jobs, wire Novu triggers, build Mailable for campaigns.

### Tasks

#### 6.1 — Install laravel/ai
```bash
composer require laravel/ai
php artisan ai:install
```

This publishes a config at `config/ai.php`. Set the driver and API key via `.env`:
```
AI_DEFAULT_DRIVER=openai
OPENAI_API_KEY=your-key-here
```

Create `AiController`:
```bash
php artisan make:controller AiController
```

Add route (auth+verified):
```php
Route::post('ai/draft', [AiController::class, 'draft'])->name('ai.draft');
```

`AiController::draft(Request $request)`:
- Validate: `topic` required|string|max:500, `outline` nullable|string|max:2000
- Use `laravel/ai` to generate a blog post draft. Consult the `laravel/ai` docs for exact syntax — look at `search-docs` if needed.
- Return `response()->json(['content' => $generatedContent])`.

Modify `resources/js/pages/blogs/create.tsx` and `edit.tsx`:
- Add an "AI Draft" `<Button>` (variant secondary) near the content editor
- On click: open a `<Dialog>` from shadcn/ui asking for topic + optional outline
- On submit: POST to the AI draft route (use Wayfinder), receive content, inject it into the editor state

#### 6.2 — TrackBlogViewJob
```bash
php artisan make:job TrackBlogViewJob
```

File: `app/Jobs/TrackBlogViewJob.php`

```php
// Constructor: public Blog $blog, public ?int $userId, public string $ip, public string $sessionId
// handle(): 
//   If $userId is not null: use updateOrInsert(['blog_id' => $blog->id, 'user_id' => $this->userId], ['ip_address' => $this->ip, 'session_id' => $this->sessionId, 'created_at' => now()])
//   If $userId is null: insert only if no row with same session_id+blog_id exists
//   Use DB::table('blog_views') directly for performance
// Queue: 'default'
// No retries needed — view tracking is best-effort
```

#### 6.3 — NotifyFollowersOfNewBlogJob
```bash
php artisan make:job NotifyFollowersOfNewBlogJob
```

File: `app/Jobs/NotifyFollowersOfNewBlogJob.php`

```php
// Constructor: public Blog $blog
// handle(NovuService $novu):
//   Get all followers of the blog's author (user): $blog->user->followers
//   For each follower, call $novu->triggerWorkflow('new_blog_from_following', $follower->uuid, [
//       'blog_title' => $blog->title,
//       'blog_slug' => $blog->slug,
//       'author_name' => $blog->user->first_name . ' ' . $blog->user->last_name,
//   ])
// Queue: 'default'
```

Wire it: in `BlogController::publish()`, after updating `published_at`, dispatch:
```php
NotifyFollowersOfNewBlogJob::dispatch($blog);
```

#### 6.4 — NotifyOnNewFollowerJob
```bash
php artisan make:job NotifyOnNewFollowerJob
```

```php
// Constructor: public User $follower, public User $followedUser
// handle(NovuService $novu):
//   $novu->triggerWorkflow('new_follower', $followedUser->uuid, [
//       'follower_name' => $follower->first_name . ' ' . $follower->last_name,
//       'follower_username' => $follower->username,
//   ])
```

Wire it: in `UserController::follow()`, after `Follow::firstOrCreate(...)`, dispatch:
```php
NotifyOnNewFollowerJob::dispatch(auth()->user(), $user);
```

#### 6.5 — NotifyOnCommentJob
```bash
php artisan make:job NotifyOnCommentJob
```

```php
// Constructor: public Comment $comment
// handle(NovuService $novu):
//   Notify the blog author (if commenter is not the author):
//   if ($comment->user_id !== $comment->blog->user_id) {
//       $novu->triggerWorkflow('blog_comment', $comment->blog->user->uuid, [
//           'commenter_name' => $comment->user->first_name . ' ' . $comment->user->last_name,
//           'blog_title' => $comment->blog->title,
//           'blog_slug' => $comment->blog->slug,
//       ]);
//   }
//   If it's a reply, also notify the parent comment author:
//   if ($comment->parent_id && $comment->parent->user_id !== $comment->user_id) {
//       $novu->triggerWorkflow('comment_reply', $comment->parent->user->uuid, [...])
//   }
```

Wire it: in `CommentController::store()`, after comment is created:
```php
NotifyOnCommentJob::dispatch($comment->load('blog.user', 'parent.user', 'user'));
```

#### 6.6 — NotifyOnLikeJob
```bash
php artisan make:job NotifyOnLikeJob
```

```php
// Constructor: public Blog $blog, public User $liker
// handle(NovuService $novu):
//   if ($blog->user_id !== $liker->id) { // don't notify self
//       $novu->triggerWorkflow('blog_liked', $blog->user->uuid, [
//           'liker_name' => $liker->first_name . ' ' . $liker->last_name,
//           'blog_title' => $blog->title,
//           'blog_slug' => $blog->slug,
//       ]);
//   }
```

Wire it: in `LikeController::store()`, after `Like::firstOrCreate(...)`:
```php
NotifyOnLikeJob::dispatch($blog->load('user'), auth()->user());
```

#### 6.7 — SendCampaignJob + CampaignMailable
```bash
php artisan make:job SendCampaignJob
php artisan make:mail CampaignMailable --markdown=emails.campaign
```

**CampaignMailable** (`app/Mail/CampaignMailable.php`):
```php
// Constructor: public Campaign $campaign, public User $recipient
// envelope(): subject = $campaign->subject, from = app name
// content(): markdown view 'emails.campaign' with compact('campaign', 'recipient')
```

Markdown view (`resources/views/emails/campaign.blade.php`):
```blade
@component('mail::message')
# {{ $campaign->subject }}

{!! $campaign->body !!}

---
You're receiving this because you follow {{ $campaign->user?->first_name ?? $campaign->organization?->name }}.

@component('mail::button', ['url' => url('/settings/profile')])
Manage your subscription
@endcomponent
@endcomponent
```

**SendCampaignJob** (`app/Jobs/SendCampaignJob.php`):
```php
// Queue: 'campaigns' (low priority)
// Constructor: public Campaign $campaign
// handle():
//   Determine sender type: user campaign or org campaign
//   Get followers:
//     If $campaign->user_id: $followers = User::whereHas('follows', fn ($q) => $q->where('following_user_id', $campaign->user_id))->get()
//     If $campaign->organization_id: $followers = User::whereHas('follows', fn ($q) => $q->where('following_organization_id', $campaign->organization_id))->get()
//
//   $count = $followers->count();
//   $campaign->update(['recipient_count' => $count, 'status' => 'sending']);
//
//   foreach ($followers->chunk(50) as $chunk) {
//       foreach ($chunk as $follower) {
//           Mail::to($follower->email)->queue(new CampaignMailable($this->campaign, $follower));
//       }
//   }
//
//   $campaign->update(['status' => 'sent', 'sent_at' => now()]);
// 
// Handle failures: use failed() method to set status to 'failed'
```

---

## Role 7 — QA

### Goal
Write Pest feature tests for every new backend feature. Use existing test patterns from `tests/Feature/`.

### Tasks

Run all new tests with:
```bash
php artisan test --compact --filter=Bookmark
php artisan test --compact --filter=Campaign
php artisan test --compact --filter=Feed
php artisan test --compact --filter=BlogView
```

#### 7.1 — Bookmark Tests
```bash
php artisan make:test BookmarkTest --pest
```
File: `tests/Feature/BookmarkTest.php`

Write tests:
- `it stores a bookmark for a blog` — POST `blogs/{blog}/bookmark`, assert 200, assert `bookmarks` table has 1 row
- `it does not create duplicate bookmarks` — POST twice, assert still 1 row (firstOrCreate)
- `it destroys a bookmark` — POST then DELETE, assert `bookmarks` table is empty
- `it requires authentication to bookmark` — unauthenticated POST returns 302 redirect
- `it cannot delete another user's bookmark` — assert 403

#### 7.2 — Campaign Tests
```bash
php artisan make:test CampaignTest --pest
```
File: `tests/Feature/CampaignTest.php`

Write tests:
- `it creates a draft campaign` — POST `campaigns`, assert created with `status = draft`
- `it dispatches SendCampaignJob on send` — `Queue::fake()`, POST `campaigns/{campaign}/send`, assert job dispatched on `campaigns` queue
- `it calculates correct recipient_count` — create 3 followers, send campaign, assert `recipient_count = 3`
- `it prevents non-owner from sending campaign` — assert 403 when different user tries to send
- `it prevents sending an already sent campaign` — assert 422

#### 7.3 — Feed Tests
```bash
php artisan make:test FeedTest --pest
```
File: `tests/Feature/FeedTest.php`

Write tests:
- `it shows blogs from followed users in the feed` — follow a user, create their blog, GET `dashboard`, assert blog in `followingBlogs`
- `it does not show blogs from unfollowed users in following tab`
- `it shows public blogs in discover tab`

#### 7.4 — View Tracking Tests
```bash
php artisan make:test BlogViewTest --pest
```
File: `tests/Feature/BlogViewTest.php`

Write tests:
- `it dispatches TrackBlogViewJob when a blog is viewed` — `Queue::fake()`, GET `blogs/{blog}`, assert `TrackBlogViewJob` dispatched
- `it only records one view per user per blog` — dispatch job twice for same user+blog, assert only 1 row in `blog_views`

---

## Queue Configuration

The `campaigns` queue must be low priority. Configure the worker to process `default` queue first.

In `railway/run-worker.sh` (or your local `php artisan queue:work` invocation):
```bash
php artisan queue:work --queue=default,campaigns
```

This ensures `default` is drained before `campaigns` is processed.

---

## Novu Workflow Registry

These workflow slugs must be created in the Novu dashboard before the jobs will work:

| Slug | Trigger | Payload Keys |
|------|---------|--------------|
| `welcome` | Registration | (already exists) |
| `new_blog_from_following` | Blog published | `blog_title`, `blog_slug`, `author_name` |
| `new_follower` | User followed | `follower_name`, `follower_username` |
| `blog_comment` | Comment on blog | `commenter_name`, `blog_title`, `blog_slug` |
| `comment_reply` | Reply to comment | `commenter_name`, `blog_title`, `blog_slug` |
| `blog_liked` | Blog liked | `liker_name`, `blog_title`, `blog_slug` |

---

## Final Checklist Before Marking Sprint Done

- [ ] `vendor/bin/pint --dirty --format agent` run on all changed PHP files
- [ ] `php artisan wayfinder:generate` run after all routes added
- [ ] `php artisan migrate` run
- [ ] All Pest tests passing: `php artisan test --compact`
- [ ] Novu workflow slugs created in dashboard
- [ ] `.env` updated with `OPENAI_API_KEY` and `AI_DEFAULT_DRIVER=openai`
- [ ] Queue worker configured with `--queue=default,campaigns`
- [ ] `npm run build` (or inform user to run `npm run dev`) for frontend changes
