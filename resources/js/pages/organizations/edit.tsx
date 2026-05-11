import { Head, useForm } from '@inertiajs/react'
import { ChangeEvent, FormEvent, useRef, useState } from 'react'
import AppLayout from '@/layouts/app-layout'
import type { BreadcrumbItem } from '@/types'
import { index as organizationsIndex, show as organizationsShow, edit as organizationsEdit } from '@/routes/organizations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import InputError from '@/components/input-error'
import { ImagePlus, Trash2 } from 'lucide-react'

interface Organization {
  id: number
  name: string
  description: string
  logo_url: string | null
}

interface OrganizationEditProps {
  organization: Organization
}

export default function OrganizationEdit({ organization }: OrganizationEditProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(organization.logo_url)

  const { data, setData, post, processing, errors } = useForm<{
    _method: string
    name: string
    description: string
    logo: File | null
  }>({
    _method: 'patch',
    name: organization.name,
    description: organization.description ?? '',
    logo: null,
  })

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setData('logo', file)
    if (file) {
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const removeLogo = () => {
    setData('logo', null)
    setLogoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    post(`/organizations/${organization.id}`, {
      forceFormData: true,
    })
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Organizations', href: organizationsIndex().url },
    { title: organization.name, href: organizationsShow(organization).url },
    { title: 'Edit', href: organizationsEdit(organization).url },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit ${organization.name}`} />

      <div className="max-w-2xl mx-auto space-y-8 p-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Organization</h1>
          <p className="text-muted-foreground mt-2">Update your organization</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 rounded-md">
                {logoPreview ? <AvatarImage src={logoPreview} alt={organization.name} className="object-cover" /> : null}
                <AvatarFallback className="rounded-md text-lg">{organization.name.charAt(0).toUpperCase() || '?'}</AvatarFallback>
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
              placeholder="Organization name"
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
              placeholder="Organization description"
              rows={6}
            />
            <InputError message={errors.description} />
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
    </AppLayout>
  )
}
