import { Head, Link, useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Heart, MessageCircle, Share2, Edit2, Trash2 } from 'lucide-react'
import CommentSection from '@/components/comments/comment-section'
import LikeButton from '@/components/likes/like-button'

interface Blog {
  id: number
  title: string
  subtitle?: string
  content: string
  banner_url?: string
  published_at: string
  reading_time: number
  user: { id: number; name: string }
  organization?: { id: number; name: string }
  tags: Array<{ id: number; name: string }>
  comments: any[]
  likes: any[]
}

interface BlogShowProps {
  blog: Blog
  canUpdate: boolean
  canDelete: boolean
  canComment: boolean
  canLike: boolean
  userLiked: boolean
}

export default function BlogShow({ blog, canUpdate, canDelete, canComment, canLike, userLiked }: BlogShowProps) {
  const { delete: destroy } = useForm()

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this blog?')) {
      destroy(`/blogs/${blog.id}`)
    }
  }

  const publishedDate = new Date(blog.published_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      <Head title={blog.title} />

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/blogs" className="hover:text-foreground">
              Blogs
            </Link>
            <span>/</span>
            <span>{blog.title}</span>
          </div>

          {/* Title and Meta */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">{blog.title}</h1>
            {blog.subtitle && (
              <p className="text-xl text-muted-foreground">{blog.subtitle}</p>
            )}

            {/* Author info and date */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{blog.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    <Link href={`/users/${blog.user.id}`} className="hover:underline">
                      {blog.user.name}
                    </Link>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {publishedDate} • {blog.reading_time} min read
                  </p>
                </div>
              </div>

              {/* Actions */}
              {(canUpdate || canDelete) && (
                <div className="flex gap-2">
                  {canUpdate && (
                    <Link href={`/blogs/${blog.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  {canDelete && (
                    <Button variant="ghost" size="sm" onClick={handleDelete}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Tags */}
            {blog.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {blog.tags.map((tag: any) => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Banner */}
        {blog.banner_url && (
          <div className="rounded-lg overflow-hidden bg-muted h-96">
            <img
              src={blog.banner_url}
              alt={blog.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <article className="prose prose-sm dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-foreground leading-relaxed">
            {blog.content}
          </div>
        </article>

        <Separator />

        {/* Engagement */}
        <div className="flex items-center gap-6 py-4">
          {canLike && (
            <LikeButton
              blogId={blog.id}
              liked={userLiked}
              likesCount={blog.likes.length}
            />
          )}
          {canComment && (
            <Button variant="ghost" size="sm" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              <span>{blog.comments.length}</span>
            </Button>
          )}
          <Button variant="ghost" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        {/* Organization info */}
        {blog.organization && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Published by</p>
                  <Link href={`/organizations/${blog.organization.id}`} className="hover:underline">
                    <p className="font-medium">{blog.organization.name}</p>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comments Section */}
        {canComment && (
          <div className="space-y-6">
            <Separator />
            <CommentSection blog={blog} />
          </div>
        )}
      </div>
    </>
  )
}
