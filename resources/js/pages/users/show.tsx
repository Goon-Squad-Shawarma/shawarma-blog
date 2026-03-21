import { Head, Link, useForm, usePage } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import type { BreadcrumbItem } from '@/types'
import { show as usersShow } from '@/routes/users'
import { show as blogsShow } from '@/routes/blogs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  avatar_url?: string | null
  background_url?: string | null
  created_at: string
}

interface Blog {
  id: number
  slug: string
  title: string
  subtitle: string
  published_at: string
  reading_time: number
  user: User
}

interface UserShowProps {
  user: User & { blogs: Blog[]; followers_count: number; following_count: number }
  isFollowing: boolean
}

export default function UserShow({ user, isFollowing }: UserShowProps) {
  const { auth } = usePage().props
  const { post, delete: destroy, processing } = useForm()

  const handleFollow = () => {
    post(`/users/${user.id}/follow`)
  }

  const handleUnfollow = () => {
    destroy(`/users/${user.id}/unfollow`)
  }

  const isCurrentUser = auth?.user?.id === user.id

  const breadcrumbs: BreadcrumbItem[] = [
    { title: `${user.first_name} ${user.last_name}`, href: usersShow(user).url },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${user.first_name} ${user.last_name}`} />

      <div className="p-4 space-y-8">
        {/* User Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatar_url ?? undefined} alt={`${user.first_name} ${user.last_name}`} />
                  <AvatarFallback>{user.first_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{`${user.first_name} ${user.last_name}`}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                  <p className="text-sm text-muted-foreground mt-2">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {!isCurrentUser && auth?.user && (
                <Button
                  onClick={isFollowing ? handleUnfollow : handleFollow}
                  variant={isFollowing ? 'outline' : 'default'}
                  disabled={processing}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* User Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Blogs Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.blogs?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Followers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Link href={`/users/${user.id}/followers`} className="hover:underline">
                  {user.followers_count || 0}
                </Link>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Following</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Link href={`/users/${user.id}/following`} className="hover:underline">
                  {user.following_count || 0}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Blogs */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Published Blogs</h2>
          {user.blogs && user.blogs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {user.blogs.map((blog: Blog) => (
                <Card key={blog.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="line-clamp-2">
                      <Link href={blogsShow(blog).url}>{blog.title}</Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {blog.subtitle}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {new Date(blog.published_at).toLocaleDateString()} • {blog.reading_time} min read
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Link href={blogsShow(blog).url} className="w-full">
                      <Button variant="ghost" size="sm" className="w-full">
                        Read More →
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">No blogs published yet</p>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
