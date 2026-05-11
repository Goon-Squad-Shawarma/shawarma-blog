import { Head, Link, usePage } from '@inertiajs/react';
import { ShaderBackground, SiteHeader, HeroContent, PulsingCircle } from '@/components/ui/shaders-hero-section';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { index as blogsIndex, show as blogsShow } from '@/routes/blogs';
import { login, register } from '@/routes';

interface Tag {
    id: number;
    name: string;
    slug: string;
}

interface RecentBlog {
    id: number;
    title: string;
    subtitle: string | null;
    slug: string;
    banner_url: string | null;
    reading_time: number;
    published_at: string;
    user: { id: number; first_name: string; last_name: string; avatar_url: string | null };
    tags: Tag[];
}

export default function Welcome({
    canRegister = true,
    recentBlogs = [],
}: {
    canRegister?: boolean;
    recentBlogs?: RecentBlog[];
}) {
    const { auth } = usePage().props as any;

    return (
        <>
            <Head title="Shawarma Blog — Share your story" />
            <ShaderBackground>
                <SiteHeader auth={auth} canRegister={canRegister} />
                <HeroContent auth={auth} canRegister={canRegister} />
                <PulsingCircle />
            </ShaderBackground>

            {/* Recent Blogs Feed */}
            <section className="w-full bg-background py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold tracking-tight">What's Being Written</h2>
                        <Link href={blogsIndex().url} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Browse all →
                        </Link>
                    </div>

                    {recentBlogs.length > 0 ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {recentBlogs.map((blog) => {
                                const route = blogsShow({ slug: blog.slug });
                                const publishedDate = new Date(blog.published_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                });

                                return (
                                    <Link key={blog.id} href={route.url} className="group block">
                                        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
                                            {blog.banner_url && (
                                                <div className="h-48 overflow-hidden rounded-t-lg bg-muted">
                                                    <img
                                                        src={blog.banner_url}
                                                        alt={blog.title}
                                                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                </div>
                                            )}
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={blog.user.avatar_url ?? undefined} />
                                                        <AvatarFallback>{blog.user.first_name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-medium">
                                                        {blog.user.first_name} {blog.user.last_name}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-base leading-tight line-clamp-2">{blog.title}</h3>
                                                {blog.subtitle && (
                                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{blog.subtitle}</p>
                                                )}
                                            </CardHeader>
                                            <CardContent className="flex-1" />
                                            <CardFooter className="pt-0 flex flex-wrap items-center gap-2">
                                                <span className="text-xs text-muted-foreground">{blog.reading_time} min read</span>
                                                <span className="text-xs text-muted-foreground">·</span>
                                                <span className="text-xs text-muted-foreground">{publishedDate}</span>
                                                {blog.tags?.slice(0, 2).map((tag) => (
                                                    <Badge key={tag.id} variant="secondary" className="text-xs">{tag.name}</Badge>
                                                ))}
                                            </CardFooter>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-12">No posts published yet. Be the first to write!</p>
                    )}

                    {/* Guest CTA */}
                    {!auth?.user && (
                        <div className="mt-12 text-center rounded-xl border bg-muted/30 py-12 px-6">
                            <p className="text-lg font-medium mb-4">Join to read, write, and follow authors you love</p>
                            <div className="flex justify-center gap-3">
                                {canRegister && (
                                    <Button asChild>
                                        <Link href={register().url}>Register</Link>
                                    </Button>
                                )}
                                <Button variant="outline" asChild>
                                    <Link href={login().url}>Log in</Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
