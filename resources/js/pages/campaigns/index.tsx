import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { index as campaignsIndex, show as campaignsShow, create as campaignsCreate, destroy as campaignsDestroy, send as campaignsSend } from '@/routes/campaigns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Separator } from '@/components/ui/separator';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Mail, Plus, Send, Trash2 } from 'lucide-react';

interface Campaign {
    id: number;
    subject: string;
    status: 'draft' | 'sending' | 'sent' | 'failed';
    recipient_count: number;
    sent_at: string | null;
    created_at: string;
}

interface PaginatedCampaigns {
    data: Campaign[];
    current_page: number;
    last_page: number;
}

interface CampaignsIndexProps {
    campaigns: PaginatedCampaigns;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Campaigns', href: campaignsIndex().url },
];

const statusVariants: Record<Campaign['status'], 'secondary' | 'default' | 'destructive' | 'outline'> = {
    draft: 'secondary',
    sending: 'outline',
    sent: 'default',
    failed: 'destructive',
};

function getCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export default function CampaignsIndex({ campaigns }: CampaignsIndexProps) {
    const handleSend = (id: number) => {
        const route = campaignsSend({ campaign: id });
        fetch(route.url, {
            method: route.method.toUpperCase(),
            headers: { 'X-XSRF-TOKEN': getCsrfToken(), Accept: 'application/json' },
            credentials: 'include',
        }).then(() => router.reload());
    };

    const handleDelete = (id: number) => {
        router.delete(campaignsDestroy({ campaign: id }).url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Campaigns" />
            <div className="p-4 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Campaigns</h1>
                    <Button asChild>
                        <Link href={campaignsCreate().url}><Plus className="h-4 w-4 mr-2" />New Campaign</Link>
                    </Button>
                </div>

                {campaigns.data.length === 0 ? (
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon"><Mail /></EmptyMedia>
                            <EmptyTitle>No campaigns yet</EmptyTitle>
                            <EmptyDescription>Create your first campaign to reach your followers.</EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <Button asChild><Link href={campaignsCreate().url}>Create Campaign</Link></Button>
                        </EmptyContent>
                    </Empty>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">All Campaigns</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {campaigns.data.map((campaign, i) => (
                                <div key={campaign.id}>
                                    {i > 0 && <Separator />}
                                    <div className="flex items-center justify-between px-6 py-4">
                                        <div className="space-y-1 flex-1 min-w-0">
                                            <Link href={campaignsShow({ campaign: campaign.id }).url} className="font-medium hover:underline line-clamp-1">
                                                {campaign.subject}
                                            </Link>
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                <Badge variant={statusVariants[campaign.status]}>{campaign.status}</Badge>
                                                {campaign.status === 'sent' && (
                                                    <span>{campaign.recipient_count} recipients · {campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString() : ''}</span>
                                                )}
                                                {campaign.status === 'draft' && (
                                                    <span>Created {new Date(campaign.created_at).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            {campaign.status === 'draft' && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="outline" size="sm">
                                                            <Send className="h-4 w-4 mr-1" />Send
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Send this campaign?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will send the campaign to all your followers. This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleSend(campaign.id)}>Send Now</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                            {campaign.status === 'draft' && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
                                                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction variant="destructive" onClick={() => handleDelete(campaign.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
