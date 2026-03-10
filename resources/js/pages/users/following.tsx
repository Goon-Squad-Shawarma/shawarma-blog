import { Head, Link } from '@inertiajs/react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePage } from '@inertiajs/react'

interface User {
  id: number
  name: string
  email: string
}

interface FollowableUser {
  id: number
  name: string
  email: string
}

interface FollowableOrganization {
  id: number
  name: string
  description: string
}

interface FollowingItem {
  following_user?: FollowableUser
  following_organization?: FollowableOrganization
}

interface FollowingPageProps {
  user: User
  following: FollowingItem[]
}

export default function Following({ user, following }: FollowingPageProps) {
  const { auth } = usePage().props

  const users = following.filter((item) => item.following_user)
  const organizations = following.filter((item) => item.following_organization)

  return (
    <>
      <Head title={`${user.name}'s Following`} />

      <div className="space-y-8">
        {/* Header */}
        <div>
          <Link href={`/users/${user.id}`} className="text-blue-600 hover:underline">
            ← Back to {user.name}
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-4">Following</h1>
          <p className="text-muted-foreground mt-2">{following.length} follow{following.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Users Section */}
        {users.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">People</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {users.map((item: FollowingItem) => {
                const followUser = item.following_user as FollowableUser
                return (
                  <Card key={`user-${followUser.id}`}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{followUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-lg">{followUser.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{followUser.email}</p>
                    </CardContent>
                    <CardFooter>
                      <Link href={`/users/${followUser.id}`} className="w-full">
                        <Button variant="outline" size="sm" className="w-full">
                          View Profile
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Organizations Section */}
        {organizations.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Organizations</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {organizations.map((item: FollowingItem) => {
                const followOrg = item.following_organization as FollowableOrganization
                return (
                  <Card key={`org-${followOrg.id}`}>
                    <CardHeader>
                      <CardTitle className="text-lg">{followOrg.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">{followOrg.description}</p>
                    </CardContent>
                    <CardFooter>
                      <Link href={`/organizations/${followOrg.id}`} className="w-full">
                        <Button variant="outline" size="sm" className="w-full">
                          View Organization
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {following.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Not following anyone yet</p>
        )}
      </div>
    </>
  )
}
