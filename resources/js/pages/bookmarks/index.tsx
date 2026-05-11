import { Head, Link } from '@inertiajs/react';
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
import { Bookmark } from 'lucide-react';

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
}

interface BookmarkItem {
    id: number;
    blog: Blog;
    created_at: string;
}

interface PaginatedBookmarks {
    data: BookmarkItem[];
    current_page: number;
    last_page: number;
}

interface BookmarksIndexProps {
    bookmarks: PaginatedBookmarks;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Bookmarks', href: '/bookmarks' },
];

export default function BookmarksIndex({ bookmarks }: BookmarksIndexProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Bookmarks" />
            <div className="p-4 space-y-6">
                <h1 className="text-2xl font-bold">Saved Posts</h1>

                {bookmarks.data.length === 0 ? (
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon"><Bookmark /></EmptyMedia>
                            <EmptyTitle>No saved posts yet</EmptyTitle>
                            <EmptyDescription>Bookmark posts you want to read later.</EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <Button asChild><Link href="/blogs">Browse posts</Link></Button>
                        </EmptyContent>
                    </Empty>
                ) : (
                    <>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {bookmarks.data.map(({ id, blog }) => (
                                <Card key={id} className="flex flex-col hover:shadow-lg transition-shadow">
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
                            ))}
                        </div>

                        {bookmarks.last_page > 1 && (
                            <div className="flex justify-center">
                                <Pagination>
                                    <PaginationContent>
                                        {bookmarks.current_page > 1 && (
                                            <PaginationItem>
                                                <PaginationPrevious href={`/bookmarks?page=${bookmarks.current_page - 1}`} />
                                            </PaginationItem>
                                        )}
                                        {Array.from({ length: bookmarks.last_page }).map((_, i) => (
                                            <PaginationItem key={i + 1}>
                                                <PaginationLink href={`/bookmarks?page=${i + 1}`} isActive={i + 1 === bookmarks.current_page}>
                                                    {i + 1}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}
                                        {bookmarks.current_page < bookmarks.last_page && (
                                            <PaginationItem>
                                                <PaginationNext href={`/bookmarks?page=${bookmarks.current_page + 1}`} />
                                            </PaginationItem>
                                        )}
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
