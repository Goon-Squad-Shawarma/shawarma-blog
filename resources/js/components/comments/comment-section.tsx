import { useState, FormEvent } from 'react'
import { useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import InputError from '@/components/input-error'
import { Trash2, Edit2 } from 'lucide-react'

interface Comment {
  id: number
  content: string
  created_at: string
  user: { id: number; name: string }
  replies: Comment[]
}

interface CommentSectionProps {
  blog: {
    id: number
    comments: Comment[]
  }
}

export default function CommentSection({ blog }: CommentSectionProps) {
  const { data, setData, post, processing, errors, reset } = useForm({
    content: '',
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    post(`/blogs/${blog.id}/comments`, {
      onSuccess: () => reset(),
    } as any)
  }

  const handleDelete = (commentId: number) => {
    if (confirm('Delete this comment?')) {
      // Will implement delete via route
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Comments ({blog.comments.length})</h2>

      {/* Comment Form */}
      <Card className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={data.content}
            onChange={(e) => setData('content', e.target.value)}
            placeholder="Share your thoughts..."
            className={errors.content ? 'border-red-500' : ''}
            rows={4}
          />
          <InputError message={errors.content} />
          <Button type="submit" disabled={processing || !data.content.trim()}>
            {processing ? 'Posting...' : 'Post Comment'}
          </Button>
        </form>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {blog.comments.map((comment: Comment) => (
          <Card key={comment.id} className="p-4">
            <div className="flex gap-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{comment.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Comment actions */}
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {comment.content}
                </p>

                {/* Nested replies */}
                {comment.replies?.length > 0 && (
                  <div className="mt-4 pl-4 border-l-2 border-muted space-y-3">
                    {comment.replies.map((reply: Comment) => (
                      <div key={reply.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{reply.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{reply.user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(reply.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {blog.comments.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No comments yet. Be the first!</p>
        </div>
      )}
    </div>
  )
}
