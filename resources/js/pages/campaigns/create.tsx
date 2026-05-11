import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { index as campaignsIndex, store as campaignsStore } from '@/routes/campaigns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Send } from 'lucide-react';

interface Organization {
    id: number;
    name: string;
}

interface CampaignsCreateProps {
    organizations: Organization[];
    followerCount: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Campaigns', href: campaignsIndex().url },
    { title: 'New Campaign', href: '#' },
];

export default function CampaignsCreate({ organizations, followerCount }: CampaignsCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        subject: '',
        body: '',
        organization_id: '' as string,
        send_now: false as boolean,
    });

    const handleSaveDraft = (e: FormEvent) => {
        e.preventDefault();
        setData('send_now', false);
        post(campaignsStore().url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Campaign" />
            <div className="p-4 max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">New Campaign</h1>
                    <p className="text-sm text-muted-foreground">
                        Audience: <span className="font-medium">{followerCount} followers</span>
                    </p>
                </div>

                <form onSubmit={handleSaveDraft} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Campaign Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {organizations.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Send as (optional)</Label>
                                    <Select
                                        value={data.organization_id}
                                        onValueChange={(v) => setData('organization_id', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Send as yourself" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Yourself</SelectItem>
                                            {organizations.map((org) => (
                                                <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.organization_id && <p className="text-sm text-destructive">{errors.organization_id}</p>}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject *</Label>
                                <Input
                                    id="subject"
                                    value={data.subject}
                                    onChange={(e) => setData('subject', e.target.value)}
                                    placeholder="Your email subject..."
                                    maxLength={255}
                                />
                                {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="body">Body *</Label>
                                <Textarea
                                    id="body"
                                    value={data.body}
                                    onChange={(e) => setData('body', e.target.value)}
                                    placeholder="Write your campaign content here... (HTML is supported)"
                                    rows={14}
                                    className="font-mono text-sm resize-y"
                                />
                                {errors.body && <p className="text-sm text-destructive">{errors.body}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center gap-3 justify-end">
                        <Link href={campaignsIndex().url}>
                            <Button type="button" variant="ghost">Cancel</Button>
                        </Link>
                        <Button type="submit" variant="outline" disabled={processing}>
                            Save Draft
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    disabled={processing || !data.subject || !data.body}
                                >
                                    <Send className="h-4 w-4 mr-2" />Send Now
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Send campaign now?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will immediately send the campaign to {followerCount} followers. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => {
                                            setData('send_now', true);
                                            post(campaignsStore().url);
                                        }}
                                    >
                                        Send Now
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
