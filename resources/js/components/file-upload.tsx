import { useEffect, useRef } from 'react'
import { AlertCircleIcon, ImageIcon, UploadIcon, XIcon } from 'lucide-react'

import { useFileUpload } from '@/hooks/use-file-upload'
import { Button } from '@/components/ui/button'

interface BannerUploadProps {
    onChange: (file: File | null) => void
    initialUrl?: string | null
    error?: string
}

export default function BannerUpload({ onChange, initialUrl, error }: BannerUploadProps) {
    const maxSizeMB = 5
    const maxSize = maxSizeMB * 1024 * 1024

    const [
        { files, isDragging, errors },
        { handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog, removeFile, getInputProps },
    ] = useFileUpload({
        accept: 'image/png,image/jpeg,image/jpg,image/gif,image/webp',
        maxSize,
        multiple: false,
        initialFiles: initialUrl
            ? [{ id: 'existing-banner', name: 'banner', size: 0, type: 'image/jpeg', url: initialUrl }]
            : [],
    })

    const isFirstRender = useRef(true)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        const first = files[0]
        onChange(first?.file instanceof File ? first.file : null)
    }, [files])

    const preview = files[0]?.preview

    return (
        <div className="flex flex-col gap-2">
            <div
                className="relative flex min-h-40 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-input p-4 transition-colors has-[input:focus]:border-ring has-[input:focus]:ring-[3px] has-[input:focus]:ring-ring/50 data-[dragging=true]:bg-accent/50"
                data-dragging={isDragging || undefined}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <input {...getInputProps()} aria-label="Upload banner image" className="sr-only" />

                {preview ? (
                    <div className="relative w-full">
                        <img src={preview} alt="Banner preview" className="aspect-video w-full rounded-lg object-cover" />
                        <Button
                            type="button"
                            aria-label="Remove banner"
                            className="-right-2 -top-2 absolute size-6 rounded-full border-2 border-background shadow-none focus-visible:border-background"
                            onClick={() => removeFile(files[0].id)}
                            size="icon"
                        >
                            <XIcon className="size-3.5" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
                        <div
                            aria-hidden="true"
                            className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border bg-background"
                        >
                            <ImageIcon className="size-4 opacity-60" />
                        </div>
                        <p className="mb-1 text-sm font-medium">Drop your banner here</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF or WebP (max. {maxSizeMB}MB)</p>
                        <Button className="mt-4" type="button" onClick={openFileDialog} variant="outline">
                            <UploadIcon aria-hidden="true" className="-ms-1 opacity-60" />
                            Select image
                        </Button>
                    </div>
                )}
            </div>

            {(errors.length > 0 || error) && (
                <div className="flex items-center gap-1 text-xs text-destructive" role="alert">
                    <AlertCircleIcon className="size-3 shrink-0" />
                    <span>{errors[0] ?? error}</span>
                </div>
            )}
        </div>
    )
}

