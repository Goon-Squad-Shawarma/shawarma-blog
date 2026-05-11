import { Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { store as bookmarksStore, destroy as bookmarksDestroy } from '@/routes/bookmarks'

interface BookmarkButtonProps {
  blogSlug: string
  bookmarked: boolean
  bookmarksCount: number
}

function getCsrfToken(): string {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

export default function BookmarkButton({ blogSlug, bookmarked, bookmarksCount }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(bookmarked)
  const [count, setCount] = useState(bookmarksCount)
  const [processing, setProcessing] = useState(false)

  const handleToggle = async () => {
    if (processing) return
    setProcessing(true)

    const wasBookmarked = isBookmarked
    setIsBookmarked(!wasBookmarked)
    setCount(wasBookmarked ? count - 1 : count + 1)

    try {
      const route = wasBookmarked
        ? bookmarksDestroy({ blog: blogSlug })
        : bookmarksStore({ blog: blogSlug })

      const res = await fetch(route.url, {
        method: route.method.toUpperCase(),
        headers: {
          'X-XSRF-TOKEN': getCsrfToken(),
          Accept: 'application/json',
        },
        credentials: 'include',
      })

      if (!res.ok) {
        setIsBookmarked(wasBookmarked)
        setCount(wasBookmarked ? count : count - 1)
      }
    } catch {
      setIsBookmarked(wasBookmarked)
      setCount(wasBookmarked ? count : count - 1)
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
      <Bookmark
        className={`h-4 w-4 transition-colors ${
          isBookmarked ? 'fill-current text-primary' : ''
        }`}
      />
      <span>{count}</span>
    </Button>
  )
}
