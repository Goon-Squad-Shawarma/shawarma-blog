import { Head, Link, useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Trash2 } from 'lucide-react'
import { usePage } from '@inertiajs/react'

interface User {
  id: number
  name: string
  email: string
}

interface Member {
  id: number
  name: string
  role: 'admin' | 'editor' | 'author'
}

interface Blog {
  id: number
  title: string
  subtitle: string
  published_at: string
  reading_time: number
}

interface Organization {
  id: number
  name: string
  description: string
  owner: User
  blogs: Blog[]
  members: Member[]
}

interface OrganizationShowProps {
  organization: Organization
  canEdit: boolean
}

export default function OrganizationShow({ organization, canEdit }: OrganizationShowProps) {
  const { auth } = usePage().props
  const { delete: destroy } = useForm()

  const handleRemoveMember = (memberId: number) => {
    if (confirm('Remove this member?')) {
      destroy(`/organizations/${organization.id}/members/${memberId}`)
    }
  }

  return (
    <>
      <Head title={organization.name} />

      <div className="space-y-8">
        {/* Organization Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl">{organization.name}</CardTitle>
                <CardDescription className="mt-2 text-base">{organization.description}</CardDescription>
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <Link href={`/organizations/${organization.id}/edit`}>
                    <Button size="sm">Edit</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/users/${organization.owner.id}`}>
                <p className="font-semibold hover:underline">{organization.owner.name}</p>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organization.members?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Blogs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organization.blogs?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Members */}
        {canEdit && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Members</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {organization.members?.map((member: Member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <Badge variant="outline">{member.role}</Badge>
                        </div>
                      </div>
                      {organization.owner.id !== member.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Blogs */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Organization Blogs</h2>
          {organization.blogs && organization.blogs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {organization.blogs.map((blog: Blog) => (
                <Card key={blog.id}>
                  <CardHeader>
                    <CardTitle className="line-clamp-2">
                      <Link href={`/blogs/${blog.id}`}>{blog.title}</Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">{blog.subtitle}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {new Date(blog.published_at).toLocaleDateString()} • {blog.reading_time} min read
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/blogs/${blog.id}`} className="w-full">
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
    </>
  )
}
