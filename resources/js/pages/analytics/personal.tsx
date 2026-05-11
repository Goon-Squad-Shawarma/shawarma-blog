import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { AnalyticsView, type AnalyticsTotals, type CampaignRow, type EngagementPoint, type FollowerPoint, type TopBlog } from '@/components/analytics-view';

interface PersonalAnalyticsProps {
    totals: AnalyticsTotals;
    engagement: EngagementPoint[];
    followerSeries: FollowerPoint[];
    topBlogs: TopBlog[];
    campaigns: CampaignRow[];
    rangeDays: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Analytics', href: '/my/analytics' },
];

export default function PersonalAnalytics(props: PersonalAnalyticsProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Your analytics" />

            <div className="p-4 space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Your analytics</h1>
                    <p className="text-sm text-muted-foreground">
                        How your personal posts are performing across views, likes, bookmarks and campaigns.
                    </p>
                </div>
                <AnalyticsView {...props} />
            </div>
        </AppLayout>
    );
}
