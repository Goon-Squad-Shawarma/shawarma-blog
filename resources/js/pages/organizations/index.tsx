import { Head, Link, usePage } from '@inertiajs/react'
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

export default function OrganizationIndex({ organizations }: OrganizationIndexProps) {
  const { auth } = usePage().props

  return (
    <>
      <Head title="Organizations" />

      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
            <p className="text-muted-foreground mt-2">Collaborate with your team</p>
          </div>
          {auth?.user && (
            <Link href="/organizations/create">
              <Button>Create Organization</Button>
            </Link>
          )}
        </div>

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
    </>
  )
}
