import { Head, Link, useForm } from '@inertiajs/react'
import { FormEvent } from 'react'
import { SerializedEditorState } from 'lexical'
import AppLayout from '@/layouts/app-layout'
import type { BreadcrumbItem } from '@/types'
import { index as blogsIndex, show as blogsShow, edit as blogsEdit, update as blogsUpdate } from '@/routes/blogs'
import { Editor } from '@/components/blocks/editor-00/editor'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import InputError from '@/components/input-error'
import TagSelector from '@/components/tag-selector'
import DateTimePicker from '@/components/calendar'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import BannerUpload from '@/components/file-upload'

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

interface Blog {
    id: number
    title: string
    slug: string
    subtitle: string
    content: string
    banner_url: string | null
    visibility: 'public' | 'private'
    published_at: string | null
    organization_id: number | null
    tags: Tag[]
}

interface BlogEditProps {
    blog: Blog
    tags: Tag[]
    organizations: Organization[]
}

export default function BlogEdit({ blog, tags, organizations }: BlogEditProps) {
    const selectedTagIds = blog.tags.map((tag: Tag) => tag.id)

    let initialEditorState: SerializedEditorState | undefined
    try {
        initialEditorState = JSON.parse(blog.content)
    } catch {
        initialEditorState = undefined
    }

    const { data, setData, patch, processing, errors } = useForm<{
        title: string
        subtitle: string
        content: string
        banner: File | null
        visibility: 'public' | 'private'
        published_at: string
        organization_id: string
        tags: number[]
    }>({
        title: blog.title,
        subtitle: blog.subtitle,
        content: blog.content,
        banner: null,
        visibility: blog.visibility,
        published_at: blog.published_at ?? '',
        organization_id: blog.organization_id ? String(blog.organization_id) : '',
        tags: selectedTagIds,
    })

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        patch(blogsUpdate({ slug: blog.slug }).url)
    }

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Blogs', href: blogsIndex().url },
        { title: blog.title, href: blogsShow(blog).url },
        { title: 'Edit', href: blogsEdit(blog).url },
    ]

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit "${blog.title}"`} />

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
                            editorSerializedState={initialEditorState}
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
                        <BannerUpload
                            onChange={(file) => setData('banner', file)}
                            initialUrl={blog.banner_url}
                            error={errors.banner}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="visibility">Visibility</Label>
                        <Select value={data.visibility} onValueChange={(value) => setData('visibility', value as 'public' | 'private')}>
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
                        <InputError message={errors.published_at} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Tags</Label>
                        <TagSelector value={data.tags} onChange={(ids) => setData('tags', ids)} defaultTags={tags} />
                        <InputError message={errors.tags} />
                    </div>

                    <div className="mt-auto flex flex-col gap-2">
                        <Button type="submit" disabled={processing} className="w-full">
                            {processing ? 'Saving…' : 'Save Changes'}
                        </Button>
                        <Button asChild type="button" variant="outline" className="w-full">
                            <Link href={blogsShow(blog).url}>Cancel</Link>
                        </Button>
                    </div>
                </aside>
            </form>
        </AppLayout>
    )
}
