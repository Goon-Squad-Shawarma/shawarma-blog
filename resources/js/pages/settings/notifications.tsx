import { Head, useForm } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';
import { edit as editNotifications, update as updateNotifications } from '@/routes/notifications';

interface Preferences {
    campaigns: boolean;
    daily_digest: boolean;
    digest_frequency: 'daily' | 'weekly' | 'off';
}

interface NotificationsProps {
    preferences: Preferences;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Notification settings', href: editNotifications().url },
];

export default function Notifications({ preferences }: NotificationsProps) {
    const { data, setData, patch, processing, recentlySuccessful } = useForm<Preferences>({
        campaigns: preferences.campaigns,
        daily_digest: preferences.daily_digest,
        digest_frequency: preferences.digest_frequency,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(updateNotifications().url, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notification settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Email notifications"
                        description="Choose which emails you want to receive from authors you follow."
                    />

                    <form onSubmit={submit} className="space-y-6">
                        <div className="flex items-start justify-between gap-4 rounded-md border p-4">
                            <div className="space-y-1">
                                <Label htmlFor="campaigns" className="text-sm font-medium">
                                    Newsletter campaigns
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Receive campaigns sent by authors and organizations you follow.
                                </p>
                            </div>
                            <Switch
                                id="campaigns"
                                checked={data.campaigns}
                                onCheckedChange={(v) => setData('campaigns', v)}
                            />
                        </div>

                        <div className="space-y-3 rounded-md border p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="daily_digest" className="text-sm font-medium">
                                        New post digest
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        A summary of new posts from authors you follow.
                                    </p>
                                </div>
                                <Switch
                                    id="daily_digest"
                                    checked={data.daily_digest}
                                    onCheckedChange={(v) => setData('daily_digest', v)}
                                />
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <Label htmlFor="digest_frequency" className="text-sm">
                                    Frequency
                                </Label>
                                <Select
                                    value={data.digest_frequency}
                                    onValueChange={(v) => setData('digest_frequency', v as Preferences['digest_frequency'])}
                                    disabled={!data.daily_digest}
                                >
                                    <SelectTrigger id="digest_frequency" className="w-[160px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly (Mondays)</SelectItem>
                                        <SelectItem value="off">Off</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button type="submit" disabled={processing}>
                                Save preferences
                            </Button>
                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-muted-foreground">Saved.</p>
                            </Transition>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
