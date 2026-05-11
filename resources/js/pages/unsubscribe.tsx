import { Head, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface UnsubscribeProps {
    email: string;
    type: string;
    token: string;
}

interface FlashProps {
    flash?: { success?: string };
}

const LABEL: Record<string, string> = {
    campaigns: 'campaign emails',
    daily_digest: 'post digests',
    all: 'all marketing emails',
};

export default function Unsubscribe({ email, type, token }: UnsubscribeProps) {
    const { flash } = usePage<FlashProps>().props;
    const form = useForm({ type });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/unsubscribe/${token}`);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Head title="Unsubscribe" />
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Unsubscribe</CardTitle>
                    <CardDescription>
                        {flash?.success
                            ? flash.success
                            : `Stop receiving ${LABEL[type] ?? 'these emails'} sent to ${email}?`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!flash?.success ? (
                        <form onSubmit={submit} className="space-y-3">
                            <Button type="submit" disabled={form.processing} className="w-full">
                                {form.processing ? 'Unsubscribing…' : 'Confirm unsubscribe'}
                            </Button>
                            <p className="text-center text-xs text-muted-foreground">
                                You can re-enable emails any time from your account settings.
                            </p>
                        </form>
                    ) : (
                        <Button asChild className="w-full">
                            <a href="/settings/notifications">Manage preferences</a>
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
