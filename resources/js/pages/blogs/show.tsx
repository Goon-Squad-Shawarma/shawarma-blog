import { Head, Link, useForm } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import type { BreadcrumbItem } from '@/types'
import { index as blogsIndex, show as blogsShow, edit as blogsEdit } from '@/routes/blogs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Heart, MessageCircle, Edit2, Trash2 } from 'lucide-react'
import CommentSection from '@/components/comments/comment-section'
import LikeButton from '@/components/likes/like-button'
import ShareButton from '@/components/share-button'
import { RichTextViewer } from '@/components/blocks/editor-00/rich-text-viewer'

interface Blog {
  id: number
  title: string
  slug: string
  subtitle?: string
  content: string
  banner_url?: string
  published_at: string
  reading_time: number
  user: { id: number; first_name: string; last_name: string; avatar_url?: string | null }
  organization?: { id: number; name: string }
  tags: Array<{ id: number; name: string }>
  comments: Array<{ id: number; content: string; created_at: string; user: { id: number; first_name: string; last_name: string; avatar_url?: string | null }; likes: Array<{ id: number; user_id: number; type: 'thumbsup' | 'thumbsdown' }>; replies: Array<{ id: number; content: string; created_at: string; user: { id: number; first_name: string; last_name: string; avatar_url?: string | null }; likes: Array<{ id: number; user_id: number; type: 'thumbsup' | 'thumbsdown' }>; replies: [] }>}>
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
    destroy(blogsShow({ slug: blog.slug }).url)
  }

  const publishedDate = new Date(blog.published_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Blogs', href: blogsIndex().url },
    { title: blog.title, href: blogsShow(blog).url },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={blog.title} />

      <div className="max-w-3xl mx-auto space-y-8 p-4">
        {/* Header */}
        <div className="space-y-4">
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
                  <AvatarImage src={blog.user.avatar_url ?? undefined} alt={`${blog.user.first_name} ${blog.user.last_name}`} />
                  <AvatarFallback>{blog.user.first_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    <Link href={`/users/${blog.user.id}`} className="hover:underline">
                      {`${blog.user.first_name} ${blog.user.last_name}`}
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
                    <Link href={blogsEdit({ slug: blog.slug }).url}>
                      <Button variant="ghost" size="sm">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete blog post?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. The post will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction variant="destructive" onClick={handleDelete}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
          <RichTextViewer content={blog.content} />
        </article>

        <Separator />

        {/* Engagement */}
        <div className="flex items-center gap-6 py-4">
          {canLike && (
            <LikeButton
              blogSlug={blog.slug}
              liked={userLiked}
              likesCount={blog.likes.length}
            />
          )}
          {canComment && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <MessageCircle className="h-4 w-4" />
              <span>{blog.comments.length}</span>
            </Button>
          )}
          <ShareButton url={blogsShow(blog).url} title={blog.title} />
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
          <div id="comments" className="space-y-6">
            <Separator />
            <CommentSection blog={blog} />
          </div>
        )}
      </div>
    </AppLayout>
  )
}
