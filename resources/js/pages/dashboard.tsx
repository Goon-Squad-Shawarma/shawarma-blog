import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { show as blogsShow } from '@/routes/blogs';
import { show as usersShow } from '@/routes/users';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Rss } from 'lucide-react';

interface Blog {
    id: number;
    title: string;
    slug: string;
    subtitle: string | null;
    banner_url: string | null;
    published_at: string;
    reading_time: number;
    user: { id: number; first_name: string; last_name: string; avatar_url?: string | null };
    tags: Array<{ id: number; name: string }>;
    likes_count: number;
    bookmarks_count: number;
    views_count: number;
}

interface PaginatedBlogs {
    data: Blog[];
    current_page: number;
    last_page: number;
}

interface DashboardProps {
    followingBlogs: PaginatedBlogs;
    discoverBlogs: PaginatedBlogs;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
];

function BlogCard({ blog }: { blog: Blog }) {
    return (
        <Card className="flex flex-col hover:shadow-lg transition-shadow">
            {blog.banner_url && (
                <div className="h-48 overflow-hidden rounded-t-lg bg-muted">
                    <img src={blog.banner_url} alt={blog.title} className="h-full w-full object-cover" />
                </div>
            )}
            <CardHeader>
                {blog.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {blog.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag.id} variant="secondary" className="text-xs">{tag.name}</Badge>
                        ))}
                    </div>
                )}
                <CardTitle className="line-clamp-2 hover:underline">
                    <Link href={blogsShow({ slug: blog.slug }).url}>{blog.title}</Link>
                </CardTitle>
                <CardDescription className="line-clamp-2">{blog.subtitle ?? ''}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={blog.user.avatar_url ?? undefined} />
                        <AvatarFallback>{blog.user.first_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <Link href={usersShow({ id: blog.user.id }).url} className="text-sm font-medium truncate block hover:underline">
                            {blog.user.first_name} {blog.user.last_name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{new Date(blog.published_at).toLocaleDateString()}</p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{blog.reading_time} min read</span>
                <Link href={blogsShow({ slug: blog.slug }).url}>
                    <Button variant="ghost" size="sm">Read More →</Button>
                </Link>
            </CardFooter>
        </Card>
    );
}

function BlogGrid({ blogs, tab }: { blogs: PaginatedBlogs; tab: string }) {
    return (
        <div className="space-y-6">
            {blogs.data.length === 0 ? (
                <Empty>
                    <EmptyHeader>
                        <EmptyMedia variant="icon"><Rss /></EmptyMedia>
                        <EmptyTitle>{tab === 'following' ? 'Nothing in your feed yet' : 'No posts to discover'}</EmptyTitle>
                        <EmptyDescription>
                            {tab === 'following' ? 'Follow authors or organizations to see their posts here.' : 'Check back later for new content.'}
                        </EmptyDescription>
                    </EmptyHeader>
                    {tab === 'following' && (
                        <EmptyContent>
                            <Button asChild><Link href="/blogs">Explore posts</Link></Button>
                        </EmptyContent>
                    )}
                </Empty>
            ) : (
                <>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {blogs.data.map((blog) => <BlogCard key={blog.id} blog={blog} />)}
                    </div>
                    {blogs.last_page > 1 && (
                        <div className="flex justify-center">
                            <Pagination>
                                <PaginationContent>
                                    {blogs.current_page > 1 && (
                                        <PaginationItem>
                                            <PaginationPrevious href={`/dashboard?${tab}_page=${blogs.current_page - 1}`} />
                                        </PaginationItem>
                                    )}
                                    {Array.from({ length: blogs.last_page }).map((_, i) => (
                                        <PaginationItem key={i + 1}>
                                            <PaginationLink href={`/dashboard?${tab}_page=${i + 1}`} isActive={i + 1 === blogs.current_page}>
                                                {i + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
                                    {blogs.current_page < blogs.last_page && (
                                        <PaginationItem>
                                            <PaginationNext href={`/dashboard?${tab}_page=${blogs.current_page + 1}`} />
                                        </PaginationItem>
                                    )}
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default function Dashboard({ followingBlogs, discoverBlogs }: DashboardProps) {
    const [activeTab, setActiveTab] = useState<'following' | 'discover'>('following');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="p-4 space-y-6">
                <div className="flex gap-2 border-b pb-2">
                    <Button
                        variant={activeTab === 'following' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTab('following')}
                    >
                        Following
                    </Button>
                    <Button
                        variant={activeTab === 'discover' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTab('discover')}
                    >
                        Discover
                    </Button>
                </div>
                {activeTab === 'following' && <BlogGrid blogs={followingBlogs} tab="following" />}
                {activeTab === 'discover' && <BlogGrid blogs={discoverBlogs} tab="discover" />}
            </div>
        </AppLayout>
    );
}
