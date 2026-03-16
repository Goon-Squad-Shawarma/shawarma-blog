import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { store as likesStore, destroy as likesDestroy } from '@/routes/likes'

interface LikeButtonProps {
  blogSlug: string
  liked: boolean
  likesCount: number
}

function getCsrfToken(): string {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

export default function LikeButton({ blogSlug, liked, likesCount }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(liked)
  const [count, setCount] = useState(likesCount)
  const [processing, setProcessing] = useState(false)

  const handleToggle = async () => {
    if (processing) return
    setProcessing(true)

    const wasLiked = isLiked
    setIsLiked(!wasLiked)
    setCount(wasLiked ? count - 1 : count + 1)

    try {
      const route = wasLiked
        ? likesDestroy({ slug: blogSlug })
        : likesStore({ slug: blogSlug })

      const res = await fetch(route.url, {
        method: route.method.toUpperCase(),
        headers: {
          'X-XSRF-TOKEN': getCsrfToken(),
          Accept: 'application/json',
        },
        credentials: 'include',
      })

      if (!res.ok) {
        setIsLiked(wasLiked)
        setCount(wasLiked ? count : count - 1)
      }
    } catch {
      setIsLiked(wasLiked)
      setCount(wasLiked ? count : count - 1)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2"
      onClick={handleToggle}
      disabled={processing}
    >
      <Heart
        className={`h-4 w-4 transition-colors ${
          isLiked ? 'fill-red-500 text-red-500' : ''
        }`}
      />
      <span>{count}</span>
    </Button>
  )
}
