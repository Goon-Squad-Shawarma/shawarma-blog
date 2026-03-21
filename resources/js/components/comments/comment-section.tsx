import { useState, FormEvent } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ThumbsUp, ThumbsDown, Trash2, ChevronDown, ChevronUp, Pencil } from 'lucide-react'
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
import { store as commentsStore, destroy as commentsDestroy, update as commentsUpdate } from '@/routes/comments'
import { store as commentLikesStore, destroy as commentLikesDestroy } from '@/routes/comment-likes'
import { formatDistanceToNow } from 'date-fns'

interface CommentLike {
  id: number
  user_id: number
  type: 'thumbsup' | 'thumbsdown'
}

interface Comment {
  id: number
  content: string
  created_at: string
  user: { id: number; first_name: string; last_name: string; avatar_url?: string | null }
  likes: CommentLike[]
  replies: Comment[]
}

interface CommentSectionProps {
  blog: {
    id: number
    slug: string
    comments: Comment[]
  }
}

interface CommentItemProps {
  comment: Comment
  blogSlug: string
  currentUserId: number | null
  depth?: number
  threadId?: number
}

function getCsrfToken(): string {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

function CommentItem({ comment, blogSlug, currentUserId, depth = 0, threadId }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [repliesOpen, setRepliesOpen] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [submitting, setSubmitting] = useState(false)

  // Optimistic like state
  const [likes, setLikes] = useState<CommentLike[]>(comment.likes ?? [])
  const [likeProcessing, setLikeProcessing] = useState(false)

  const isOwn = currentUserId === comment.user.id
  const replyCount = comment.replies?.length ?? 0

  const thumbsupCount = likes.filter((l) => l.type === 'thumbsup').length
  const thumbsdownCount = likes.filter((l) => l.type === 'thumbsdown').length
  const userLike = currentUserId ? likes.find((l) => l.user_id === currentUserId) : null
  const userThumbed = userLike?.type ?? null

  const handleThumb = async (type: 'thumbsup' | 'thumbsdown') => {
    if (!currentUserId || likeProcessing) return
    setLikeProcessing(true)

    const prevLikes = likes

    // Optimistic update
    if (userThumbed === type) {
      // Toggle off
      setLikes(likes.filter((l) => l.user_id !== currentUserId))
    } else if (userThumbed) {
      // Replace existing reaction
      setLikes(likes.map((l) => (l.user_id === currentUserId ? { ...l, type } : l)))
    } else {
      // New reaction (use id 0 as temporary placeholder)
      setLikes([...likes, { id: 0, user_id: currentUserId, type }])
    }

    try {
      const res = await fetch(commentLikesStore({ comment: comment.id }).url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCsrfToken(),
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ type }),
      })

      if (!res.ok) {
        setLikes(prevLikes)
      }
    } catch {
      setLikes(prevLikes)
    } finally {
      setLikeProcessing(false)
    }
  }

  const handleReplySubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim() || submitting) return
    setSubmitting(true)
    router.post(
      commentsStore({ slug: blogSlug }).url,
      { content: replyContent, parent_id: threadId ?? comment.id },
      {
        preserveScroll: true,
        onSuccess: () => {
          setReplyContent('')
          setShowReplyForm(false)
          setRepliesOpen(true)
          setSubmitting(false)
        },
        onError: () => setSubmitting(false),
      },
    )
  }

  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!editContent.trim()) return
    router.patch(
      commentsUpdate(comment.id).url,
      { content: editContent },
      { preserveScroll: true, onSuccess: () => setIsEditing(false) },
    )
  }

  const handleDelete = () => {
    router.delete(commentsDestroy(comment.id).url, { preserveScroll: true })
  }

  return (
    <div className="flex gap-3">
      <Avatar className={depth === 0 ? 'h-10 w-10 shrink-0' : 'h-8 w-8 shrink-0'}>
        <AvatarImage src={comment.user.avatar_url ?? undefined} alt={`${comment.user.first_name} ${comment.user.last_name}`} />
        <AvatarFallback className={depth === 0 ? 'text-sm' : 'text-xs'}>
          {comment.user.first_name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold">{`${comment.user.first_name} ${comment.user.last_name}`}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          {isOwn && !isEditing && (
            <div className="flex items-center gap-0.5 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent size="sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone.
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
            </div>
          )}
        </div>

        {/* Content or edit form */}
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="mt-2 space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="text-sm resize-none"
              autoFocus
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={!editContent.trim()}>
                Save
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false)
                  setEditContent(comment.content)
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <p className="mt-1 text-sm leading-relaxed">{comment.content}</p>
        )}

        {/* Action row */}
        {!isEditing && (
          <div className="flex items-center gap-0.5 mt-1 -ml-2">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 gap-1.5 px-2 text-xs ${userThumbed === 'thumbsup' ? 'text-blue-400' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => handleThumb('thumbsup')}
              disabled={!currentUserId || likeProcessing}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              {thumbsupCount > 0 && <span>{thumbsupCount}</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 gap-1.5 px-2 text-xs ${userThumbed === 'thumbsdown' ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => handleThumb('thumbsdown')}
              disabled={!currentUserId || likeProcessing}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              {thumbsdownCount > 0 && <span>{thumbsdownCount}</span>}
            </Button>
            {currentUserId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs font-semibold"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                Reply
              </Button>
            )}
          </div>
        )}

        {/* Inline reply form */}
        {showReplyForm && (
          <div className="mt-3 flex gap-3">
            <form onSubmit={handleReplySubmit} className="flex-1 space-y-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={depth > 0 ? `@${comment.user.first_name} ` : `Reply to ${comment.user.first_name}…`}
                rows={2}
                className="text-sm resize-none border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-foreground"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowReplyForm(false)
                    setReplyContent('')
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={!replyContent.trim() || submitting}>
                  {submitting ? 'Posting…' : 'Reply'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* View / hide replies via Collapsible */}
        {replyCount > 0 && depth === 0 && (
          <Collapsible open={repliesOpen} onOpenChange={setRepliesOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-8 px-2 text-xs font-semibold text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
              >
                {repliesOpen ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5 mr-1" />
                    Hide replies
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5 mr-1" />
                    {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  blogSlug={blogSlug}
                  currentUserId={currentUserId}
                  depth={1}
                  threadId={comment.id}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  )
}

export default function CommentSection({ blog }: CommentSectionProps) {
  const { auth } = usePage().props as any
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!content.trim() || submitting) return
    setSubmitting(true)
    router.post(
      commentsStore({ slug: blog.slug }).url,
      { content },
      {
        preserveScroll: true,
        onSuccess: () => {
          setContent('')
          setSubmitting(false)
        },
        onError: () => setSubmitting(false),
      },
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{blog.comments.length} Comments</h2>

      {/* New comment form */}
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="text-sm">
            {auth?.user?.first_name?.charAt(0).toUpperCase() ?? '?'}
          </AvatarFallback>
        </Avatar>
        <form onSubmit={handleSubmit} className="flex-1 space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a comment…"
            rows={1}
            className="text-sm resize-none border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-foreground"
          />
          {content && (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setContent('')}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!content.trim() || submitting}>
                {submitting ? 'Posting…' : 'Comment'}
              </Button>
            </div>
          )}
        </form>
      </div>

      {/* Comments list */}
      {blog.comments.length > 0 ? (
        <div className="space-y-6">
          {blog.comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              blogSlug={blog.slug}
              currentUserId={auth?.user?.id ?? null}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">No comments yet. Be the first!</p>
      )}
    </div>
  )
}
