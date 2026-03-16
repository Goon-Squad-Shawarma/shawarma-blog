import { Head, Link, usePage } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import type { BreadcrumbItem } from '@/types'
import { index as organizationsIndex } from '@/routes/organizations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Organization {
  id: number
  name: string
  description: string
  created_at: string
}

interface OrganizationIndexProps {
  organizations: Organization[]
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Organizations', href: organizationsIndex().url },
]

export default function OrganizationIndex({ organizations }: OrganizationIndexProps) {
  const { auth } = usePage().props

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Organizations" />

      <div className="p-4 space-y-8">
        {/* Organizations Grid */}
        {organizations.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org: Organization) => (
              <Card key={org.id} className="hover:shadow-lg transition-shadow flex flex-col">
                <CardHeader>
                  <CardTitle className="hover:underline">
                    <Link href={`/organizations/${org.id}`}>{org.name}</Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {org.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(org.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href={`/organizations/${org.id}`} className="w-full">
                    <Button variant="ghost" size="sm" className="w-full">
                      View Organization →
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No organizations yet</p>
            {auth?.user && (
              <Link href="/organizations/create">
                <Button>Create the first organization</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
