import { Head, useForm } from '@inertiajs/react'
import { ChangeEvent, FormEvent, useRef, useState } from 'react'
import AppLayout from '@/layouts/app-layout'
import type { BreadcrumbItem } from '@/types'
import { index as organizationsIndex, create as organizationsCreate } from '@/routes/organizations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import InputError from '@/components/input-error'
import { ImagePlus, Trash2 } from 'lucide-react'

export default function OrganizationCreate() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const { data, setData, post, processing, errors, reset } = useForm<{
    name: string
    description: string
    logo: File | null
  }>({
    name: '',
    description: '',
    logo: null,
  })

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setData('logo', file)
    setLogoPreview(file ? URL.createObjectURL(file) : null)
  }

  const removeLogo = () => {
    setData('logo', null)
    setLogoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    post('/organizations', {
      forceFormData: true,
      onSuccess: () => reset(),
    })
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Organizations', href: organizationsIndex().url },
    { title: 'Create Organization', href: organizationsCreate().url },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Organization" />

      <div className="max-w-2xl mx-auto space-y-8 p-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Organization</h1>
          <p className="text-muted-foreground mt-2">Build something great together</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 rounded-md">
                {logoPreview ? <AvatarImage src={logoPreview} alt="Logo preview" className="object-cover" /> : null}
                <AvatarFallback className="rounded-md text-lg">{data.name.charAt(0).toUpperCase() || '?'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <ImagePlus className="mr-2 h-4 w-4" />
                    {logoPreview ? 'Change' : 'Upload logo'}
                  </Button>
                  {logoPreview && (
                    <Button type="button" variant="ghost" size="sm" onClick={removeLogo}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">PNG, JPG or WebP. Max 5MB.</p>
              </div>
            </div>
            <InputError message={errors.logo} />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              placeholder="Your organization name"
            />
            <InputError message={errors.name} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
              placeholder="What is your organization about?"
              rows={6}
            />
            <InputError message={errors.description} />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="submit" disabled={processing}>
              {processing ? 'Creating...' : 'Create Organization'}
            </Button>
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
