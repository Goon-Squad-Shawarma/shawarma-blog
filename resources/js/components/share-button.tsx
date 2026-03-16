import { useState } from 'react'
import { Share2, Copy, Check, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface ShareButtonProps {
  url: string
  title: string
}

export default function ShareButton({ url, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const fullUrl = window.location.origin + url

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <div className="mb-2 flex flex-col items-center gap-2">
          <div
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border"
          >
            <Link2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <DialogHeader>
            <DialogTitle className="sm:text-center">Share this post</DialogTitle>
            <DialogDescription className="sm:text-center">
              Copy the link below to share &ldquo;{title}&rdquo;
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex gap-2">
          <Input readOnly value={fullUrl} className="text-sm" />
          <Button
            type="button"
            size="sm"
            onClick={handleCopy}
            className="shrink-0 gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
