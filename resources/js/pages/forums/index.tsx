import AppLayout from '@/layouts/app-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { show as forumsShow, store as forumsStore, vote as forumsVote } from '@/routes/forums';
import type { BreadcrumbItem, SharedData } from '@/types';
import { ChevronUp, ImagePlus, MessageSquare, Plus, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

interface ThreadItem {
    id: number;
    title: string;
    slug: string;
    body: string;
    category: string;
    status: string | null;
    image_url: string | null;
    upvotes_count: number;
    voted?: boolean;
    created_at: string;
    replies_count: number;
    user: { id: number; first_name: string; last_name: string; avatar_url?: string | null };
}

interface PaginatedThreads {
    data: ThreadItem[];
    current_page: number;
    last_page: number;
}

interface ForumIndexProps {
    threads: PaginatedThreads;
    filters: { category: string; sort: string };
    categories: string[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Community', href: '/forums' }];

const CATEGORY_LABEL: Record<string, string> = {
    everything: 'Everything',
    questions: 'Questions',
    feedback: 'Feedback',
    bounties: 'Bounties',
    community: 'Community',
};

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
    awaiting_response: { label: 'Awaiting Response', tone: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
    under_review: { label: 'Under Review', tone: 'bg-blue-500/15 text-blue-500 border-blue-500/30' },
    solved: { label: 'Solved', tone: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
    open: { label: 'Open', tone: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
};

function timeAgo(iso: string): string {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(iso).toLocaleDateString();
}

function getCsrf(): string {
    const m = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : '';
}

function VoteButton({ thread }: { thread: ThreadItem }) {
    const { auth } = usePage<SharedData>().props;
    const [voted, setVoted] = useState(!!thread.voted);
    const [count, setCount] = useState(thread.upvotes_count);
    const [busy, setBusy] = useState(false);

    const toggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!auth?.user) {
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

    return (
        <button
            type="button"
            onClick={toggle}
            disabled={busy}
            className={`flex w-12 shrink-0 flex-col items-center justify-center rounded-md border py-2 transition-colors ${
                voted ? 'border-primary/60 bg-primary/10 text-primary' : 'hover:bg-muted'
            }`}
            aria-label="Upvote"
        >
            <ChevronUp className="size-4" />
            <span className="text-xs font-semibold">{count}</span>
        </button>
    );
}

export default function ForumsIndex({ threads, filters, categories }: ForumIndexProps) {
    const { auth } = usePage<SharedData>().props;
    const [open, setOpen] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const form = useForm<{ title: string; body: string; category: string; image: File | null }>({
        title: '',
        body: '',
        category: filters.category === 'everything' ? 'community' : filters.category,
        image: null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(forumsStore().url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setImagePreview(null);
                setOpen(false);
            },
        });
    };

    const setCategory = (c: string) => {
        router.get('/forums', { ...filters, category: c }, { preserveScroll: true, preserveState: true });
    };

    const setSort = (s: string) => {
        router.get('/forums', { ...filters, sort: s }, { preserveScroll: true, preserveState: true });
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

    const sortLabel = useMemo(
        () => (filters.sort === 'top' ? 'Top voted' : filters.sort === 'replies' ? 'Most replies' : 'Recent Activity'),
        [filters.sort],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Community" />
            <div className="p-4 space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">All Discussions</h1>
                        <p className="text-sm text-muted-foreground">Ask questions, share feedback, post bounties.</p>
                    </div>

                    {auth?.user && (
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 size-4" /> New thread
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <form onSubmit={handleSubmit}>
                                    <DialogHeader>
                                        <DialogTitle>Start a new thread</DialogTitle>
                                        <DialogDescription>Be clear and respectful. Threads are public.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="title">Title</Label>
                                            <Input
                                                id="title"
                                                value={form.data.title}
                                                onChange={(e) => form.setData('title', e.target.value)}
                                                placeholder="What's on your mind?"
                                                required
                                            />
                                            {form.errors.title && <p className="text-sm text-destructive">{form.errors.title}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="category">Category</Label>
                                            <Select value={form.data.category} onValueChange={(v) => form.setData('category', v)}>
                                                <SelectTrigger id="category">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories
                                                        .filter((c) => c !== 'everything')
                                                        .map((c) => (
                                                            <SelectItem key={c} value={c}>
                                                                {CATEGORY_LABEL[c]}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="body">Body</Label>
                                            <Textarea
                                                id="body"
                                                value={form.data.body}
                                                onChange={(e) => form.setData('body', e.target.value)}
                                                rows={6}
                                                placeholder="Share details, links, context..."
                                                required
                                            />
                                            {form.errors.body && <p className="text-sm text-destructive">{form.errors.body}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Image (optional)</Label>
                                            <input
                                                ref={fileRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={onPickImage}
                                                className="hidden"
                                            />
                                            {imagePreview ? (
                                                <div className="relative">
                                                    <img src={imagePreview} alt="" className="max-h-48 rounded-md border" />
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="icon"
                                                        className="absolute right-2 top-2 size-7"
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
                                                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                                                    <ImagePlus className="mr-2 size-4" /> Attach image
                                                </Button>
                                            )}
                                            {form.errors.image && <p className="text-sm text-destructive">{form.errors.image}</p>}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={form.processing}>
                                            {form.processing ? 'Posting…' : 'Post thread'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-2">
                    <div className="flex flex-wrap gap-1">
                        {categories.map((c) => {
                            const active = filters.category === c;
                            return (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setCategory(c)}
                                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                                    }`}
                                >
                                    {CATEGORY_LABEL[c]}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Sort by:</span>
                        <Select value={filters.sort || 'recent'} onValueChange={setSort}>
                            <SelectTrigger className="h-8 w-[170px]">
                                <SelectValue placeholder={sortLabel} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="recent">Recent Activity</SelectItem>
                                <SelectItem value="top">Top voted</SelectItem>
                                <SelectItem value="replies">Most replies</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {threads.data.length === 0 ? (
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <MessageSquare />
                            </EmptyMedia>
                            <EmptyTitle>No threads yet</EmptyTitle>
                            <EmptyDescription>Be the first to start a discussion.</EmptyDescription>
                        </EmptyHeader>
                        {auth?.user && (
                            <EmptyContent>
                                <Button onClick={() => setOpen(true)}>Start a thread</Button>
                            </EmptyContent>
                        )}
                    </Empty>
                ) : (
                    <div className="space-y-2">
                        {threads.data.map((thread) => {
                            const status = thread.status ? STATUS_LABEL[thread.status] : null;
                            return (
                                <Card key={thread.id} className="p-3">
                                    <div className="flex items-start gap-3">
                                        <VoteButton thread={thread} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={forumsShow({ thread: thread.slug }).url}
                                                    className="truncate text-sm font-semibold hover:underline"
                                                >
                                                    {thread.title}
                                                </Link>
                                                {status && (
                                                    <Badge variant="outline" className={`shrink-0 ${status.tone}`}>
                                                        {status.label}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{thread.body}</p>
                                            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                                                <span>{timeAgo(thread.created_at)}</span>
                                                <span>•</span>
                                                <span className="inline-flex items-center gap-1">
                                                    <MessageSquare className="size-3" />
                                                    {thread.replies_count} {thread.replies_count === 1 ? 'reply' : 'replies'}
                                                </span>
                                                <span>•</span>
                                                <Badge variant="secondary" className="capitalize">
                                                    {CATEGORY_LABEL[thread.category] ?? thread.category}
                                                </Badge>
                                            </div>
                                        </div>
                                        <Avatar className="size-8 shrink-0">
                                            <AvatarImage src={thread.user.avatar_url ?? undefined} />
                                            <AvatarFallback>{thread.user.first_name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                </Card>
                            );
                        })}

                        {threads.last_page > 1 && (
                            <div className="flex justify-center pt-2">
                                <Pagination>
                                    <PaginationContent>
                                        {threads.current_page > 1 && (
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href={`/forums?page=${threads.current_page - 1}&category=${filters.category}&sort=${filters.sort}`}
                                                />
                                            </PaginationItem>
                                        )}
                                        {Array.from({ length: threads.last_page }).map((_, i) => (
                                            <PaginationItem key={i + 1}>
                                                <PaginationLink
                                                    href={`/forums?page=${i + 1}&category=${filters.category}&sort=${filters.sort}`}
                                                    isActive={i + 1 === threads.current_page}
                                                >
                                                    {i + 1}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}
                                        {threads.current_page < threads.last_page && (
                                            <PaginationItem>
                                                <PaginationNext
                                                    href={`/forums?page=${threads.current_page + 1}&category=${filters.category}&sort=${filters.sort}`}
                                                />
                                            </PaginationItem>
                                        )}
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
