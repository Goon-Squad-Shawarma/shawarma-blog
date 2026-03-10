import { Head, useForm } from '@inertiajs/react'
import { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import InputError from '@/components/input-error'

interface Organization {
  id: number
  name: string
  description: string
}

interface OrganizationEditProps {
  organization: Organization
}

export default function OrganizationEdit({ organization }: OrganizationEditProps) {
  const { data, setData, patch, processing, errors } = useForm({
    name: organization.name,
    description: organization.description,
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    patch(`/organizations/${organization.id}`)
  }

  return (
    <>
      <Head title={`Edit ${organization.name}`} />

      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Organization</h1>
          <p className="text-muted-foreground mt-2">Update your organization</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
    </>
  )
}
