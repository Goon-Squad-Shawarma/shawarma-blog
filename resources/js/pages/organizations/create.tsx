import { Head, useForm } from '@inertiajs/react'
import { FormEvent } from 'react'
import AppLayout from '@/layouts/app-layout'
import type { BreadcrumbItem } from '@/types'
import { index as organizationsIndex, create as organizationsCreate } from '@/routes/organizations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import InputError from '@/components/input-error'

interface OrganizationCreateProps {}

export default function OrganizationCreate({}: OrganizationCreateProps) {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    description: '',
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    post('/organizations')
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
