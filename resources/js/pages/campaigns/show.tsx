import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { index as campaignsIndex, show as campaignsShow } from '@/routes/campaigns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, Calendar } from 'lucide-react';

interface Campaign {
    id: number;
    subject: string;
    body: string;
    status: 'draft' | 'sending' | 'sent' | 'failed';
    recipient_count: number;
    sent_at: string | null;
    created_at: string;
    user?: { first_name: string; last_name: string } | null;
    organization?: { name: string } | null;
}

interface CampaignsShowProps {
    campaign: Campaign;
}

const statusVariants: Record<Campaign['status'], 'secondary' | 'default' | 'destructive' | 'outline'> = {
    draft: 'secondary',
    sending: 'outline',
    sent: 'default',
    failed: 'destructive',
};

export default function CampaignsShow({ campaign }: CampaignsShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Campaigns', href: campaignsIndex().url },
        { title: campaign.subject, href: campaignsShow({ campaign: campaign.id }).url },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={campaign.subject} />
            <div className="p-4 max-w-3xl mx-auto space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold">{campaign.subject}</h1>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Badge variant={statusVariants[campaign.status]}>{campaign.status}</Badge>
                            {campaign.user && <span>By {campaign.user.first_name} {campaign.user.last_name}</span>}
                            {campaign.organization && <span>By {campaign.organization.name}</span>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Badge variant={statusVariants[campaign.status]}>{campaign.status}</Badge>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Users className="h-3 w-3" />Recipients</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{campaign.recipient_count}</p>
                        </CardContent>
                    </Card>
                    {campaign.sent_at && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Calendar className="h-3 w-3" />Sent</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm">{new Date(campaign.sent_at).toLocaleDateString()}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Separator />

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Email Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            className="prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: campaign.body }}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Link href={campaignsIndex().url} className="text-sm text-muted-foreground hover:underline">
                        ← Back to campaigns
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
