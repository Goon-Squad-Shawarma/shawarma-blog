import { Head, useForm } from '@inertiajs/react'
import { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import InputError from '@/components/input-error'

interface Tag {
  id: number
  name: string
}

interface Blog {
  id: number
  title: string
  subtitle: string
  content: string
  banner_url: string | null
  visibility: 'public' | 'private'
  publish_date: string
  tags: Tag[]
}

interface AllTags {
  id: number
  name: string
}

interface BlogEditProps {
  blog: Blog
  tags: AllTags[]
}

export default function BlogEdit({ blog, tags }: BlogEditProps) {
  const selectedTagIds = blog.tags.map((tag: Tag) => tag.id)

  const { data, setData, patch, processing, errors } = useForm({
    title: blog.title,
    subtitle: blog.subtitle,
    content: blog.content,
    banner_url: blog.banner_url,
    visibility: blog.visibility,
    publish_date: blog.publish_date,
    tags: selectedTagIds,
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    patch(`/blogs/${blog.id}`)
  }

  const handleTagToggle = (tagId: number) => {
    setData('tags', data.tags.includes(tagId)
      ? data.tags.filter((id: number) => id !== tagId)
      : [...data.tags, tagId]
    )
  }

  return (
    <>
      <Head title={`Edit "${blog.title}"`} />

      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Blog</h1>
          <p className="text-muted-foreground mt-2">Update your blog post</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={data.title}
              onChange={(e) => setData('title', e.target.value)}
              placeholder="Blog title"
            />
            <InputError message={errors.title} />
          </div>

          {/* Subtitle */}
          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={data.subtitle}
              onChange={(e) => setData('subtitle', e.target.value)}
              placeholder="Brief summary"
            />
            <InputError message={errors.subtitle} />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={data.content}
              onChange={(e) => setData('content', e.target.value)}
              placeholder="Write your blog content..."
              rows={10}
            />
            <InputError message={errors.content} />
          </div>

          {/* Banner URL */}
          <div className="space-y-2">
            <Label htmlFor="banner">Banner Image URL</Label>
            <Input
              id="banner"
              value={data.banner_url || ''}
              onChange={(e) => setData('banner_url', e.target.value)}
              placeholder="https://..."
            />
            <InputError message={errors.banner_url} />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select value={data.visibility} onValueChange={(value) => setData('visibility', value as any)}>
              <SelectTrigger id="visibility">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
            <InputError message={errors.visibility} />
          </div>

          {/* Publish Date */}
          <div className="space-y-2">
            <Label htmlFor="publish_date">Publish Date</Label>
            <Input
              id="publish_date"
              type="datetime-local"
              value={data.publish_date}
              onChange={(e) => setData('publish_date', e.target.value)}
            />
            <InputError message={errors.publish_date} />
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label>Tags</Label>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-3">
                  {tags.map((tag: AllTags) => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag.id}`}
                        checked={data.tags.includes(tag.id)}
                        onCheckedChange={() => handleTagToggle(tag.id)}
                      />
                      <Label htmlFor={`tag-${tag.id}`} className="cursor-pointer">
                        {tag.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <InputError message={errors.tags} />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="submit" disabled={processing}>
              {processing ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
