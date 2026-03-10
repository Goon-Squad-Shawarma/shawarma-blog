import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useForm } from '@inertiajs/react'
import { useState } from 'react'

interface LikeButtonProps {
  blogId: number
  liked: boolean
  likesCount: number
}

export default function LikeButton({ blogId, liked, likesCount }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(liked)
  const [count, setCount] = useState(likesCount)
  const { post, delete: destroy, processing } = useForm()

  const handleToggle = () => {
    if (isLiked) {
      destroy(`/blogs/${blogId}/like`, {
        onSuccess: () => {
          setIsLiked(false)
          setCount(count - 1)
        },
      } as any)
    } else {
      post(`/blogs/${blogId}/like`, {
        onSuccess: () => {
          setIsLiked(true)
          setCount(count + 1)
        },
      } as any)
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
