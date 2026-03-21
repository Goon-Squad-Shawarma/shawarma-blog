import { Head, Link, useForm, usePage } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import type { BreadcrumbItem } from '@/types'
import { show as usersShow, followers as usersFollowers } from '@/routes/users'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
}

interface Follower {
  id: number
  first_name: string
  last_name: string
  email: string
  avatar_url?: string | null
}

interface FollowersPageProps {
  user: User
  followers: Follower[]
}

export default function Followers({ user, followers }: FollowersPageProps) {
  const { auth } = usePage().props
  const { post, delete: destroy, processing } = useForm()

  const handleFollow = (followerId: number) => {
    post(`/users/${followerId}/follow`)
  }

  const handleUnfollow = (followerId: number) => {
    destroy(`/users/${followerId}/unfollow`)
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { title: `${user.first_name} ${user.last_name}`, href: usersShow(user).url },
    { title: 'Followers', href: usersFollowers(user).url },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${user.first_name} ${user.last_name}'s Followers`} />

      <div className="p-4 space-y-8">
        {/* Header */}
        <div>
          <Link href={`/users/${user.id}`} className="text-blue-600 hover:underline">
            ← Back to {`${user.first_name} ${user.last_name}`}
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-4">{`${user.first_name} ${user.last_name}`}'s Followers</h1>
          <p className="text-muted-foreground mt-2">{followers.length} follower{followers.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Followers List */}
        {followers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {followers.map((follower: Follower) => (
              <Card key={follower.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={follower.avatar_url ?? undefined} alt={`${follower.first_name} ${follower.last_name}`} />
                      <AvatarFallback>{follower.first_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg">{`${follower.first_name} ${follower.last_name}`}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{follower.email}</p>
                </CardContent>
                <CardFooter className="gap-2">
                  <Link href={`/users/${follower.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      View Profile
                    </Button>
                  </Link>
                  {auth?.user?.id !== follower.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleFollow(follower.id)}
                      disabled={processing}
                    >
                      Follow
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">No followers yet</p>
        )}
      </div>
    </AppLayout>
  )
}
