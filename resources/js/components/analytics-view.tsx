import { Link } from '@inertiajs/react';
import { useMemo } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { show as blogsShow } from '@/routes/blogs';
import { show as campaignsShow } from '@/routes/campaigns';
import { BarChart3, BookOpen, Bookmark, Eye, Heart, Mail, MessageSquare, ThumbsUp, Users } from 'lucide-react';

export interface AnalyticsTotals {
    blogs: number;
    views: number;
    likes: number;
    bookmarks: number;
    comments: number;
    followers: number;
    campaigns_sent: number;
    campaign_opens: number;
}

export interface EngagementPoint {
    date: string;
    views: number;
    likes: number;
    bookmarks: number;
}

export interface FollowerPoint {
    date: string;
    followers: number;
}

export interface TopBlog {
    id: number;
    title: string;
    slug: string;
    views: number;
    likes: number;
    bookmarks: number;
}

export interface CampaignRow {
    id: number;
    subject: string;
    recipients: number;
    opens: number;
    sent_at: string | null;
}

interface AnalyticsViewProps {
    totals: AnalyticsTotals;
    engagement: EngagementPoint[];
    followerSeries: FollowerPoint[];
    topBlogs: TopBlog[];
    campaigns: CampaignRow[];
    rangeDays: number;
}

const engagementConfig = {
    views: { label: 'Views', color: 'var(--chart-1)' },
    likes: { label: 'Likes', color: 'var(--chart-2)' },
    bookmarks: { label: 'Bookmarks', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const followerConfig = {
    followers: { label: 'Followers', color: 'var(--chart-4)' },
} satisfies ChartConfig;

const topBlogsConfig = {
    views: { label: 'Views', color: 'var(--chart-1)' },
    likes: { label: 'Likes', color: 'var(--chart-2)' },
    bookmarks: { label: 'Bookmarks', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const campaignsConfig = {
    recipients: { label: 'Recipients', color: 'var(--chart-5)' },
    opens: { label: 'Opens', color: 'var(--chart-2)' },
} satisfies ChartConfig;

function formatDay(iso: string): string {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatNumber(n: number): string {
    return n.toLocaleString();
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wide">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                </CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">{formatNumber(value)}</CardTitle>
            </CardHeader>
        </Card>
    );
}

export function AnalyticsView({ totals, engagement, followerSeries, topBlogs, campaigns, rangeDays }: AnalyticsViewProps) {
    const totalEngagement = useMemo(() => {
        return engagement.reduce(
            (acc, p) => ({
                views: acc.views + p.views,
                likes: acc.likes + p.likes,
                bookmarks: acc.bookmarks + p.bookmarks,
            }),
            { views: 0, likes: 0, bookmarks: 0 },
        );
    }, [engagement]);

    const hasEngagement = totalEngagement.views + totalEngagement.likes + totalEngagement.bookmarks > 0;
    const followerStart = followerSeries[0]?.followers ?? 0;
    const followerEnd = followerSeries[followerSeries.length - 1]?.followers ?? 0;
    const followerDelta = followerEnd - followerStart;

    return (
        <div className="space-y-6">
            {/* Top stat cards */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard label="Total views" value={totals.views} icon={Eye} />
                <StatCard label="Likes" value={totals.likes} icon={Heart} />
                <StatCard label="Bookmarks" value={totals.bookmarks} icon={Bookmark} />
                <StatCard label="Comments" value={totals.comments} icon={MessageSquare} />
                <StatCard label="Posts" value={totals.blogs} icon={BookOpen} />
                <StatCard label="Followers" value={totals.followers} icon={Users} />
                <StatCard label="Campaigns sent" value={totals.campaigns_sent} icon={Mail} />
                <StatCard label="Email opens" value={totals.campaign_opens} icon={Eye} />
                <StatCard
                    label={`Last ${rangeDays}d views`}
                    value={totalEngagement.views}
                    icon={BarChart3}
                />
            </div>

            {/* Engagement area chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Engagement over time</CardTitle>
                    <CardDescription>
                        Views, likes and bookmarks across the last {rangeDays} days
                        {hasEngagement && (
                            <>
                                {' · '}
                                <span className="font-medium text-foreground">{formatNumber(totalEngagement.views)}</span> views,{' '}
                                <span className="font-medium text-foreground">{formatNumber(totalEngagement.likes)}</span> likes,{' '}
                                <span className="font-medium text-foreground">{formatNumber(totalEngagement.bookmarks)}</span> bookmarks
                            </>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {hasEngagement ? (
                        <ChartContainer config={engagementConfig} className="aspect-auto h-72 w-full">
                            <AreaChart data={engagement} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                                <defs>
                                    <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-views)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--color-views)" stopOpacity={0.05} />
                                    </linearGradient>
                                    <linearGradient id="fillLikes" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-likes)" stopOpacity={0.7} />
                                        <stop offset="95%" stopColor="var(--color-likes)" stopOpacity={0.05} />
                                    </linearGradient>
                                    <linearGradient id="fillBookmarks" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-bookmarks)" stopOpacity={0.7} />
                                        <stop offset="95%" stopColor="var(--color-bookmarks)" stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={formatDay} minTickGap={24} />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} width={32} />
                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            indicator="dot"
                                            labelFormatter={(value) => formatDay(String(value))}
                                        />
                                    }
                                />
                                <Area type="monotone" dataKey="bookmarks" stackId="1" stroke="var(--color-bookmarks)" fill="url(#fillBookmarks)" />
                                <Area type="monotone" dataKey="likes" stackId="1" stroke="var(--color-likes)" fill="url(#fillLikes)" />
                                <Area type="monotone" dataKey="views" stackId="1" stroke="var(--color-views)" fill="url(#fillViews)" />
                                <ChartLegend content={<ChartLegendContent />} />
                            </AreaChart>
                        </ChartContainer>
                    ) : (
                        <Empty className="border-dashed">
                            <EmptyHeader>
                                <EmptyTitle>No engagement yet</EmptyTitle>
                                <EmptyDescription>Once readers start interacting with your posts, you'll see activity here.</EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Follower growth */}
                <Card>
                    <CardHeader>
                        <CardTitle>Follower growth</CardTitle>
                        <CardDescription>
                            {followerDelta === 0
                                ? `${formatNumber(followerEnd)} followers · no change in ${rangeDays}d`
                                : `${formatNumber(followerEnd)} followers · ${followerDelta > 0 ? '+' : ''}${formatNumber(followerDelta)} in ${rangeDays}d`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={followerConfig} className="aspect-auto h-56 w-full">
                            <LineChart data={followerSeries} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={formatDay} minTickGap={24} />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} width={32} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent labelFormatter={(value) => formatDay(String(value))} indicator="line" />} />
                                <Line type="monotone" dataKey="followers" stroke="var(--color-followers)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                            </LineChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Top blogs */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top posts by views</CardTitle>
                        <CardDescription>Your five most-viewed posts of all time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {topBlogs.length === 0 ? (
                            <Empty className="border-dashed">
                                <EmptyHeader>
                                    <EmptyTitle>Nothing to show</EmptyTitle>
                                    <EmptyDescription>Publish a post to start collecting views.</EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        ) : (
                            <>
                                <ChartContainer config={topBlogsConfig} className="aspect-auto h-56 w-full">
                                    <BarChart data={topBlogs} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                                        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                                        <YAxis
                                            type="category"
                                            dataKey="title"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={6}
                                            width={120}
                                            tickFormatter={(value: string) => (value.length > 18 ? `${value.slice(0, 17)}…` : value)}
                                        />
                                        <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                                        <Bar dataKey="views" fill="var(--color-views)" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ChartContainer>
                                <ul className="mt-4 space-y-2 text-sm">
                                    {topBlogs.map((blog) => (
                                        <li key={blog.id} className="flex items-center justify-between gap-3">
                                            <Link href={blogsShow({ blog: blog.slug }).url} className="line-clamp-1 hover:underline">
                                                {blog.title}
                                            </Link>
                                            <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground tabular-nums">
                                                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatNumber(blog.views)}</span>
                                                <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{formatNumber(blog.likes)}</span>
                                                <span className="flex items-center gap-1"><Bookmark className="h-3 w-3" />{formatNumber(blog.bookmarks)}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Campaign reach */}
            <Card>
                <CardHeader>
                    <CardTitle>Campaign reach & opens</CardTitle>
                    <CardDescription>
                        Recipients delivered and opens recorded for your most recent sent campaigns
                        {totals.campaigns_sent > 0 && (
                            <>
                                {' · overall '}
                                <span className="font-medium text-foreground">
                                    {totals.campaign_opens > 0 && totals.campaigns_sent > 0
                                        ? `${formatNumber(totals.campaign_opens)} opens`
                                        : 'no opens yet'}
                                </span>
                            </>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {campaigns.length === 0 ? (
                        <Empty className="border-dashed">
                            <EmptyHeader>
                                <EmptyTitle>No campaigns sent yet</EmptyTitle>
                                <EmptyDescription>Send a campaign to your followers and reach will appear here.</EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        <>
                            <ChartContainer config={campaignsConfig} className="aspect-auto h-56 w-full">
                                <BarChart data={[...campaigns].reverse()} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="subject"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={(value: string) => (value.length > 14 ? `${value.slice(0, 13)}…` : value)}
                                    />
                                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={36} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Bar dataKey="recipients" fill="var(--color-recipients)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="opens" fill="var(--color-opens)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ChartContainer>
                            <ul className="mt-4 space-y-2 text-sm">
                                {campaigns.map((campaign) => {
                                    const rate = campaign.recipients > 0
                                        ? Math.round((campaign.opens / campaign.recipients) * 100)
                                        : 0;
                                    return (
                                        <li key={campaign.id} className="flex items-center justify-between gap-3">
                                            <Link href={campaignsShow(campaign.id).url} className="line-clamp-1 hover:underline">
                                                {campaign.subject}
                                            </Link>
                                            <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground tabular-nums">
                                                <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{formatNumber(campaign.recipients)}</span>
                                                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatNumber(campaign.opens)}</span>
                                                {campaign.recipients > 0 && (
                                                    <Badge variant="secondary" className="font-mono">{rate}%</Badge>
                                                )}
                                                {campaign.sent_at && (
                                                    <span>{new Date(campaign.sent_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
