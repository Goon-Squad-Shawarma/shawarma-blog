import { Head, Link, router, usePage } from '@inertiajs/react'
import { FileTextIcon, Eye, Heart } from 'lucide-react'
import AppLayout from '@/layouts/app-layout'
import type { BreadcrumbItem } from '@/types'
import { index as blogsIndex, show as blogsShow } from '@/routes/blogs'
import { show as usersShow } from '@/routes/users'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

interface Tag {
  id: number
  name: string
  slug: string
}

interface Blog {
  id: number
  title: string
  slug: string
  subtitle: string
  content: string
  banner_url: string | null
  published_at: string
  reading_time: number
  user: { id: number; first_name: string; last_name: string; avatar_url?: string | null }
  tags: Tag[]
}

interface PaginationData {
  data: Blog[]
  current_page: number
  last_page: number
}

interface BlogIndexProps {
  blogs: PaginationData
  tags: Tag[]
  filters: { search?: string; tags?: string[]; author?: string; organization?: string }
  trendingBlogs: Array<{ id: number; title: string; slug: string; reading_time: number; user: { first_name: string; last_name: string }; likes_count: number; views_count: number }>
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Blogs', href: blogsIndex().url },
]

export default function BlogIndex({ blogs, tags, filters, trendingBlogs }: BlogIndexProps) {
  const { auth } = usePage().props

  return (
    <AppLayout breadcrumbs={breadcrumbs} showSearch={true}>
      <Head title="Blogs" />

      <div className="p-4 flex gap-8">
        {/* Main content */}
        <div className="flex-1 space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogs.data.map((blog: Blog) => (
            <Card key={blog.id} className="flex flex-col hover:shadow-lg transition-shadow">
              {/* Banner */}
              {blog.banner_url && (
                <div className="h-48 overflow-hidden rounded-t-lg bg-muted">
                  <img
                    src={blog.banner_url}
                    alt={blog.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <CardHeader>
                {/* Tags */}
                {blog.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {blog.tags.slice(0, 3).map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          const currentTags = filters.tags ?? []
                          const merged = currentTags.includes(tag.slug) ? currentTags : [...currentTags, tag.slug]
                          router.get(blogsIndex().url, {
                            ...(filters.search && { search: filters.search }),
                            ...(filters.author && { author: filters.author }),
                            ...(filters.organization && { organization: filters.organization }),
                            tags: merged,
                          })
                        }}
                        className="cursor-pointer"
                      >
                        <Badge
                          variant={filters.tags?.includes(tag.slug) ? 'default' : 'secondary'}
                          className="text-xs transition-colors hover:opacity-80"
                        >
                          {tag.name}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}

                <CardTitle className="line-clamp-2 hover:underline">
                  <Link href={blogsShow({ slug: blog.slug }).url}>{blog.title}</Link>
                </CardTitle>

                <CardDescription className="line-clamp-2">
                  {blog.subtitle || blog.content.substring(0, 100)}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                {/* Author and date */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={blog.user.avatar_url ?? undefined} alt={`${blog.user.first_name} ${blog.user.last_name}`} />
                    <AvatarFallback>{blog.user.first_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={usersShow({ id: blog.user.id }).url}
                      className="text-sm font-medium truncate block hover:underline"
                    >
                      {`${blog.user.first_name} ${blog.user.last_name}`}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {new Date(blog.published_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{blog.reading_time} min read</span>
                <Link href={blogsShow({ slug: blog.slug }).url}>
                  <Button variant="ghost" size="sm">
                    Read More →
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Empty state */}
        {blogs.data.length === 0 && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileTextIcon />
              </EmptyMedia>
              <EmptyTitle>No blogs found</EmptyTitle>
              <EmptyDescription>
                {auth?.user ? 'Be the first to share something with the community.' : 'Check back later for new posts.'}
              </EmptyDescription>
            </EmptyHeader>
            {auth?.user && (
              <EmptyContent>
                <Button asChild>
                  <Link href={blogsIndex().url + '/create'}>Create the first blog</Link>
                </Button>
              </EmptyContent>
            )}
          </Empty>
        )}

        {/* Pagination */}
        {blogs.last_page > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                {blogs.current_page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious href={`/blogs?page=${blogs.current_page - 1}`} />
                  </PaginationItem>
                )}

                {Array.from({ length: blogs.last_page }).map((_, i) => (
                  <PaginationItem key={i + 1}>
                    <PaginationLink
                      href={`/blogs?page=${i + 1}`}
                      isActive={i + 1 === blogs.current_page}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                {blogs.current_page < blogs.last_page && (
                  <PaginationItem>
                    <PaginationNext href={`/blogs?page=${blogs.current_page + 1}`} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
        {/* end flex-1 main */}

        {/* Trending Sidebar */}
        {trendingBlogs?.length > 0 && (
          <aside className="hidden lg:block w-72 shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trending This Week</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trendingBlogs.map((blog) => (
                  <div key={blog.id} className="space-y-1">
                    <Link href={blogsShow({ slug: blog.slug }).url} className="text-sm font-medium line-clamp-2 hover:underline block">
                      {blog.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{blog.user.first_name} {blog.user.last_name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{blog.likes_count}</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{blog.views_count}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>
        )}
      </div>{/* end p-4 flex gap-8 */}
    </AppLayout>
  )
}
