<?php

namespace App\Http\Controllers;

use App\Enums\CampaignStatus;
use App\Models\Blog;
use App\Models\BlogView;
use App\Models\Bookmark;
use App\Models\Campaign;
use App\Models\Comment;
use App\Models\Follow;
use App\Models\Like;
use App\Models\Organization;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    private const DAYS = 30;

    /**
     * Personal analytics for the authenticated user (their own blogs).
     */
    public function personal(Request $request): Response
    {
        $user = $request->user();

        $blogIds = Blog::query()
            ->where('user_id', $user->id)
            ->whereNull('organization_id')
            ->pluck('id');

        $totals = [
            'blogs' => $blogIds->count(),
            'views' => BlogView::whereIn('blog_id', $blogIds)->count(),
            'likes' => Like::query()
                ->where('likeable_type', Blog::class)
                ->whereIn('likeable_id', $blogIds)
                ->count(),
            'bookmarks' => Bookmark::whereIn('blog_id', $blogIds)->count(),
            'comments' => Comment::whereIn('blog_id', $blogIds)->count(),
            'followers' => $user->followers()->count(),
            'campaigns_sent' => Campaign::query()
                ->where('user_id', $user->id)
                ->whereNull('organization_id')
                ->where('status', CampaignStatus::Sent)
                ->count(),
            'campaign_opens' => (int) Campaign::query()
                ->where('user_id', $user->id)
                ->whereNull('organization_id')
                ->where('status', CampaignStatus::Sent)
                ->sum('opened_count'),
        ];

        $engagement = $this->engagementSeries(
            views: BlogView::whereIn('blog_id', $blogIds),
            likes: Like::query()
                ->where('likeable_type', Blog::class)
                ->whereIn('likeable_id', $blogIds),
            bookmarks: Bookmark::whereIn('blog_id', $blogIds),
        );

        $followerSeries = $this->cumulativeSeries(
            Follow::query()->where('following_user_id', $user->id),
            startingCount: max(0, $totals['followers'] - Follow::query()
                ->where('following_user_id', $user->id)
                ->where('created_at', '>=', CarbonImmutable::now()->subDays(self::DAYS - 1)->startOfDay())
                ->count()),
        );

        $topBlogs = Blog::query()
            ->where('user_id', $user->id)
            ->whereNull('organization_id')
            ->withCount(['views', 'likes', 'bookmarks'])
            ->orderByDesc('views_count')
            ->limit(5)
            ->get(['id', 'title', 'slug'])
            ->map(fn (Blog $blog) => [
                'id' => $blog->id,
                'title' => $blog->title,
                'slug' => $blog->slug,
                'views' => (int) $blog->views_count,
                'likes' => (int) $blog->likes_count,
                'bookmarks' => (int) $blog->bookmarks_count,
            ]);

        $campaigns = Campaign::query()
            ->where('user_id', $user->id)
            ->whereNull('organization_id')
            ->where('status', CampaignStatus::Sent)
            ->orderByDesc('sent_at')
            ->limit(10)
            ->get(['id', 'subject', 'recipient_count', 'opened_count', 'sent_at'])
            ->map(fn (Campaign $campaign) => [
                'id' => $campaign->id,
                'subject' => $campaign->subject,
                'recipients' => (int) $campaign->recipient_count,
                'opens' => (int) $campaign->opened_count,
                'sent_at' => $campaign->sent_at?->toIso8601String(),
            ]);

        return Inertia::render('analytics/personal', [
            'totals' => $totals,
            'engagement' => $engagement,
            'followerSeries' => $followerSeries,
            'topBlogs' => $topBlogs,
            'campaigns' => $campaigns,
            'rangeDays' => self::DAYS,
        ]);
    }

    /**
     * Analytics for an organization (members only).
     */
    public function organization(Request $request, Organization $organization): Response
    {
        $user = $request->user();
        $isMember = $organization->users()->where('user_id', $user->id)->exists();

        abort_unless($isMember, 403);

        $blogIds = $organization->blogs()->pluck('id');

        $totals = [
            'blogs' => $blogIds->count(),
            'views' => BlogView::whereIn('blog_id', $blogIds)->count(),
            'likes' => Like::query()
                ->where('likeable_type', Blog::class)
                ->whereIn('likeable_id', $blogIds)
                ->count(),
            'bookmarks' => Bookmark::whereIn('blog_id', $blogIds)->count(),
            'comments' => Comment::whereIn('blog_id', $blogIds)->count(),
            'followers' => $organization->followers()->count(),
            'campaigns_sent' => Campaign::query()
                ->where('organization_id', $organization->id)
                ->where('status', CampaignStatus::Sent)
                ->count(),
            'campaign_opens' => (int) Campaign::query()
                ->where('organization_id', $organization->id)
                ->where('status', CampaignStatus::Sent)
                ->sum('opened_count'),
        ];

        $engagement = $this->engagementSeries(
            views: BlogView::whereIn('blog_id', $blogIds),
            likes: Like::query()
                ->where('likeable_type', Blog::class)
                ->whereIn('likeable_id', $blogIds),
            bookmarks: Bookmark::whereIn('blog_id', $blogIds),
        );

        $followerSeries = $this->cumulativeSeries(
            Follow::query()->where('following_organization_id', $organization->id),
            startingCount: max(0, $totals['followers'] - Follow::query()
                ->where('following_organization_id', $organization->id)
                ->where('created_at', '>=', CarbonImmutable::now()->subDays(self::DAYS - 1)->startOfDay())
                ->count()),
        );

        $topBlogs = $organization->blogs()
            ->withCount(['views', 'likes', 'bookmarks'])
            ->orderByDesc('views_count')
            ->limit(5)
            ->get(['id', 'title', 'slug'])
            ->map(fn (Blog $blog) => [
                'id' => $blog->id,
                'title' => $blog->title,
                'slug' => $blog->slug,
                'views' => (int) $blog->views_count,
                'likes' => (int) $blog->likes_count,
                'bookmarks' => (int) $blog->bookmarks_count,
            ]);

        $campaigns = Campaign::query()
            ->where('organization_id', $organization->id)
            ->where('status', CampaignStatus::Sent)
            ->orderByDesc('sent_at')
            ->limit(10)
            ->get(['id', 'subject', 'recipient_count', 'opened_count', 'sent_at'])
            ->map(fn (Campaign $campaign) => [
                'id' => $campaign->id,
                'subject' => $campaign->subject,
                'recipients' => (int) $campaign->recipient_count,
                'opens' => (int) $campaign->opened_count,
                'sent_at' => $campaign->sent_at?->toIso8601String(),
            ]);

        return Inertia::render('analytics/organization', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'slug' => $organization->slug,
                'logo_url' => $organization->logo_url,
            ],
            'totals' => $totals,
            'engagement' => $engagement,
            'followerSeries' => $followerSeries,
            'topBlogs' => $topBlogs,
            'campaigns' => $campaigns,
            'rangeDays' => self::DAYS,
        ]);
    }

    /**
     * Build a per-day series with views/likes/bookmarks counts for the last 30 days.
     *
     * @return array<int, array{date: string, views: int, likes: int, bookmarks: int}>
     */
    private function engagementSeries(Builder $views, Builder $likes, Builder $bookmarks): array
    {
        $start = CarbonImmutable::now()->subDays(self::DAYS - 1)->startOfDay();

        $viewDates = (clone $views)->where('created_at', '>=', $start)->pluck('created_at');
        $likeDates = (clone $likes)->where('created_at', '>=', $start)->pluck('created_at');
        $bookmarkDates = (clone $bookmarks)->where('created_at', '>=', $start)->pluck('created_at');

        $countByDay = function ($dates): array {
            $buckets = [];
            foreach ($dates as $date) {
                $key = CarbonImmutable::parse($date)->toDateString();
                $buckets[$key] = ($buckets[$key] ?? 0) + 1;
            }

            return $buckets;
        };

        $viewBuckets = $countByDay($viewDates);
        $likeBuckets = $countByDay($likeDates);
        $bookmarkBuckets = $countByDay($bookmarkDates);

        $series = [];
        for ($i = 0; $i < self::DAYS; $i++) {
            $day = $start->addDays($i)->toDateString();
            $series[] = [
                'date' => $day,
                'views' => (int) ($viewBuckets[$day] ?? 0),
                'likes' => (int) ($likeBuckets[$day] ?? 0),
                'bookmarks' => (int) ($bookmarkBuckets[$day] ?? 0),
            ];
        }

        return $series;
    }

    /**
     * Build a cumulative follower-count series for the last 30 days.
     *
     * @return array<int, array{date: string, followers: int}>
     */
    private function cumulativeSeries(Builder $followsQuery, int $startingCount): array
    {
        $start = CarbonImmutable::now()->subDays(self::DAYS - 1)->startOfDay();

        $dates = (clone $followsQuery)
            ->where('created_at', '>=', $start)
            ->pluck('created_at');

        $perDay = [];
        foreach ($dates as $date) {
            $key = CarbonImmutable::parse($date)->toDateString();
            $perDay[$key] = ($perDay[$key] ?? 0) + 1;
        }

        $running = $startingCount;
        $series = [];
        for ($i = 0; $i < self::DAYS; $i++) {
            $day = $start->addDays($i)->toDateString();
            $running += $perDay[$day] ?? 0;
            $series[] = [
                'date' => $day,
                'followers' => $running,
            ];
        }

        return $series;
    }
}
