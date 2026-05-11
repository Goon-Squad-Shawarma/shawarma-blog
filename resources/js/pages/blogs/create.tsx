import { Head, Link, useForm } from '@inertiajs/react'
import { FormEvent, useState } from 'react'
import { SerializedEditorState } from 'lexical'
import AppLayout from '@/layouts/app-layout'
import type { BreadcrumbItem } from '@/types'
import { index as blogsIndex, create as blogsCreate } from '@/routes/blogs'
import { draft as aiDraft } from '@/routes/ai'
import { Editor } from '@/components/blocks/editor-00/editor'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import InputError from '@/components/input-error'
import { format } from 'date-fns'
import { CalendarIcon, Sparkles } from 'lucide-react'
import DateTimePicker from '@/components/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import TagSelector from '@/components/tag-selector'
import BannerUpload from '@/components/file-upload'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'

interface Tag {
    id: number
    name: string
    slug: string
}

interface Organization {
    id: number
    name: string
    slug: string
}

interface BlogCreateProps {
    tags: Tag[]
    organizations: Organization[]
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Blogs', href: blogsIndex().url },
    { title: 'Create Post', href: blogsCreate().url },
]

export default function BlogCreate({ tags, organizations }: BlogCreateProps) {
    const { data, setData, post, processing, errors } = useForm<{
        title: string
        subtitle: string
        content: string
        banner: File | null
        visibility: string
        published_at: string
        organization_id: string
        tags: number[]
    }>({
        title: '',
        subtitle: '',
        content: '',
        banner: null,
        visibility: 'public',
        published_at: '',
        organization_id: '',
        tags: [],
    })

    const [aiOpen, setAiOpen] = useState(false)
    const [aiTopic, setAiTopic] = useState('')
    const [aiOutline, setAiOutline] = useState('')
    const [aiLoading, setAiLoading] = useState(false)
    const [aiHtml, setAiHtml] = useState<string | undefined>()
    const [editorKey, setEditorKey] = useState(0)

    const handleAiDraft = async () => {
        setAiLoading(true)
        try {
            const res = await fetch(aiDraft().url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
                body: JSON.stringify({ topic: aiTopic, outline: aiOutline || undefined }),
            })
            const json = await res.json()
            setData('title', json.title)
            setAiHtml(json.content)
            setEditorKey((k) => k + 1)
            setAiOpen(false)
            setAiTopic('')
            setAiOutline('')
        } finally {
            setAiLoading(false)
        }
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        post('/blogs')
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Blog" />

            <Dialog open={aiOpen} onOpenChange={setAiOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Generate AI Draft</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="ai-topic">Topic <span className="text-destructive">*</span></Label>
                            <Input
                                id="ai-topic"
                                value={aiTopic}
                                onChange={(e) => setAiTopic(e.target.value)}
                                placeholder="e.g. The best shawarma ingredients"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="ai-outline">Outline <span className="text-muted-foreground text-xs">(optional)</span></Label>
                            <Textarea
                                id="ai-outline"
                                value={aiOutline}
                                onChange={(e) => setAiOutline(e.target.value)}
                                placeholder="Briefly describe the sections you want…"
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAiOpen(false)} disabled={aiLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleAiDraft} disabled={!aiTopic.trim() || aiLoading}>
                            {aiLoading ? <><Spinner className="mr-2 size-4" /> Generating…</> : 'Generate'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <form onSubmit={handleSubmit} className="flex h-[calc(100svh-4rem)] overflow-hidden">
                {/* Editor — main canvas */}
                <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 p-6">
                    <div className="space-y-1">
                        <input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Post title…"
                            className="w-full border-none bg-transparent text-4xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/40"
                        />
                        {errors.title && <InputError message={errors.title} />}
                        <input
                            id="subtitle"
                            value={data.subtitle}
                            onChange={(e) => setData('subtitle', e.target.value)}
                            placeholder="Subtitle…"
                            className="w-full border-none bg-transparent text-lg text-muted-foreground outline-none placeholder:text-muted-foreground/40"
                        />
                        {errors.subtitle && <InputError message={errors.subtitle} />}
                    </div>

                    <Separator />

                    <div className="flex min-h-0 flex-1 flex-col">
                        <Editor
                            key={editorKey}
                            initialHtml={aiHtml}
                            onSerializedChange={(value: SerializedEditorState) => setData('content', JSON.stringify(value))}
                        />
                        {errors.content && <InputError message={errors.content} className="mt-2" />}
                    </div>
                </div>

                {/* Sidebar — metadata */}
                <aside className="flex w-72 shrink-0 flex-col gap-6 border-l p-6 overflow-y-auto">
                    {organizations.length > 0 && (
                        <div className="space-y-1.5">
                            <Label htmlFor="organization_id">Publish as</Label>
                            <Select
                                value={data.organization_id || '__personal__'}
                                onValueChange={(value) => setData('organization_id', value === '__personal__' ? '' : value)}
                            >
                                <SelectTrigger id="organization_id">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__personal__">My personal account</SelectItem>
                                    {organizations.map((org) => (
                                        <SelectItem key={org.id} value={String(org.id)}>
                                            {org.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.organization_id} />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label>Banner Image</Label>
                        <BannerUpload onChange={(file) => setData('banner', file)} error={errors.banner} />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="visibility">Visibility</Label>
                        <Select value={data.visibility} onValueChange={(value) => setData('visibility', value)}>
                            <SelectTrigger id="visibility">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="public">Public</SelectItem>
                                <SelectItem value="private">Private</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.visibility} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Publish date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button type="button" variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 size-4" />
                                    {data.published_at ? (
                                        format(new Date(data.published_at), 'PPP HH:mm')
                                    ) : (
                                        <span className="text-muted-foreground">Pick a date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <DateTimePicker
                                    selected={data.published_at ? new Date(data.published_at) : undefined}
                                    onSelect={(date) => setData('published_at', date ? format(date, 'yyyy-MM-dd HH:mm:ss') : '')}
                                />
                            </PopoverContent>
                        </Popover>
                        <p className="text-xs text-muted-foreground">Leave empty to save as draft</p>
                        <InputError message={errors.published_at} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Tags</Label>
                        <TagSelector value={data.tags} onChange={(ids) => setData('tags', ids)} defaultTags={tags} />
                        <InputError message={errors.tags} />
                    </div>

                    <div className="mt-auto flex flex-col gap-2">
                        <Button type="button" variant="outline" className="w-full" onClick={() => setAiOpen(true)}>
                            <Sparkles className="mr-2 size-4" />
                            AI Draft
                        </Button>
                        <Button type="submit" disabled={processing} className="w-full">
                            {processing ? 'Publishing…' : 'Publish'}
                        </Button>
                        <Button asChild type="button" variant="outline" className="w-full">
                            <Link href={blogsIndex().url}>Cancel</Link>
                        </Button>
                    </div>
                </aside>
            </form>
        </AppLayout>
    )
}
