import { Head, Link, useForm } from '@inertiajs/react'
import { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import InputError from '@/components/input-error'

interface Tag {
  id: number
  name: string
}

interface BlogCreateProps {
  tags: Tag[]
}

export default function BlogCreate({ tags }: BlogCreateProps) {
  const { data, setData, post, processing, errors } = useForm({
    title: '',
    subtitle: '',
    content: '',
    banner_url: '',
    visibility: 'public',
    published_at: '',
    tags: [] as number[],
  })

  const handleTagToggle = (tagId: number) => {
    setData('tags', 
      data.tags.includes(tagId)
        ? data.tags.filter(id => id !== tagId)
        : [...data.tags, tagId]
    )
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    post('/blogs')
  }

  return (
    <>
      <Head title="Create Blog" />

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Blog Post</h1>
          <p className="text-muted-foreground mt-2">Share your thoughts with the community</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>New Blog</CardTitle>
            <CardDescription>Fill in the details below to create a new blog post</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  placeholder="Enter blog title"
                  className={errors.title ? 'border-red-500' : ''}
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
                  placeholder="Brief description"
                />
                <InputError message={errors.subtitle} />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={data.content}
                  onChange={(e) => setData('content', e.target.value)}
                  placeholder="Write your blog content here..."
                  rows={12}
                  className={errors.content ? 'border-red-500' : ''}
                />
                <InputError message={errors.content} />
              </div>

              {/* Banner URL */}
              <div className="space-y-2">
                <Label htmlFor="banner_url">Banner Image URL</Label>
                <Input
                  id="banner_url"
                  type="url"
                  value={data.banner_url}
                  onChange={(e) => setData('banner_url', e.target.value)}
                  placeholder="https://..."
                />
                <InputError message={errors.banner_url} />
              </div>

              {/* Visibility */}
              <div className="space-y-2">
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

              {/* Published At */}
              <div className="space-y-2">
                <Label htmlFor="published_at">Publish Date (leave empty to save as draft)</Label>
                <Input
                  id="published_at"
                  type="datetime-local"
                  value={data.published_at}
                  onChange={(e) => setData('published_at', e.target.value)}
                />
                <InputError message={errors.published_at} />
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <Label>Tags</Label>
                <div className="grid grid-cols-2 gap-3">
                  {tags.map((tag: Tag) => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag.id}`}
                        checked={data.tags.includes(tag.id)}
                        onCheckedChange={() => handleTagToggle(tag.id)}
                      />
                      <label
                        htmlFor={`tag-${tag.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {tag.name}
                      </label>
                    </div>
                  ))}
                </div>
                <InputError message={errors.tags} />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={processing}>
                  {processing ? 'Creating...' : 'Create Blog'}
                </Button>
                <Link href="/blogs">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
