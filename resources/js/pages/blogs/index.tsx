import { Head, Link, router, usePage } from '@inertiajs/react'
import { FileTextIcon } from 'lucide-react'
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
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Blogs', href: blogsIndex().url },
]

export default function BlogIndex({ blogs, tags, filters }: BlogIndexProps) {
  const { auth } = usePage().props

  return (
    <AppLayout breadcrumbs={breadcrumbs} showSearch={true}>
      <Head title="Blogs" />
      
      <div className="p-4 space-y-8">
        {/* Blogs Grid */}
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
    </AppLayout>
  )
}
