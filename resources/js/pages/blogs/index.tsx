import { Head, Link, usePage } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

interface Tag {
  id: number
  name: string
  slug: string
}

interface Blog {
  id: number
  title: string
  subtitle: string
  content: string
  banner_url: string | null
  published_at: string
  reading_time: number
  user: { id: number; name: string }
  tags: Tag[]
}

interface PaginationData {
  data: Blog[]
  current_page: number
  last_page: number
}

interface BlogIndexProps {
  blogs: PaginationData
}

export default function BlogIndex({ blogs }: BlogIndexProps) {
  const { auth } = usePage().props

  return (
    <>
      <Head title="Blogs" />
      
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Blogs</h1>
            <p className="text-muted-foreground mt-2">Discover stories from our community</p>
          </div>
          {auth?.user && (
            <Link href="/blogs/create">
              <Button>Create Blog</Button>
            </Link>
          )}
        </div>

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
                      <Badge key={tag.id} variant="secondary" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}

                <CardTitle className="line-clamp-2 hover:underline">
                  <Link href={`/blogs/${blog.id}`}>{blog.title}</Link>
                </CardTitle>

                <CardDescription className="line-clamp-2">
                  {blog.subtitle || blog.content.substring(0, 100)}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                {/* Author and date */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{blog.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{blog.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(blog.published_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{blog.reading_time} min read</span>
                <Link href={`/blogs/${blog.id}`}>
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
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No blogs found</p>
            {auth?.user && (
              <Link href="/blogs/create">
                <Button>Create the first blog</Button>
              </Link>
            )}
          </div>
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
    </>
  )
}
