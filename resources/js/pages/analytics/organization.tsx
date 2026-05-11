import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { AnalyticsView, type AnalyticsTotals, type CampaignRow, type EngagementPoint, type FollowerPoint, type TopBlog } from '@/components/analytics-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { index as organizationsIndex, show as organizationsShow } from '@/routes/organizations';

interface OrganizationAnalyticsProps {
    organization: {
        id: number;
        name: string;
        slug: string;
        logo_url: string | null;
    };
    totals: AnalyticsTotals;
    engagement: EngagementPoint[];
    followerSeries: FollowerPoint[];
    topBlogs: TopBlog[];
    campaigns: CampaignRow[];
    rangeDays: number;
}

export default function OrganizationAnalytics({ organization, ...rest }: OrganizationAnalyticsProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Organizations', href: organizationsIndex().url },
        { title: organization.name, href: organizationsShow(organization.id).url },
        { title: 'Analytics', href: `/organizations/${organization.id}/analytics` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${organization.name} · Analytics`} />

            <div className="p-4 space-y-6">
                <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                        {organization.logo_url ? <AvatarImage src={organization.logo_url} alt={organization.name} /> : null}
                        <AvatarFallback>{organization.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">{organization.name} analytics</h1>
                        <p className="text-sm text-muted-foreground">
                            Aggregate performance across every post published under this organization.
                        </p>
                    </div>
                </div>
                <AnalyticsView {...rest} />
            </div>
        </AppLayout>
    );
}
