import AppLayout from '@/layouts/app-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ReactionBar } from '@/components/forums/reaction-bar';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { index as forumsIndex, vote as forumsVote } from '@/routes/forums';
import { show as usersShow } from '@/routes/users';
import type { BreadcrumbItem } from '@/types';
import { ChevronUp, ImagePlus, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface UserStub {
    id: number;
    first_name: string;
    last_name: string;
    avatar_url?: string | null;
}

interface Reaction {
    id: number;
    user_id: number;
    emoji: string;
    reactable_id: number;
    reactable_type: string;
}

interface Reply {
    id: number;
    body: string;
    image_url: string | null;
    created_at: string;
    user: UserStub;
    reactions: Reaction[];
}

interface Thread {
    id: number;
    title: string;
    slug: string;
    body: string;
    category: string;
    status: string | null;
    image_url: string | null;
    upvotes_count: number;
    created_at: string;
    user: UserStub;
    replies: Reply[];
    reactions: Reaction[];
}

interface ForumShowProps {
    thread: Thread;
    voted: boolean;
    currentUserId: number | null;
    canReply: boolean;
    canDelete: boolean;
}

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
    awaiting_response: { label: 'Awaiting Response', tone: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
    under_review: { label: 'Under Review', tone: 'bg-blue-500/15 text-blue-500 border-blue-500/30' },
    solved: { label: 'Solved', tone: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
    open: { label: 'Open', tone: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
};

function getCsrf(): string {
    const m = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : '';
}

function timeAgo(iso: string): string {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(iso).toLocaleDateString();
}

export default function ForumShow({ thread, voted: initialVoted, currentUserId, canReply, canDelete }: ForumShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Community', href: '/forums' },
        { title: thread.title, href: `/forums/${thread.slug}` },
    ];

    const [voted, setVoted] = useState(initialVoted);
    const [count, setCount] = useState(thread.upvotes_count);
    const [busy, setBusy] = useState(false);

    const fileRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const form = useForm<{ body: string; image: File | null }>({ body: '', image: null });

    const submitReply = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/forums/${thread.slug}/replies`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setImagePreview(null);
            },
        });
    };

    const handleDelete = () => {
        if (!confirm('Delete this thread?')) return;
        router.delete(`/forums/${thread.slug}`);
    };

    const toggleVote = async () => {
        if (!currentUserId) {
            router.visit('/login');
            return;
        }
        if (busy) return;
        setBusy(true);
        const next = !voted;
        setVoted(next);
        setCount((c) => c + (next ? 1 : -1));
        try {
            const res = await fetch(forumsVote({ thread: thread.slug }).url, {
                method: 'POST',
                headers: { 'X-XSRF-TOKEN': getCsrf(), Accept: 'application/json' },
                credentials: 'include',
            });
            if (!res.ok) throw new Error();
            const json = await res.json();
            setVoted(json.voted);
            setCount(json.upvotes_count);
        } catch {
            setVoted(!next);
            setCount((c) => c + (next ? -1 : 1));
        } finally {
            setBusy(false);
        }
    };

    const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        form.setData('image', file);
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }
    };

    const status = thread.status ? STATUS_LABEL[thread.status] : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={thread.title} />
            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <Link href={forumsIndex().url} className="inline-flex items-center text-sm text-muted-foreground hover:underline">
                    ← Back to discussions
                </Link>

                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <h1 className="text-2xl font-bold">{thread.title}</h1>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                    <Avatar className="size-7">
                                        <AvatarImage src={thread.user.avatar_url ?? undefined} />
                                        <AvatarFallback>{thread.user.first_name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <Link href={usersShow({ user: thread.user.id }).url} className="font-medium hover:underline">
                                        {thread.user.first_name} {thread.user.last_name}
                                    </Link>
                                    <span>•</span>
                                    <span>{timeAgo(thread.created_at)}</span>
                                    <Badge variant="secondary" className="capitalize">
                                        {thread.category}
                                    </Badge>
                                    {status && (
                                        <Badge variant="outline" className={status.tone}>
                                            {status.label}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={toggleVote}
                                disabled={busy}
                                className={`flex w-14 shrink-0 flex-col items-center justify-center rounded-md border py-2 transition-colors ${
                                    voted ? 'border-primary/60 bg-primary/10 text-primary' : 'hover:bg-muted'
                                }`}
                            >
                                <ChevronUp className="size-5" />
                                <span className="text-sm font-semibold">{count}</span>
                            </button>
                            {canDelete && (
                                <Button variant="ghost" size="icon" onClick={handleDelete} aria-label="Delete thread">
                                    <Trash2 className="size-4" />
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{thread.body}</p>
                        {thread.image_url && (
                            <img
                                src={thread.image_url}
                                alt=""
                                className="max-h-[480px] w-full rounded-md border object-cover"
                            />
                        )}
                        <ReactionBar
                            type="thread"
                            id={thread.id}
                            reactions={thread.reactions ?? []}
                            currentUserId={currentUserId}
                        />
                    </CardContent>
                </Card>

                <div>
                    <h2 className="mb-3 text-lg font-semibold">{thread.replies.length} Replies</h2>

                    {thread.replies.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No replies yet. Be the first to chime in.</p>
                    ) : (
                        <div className="space-y-3">
                            {thread.replies.map((reply) => (
                                <Card key={reply.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="size-8">
                                                <AvatarImage src={reply.user.avatar_url ?? undefined} />
                                                <AvatarFallback>{reply.user.first_name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1 text-sm">
                                                <Link
                                                    href={usersShow({ user: reply.user.id }).url}
                                                    className="font-medium hover:underline"
                                                >
                                                    {reply.user.first_name} {reply.user.last_name}
                                                </Link>
                                                <span className="text-muted-foreground"> • {timeAgo(reply.created_at)}</span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="whitespace-pre-wrap text-sm">{reply.body}</p>
                                        {reply.image_url && (
                                            <img
                                                src={reply.image_url}
                                                alt=""
                                                className="max-h-96 rounded-md border object-cover"
                                            />
                                        )}
                                        <ReactionBar
                                            type="reply"
                                            id={reply.id}
                                            reactions={reply.reactions ?? []}
                                            currentUserId={currentUserId}
                                        />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {canReply ? (
                    <Card>
                        <CardHeader className="pb-2">
                            <h3 className="text-base font-semibold">Add a reply</h3>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submitReply} className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="reply-body" className="sr-only">
                                        Reply
                                    </Label>
                                    <Textarea
                                        id="reply-body"
                                        value={form.data.body}
                                        onChange={(e) => form.setData('body', e.target.value)}
                                        rows={4}
                                        placeholder="Write your reply…"
                                        required
                                    />
                                    {form.errors.body && <p className="text-sm text-destructive">{form.errors.body}</p>}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={fileRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={onPickImage}
                                            className="hidden"
                                        />
                                        {imagePreview ? (
                                            <div className="relative">
                                                <img src={imagePreview} alt="" className="max-h-24 rounded-md border" />
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="icon"
                                                    className="absolute right-1 top-1 size-6"
                                                    onClick={() => {
                                                        form.setData('image', null);
                                                        setImagePreview(null);
                                                        if (fileRef.current) fileRef.current.value = '';
                                                    }}
                                                >
                                                    <X className="size-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => fileRef.current?.click()}
                                            >
                                                <ImagePlus className="mr-1 size-4" /> Attach image
                                            </Button>
                                        )}
                                    </div>
                                    <Button type="submit" disabled={form.processing}>
                                        {form.processing ? 'Posting…' : 'Post reply'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="py-6 text-center text-sm text-muted-foreground">
                            <Link href="/login" className="underline">
                                Sign in
                            </Link>{' '}
                            to join the discussion.
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
