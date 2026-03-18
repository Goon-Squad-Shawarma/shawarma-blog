import { Head, Link, router, useForm, usePage } from '@inertiajs/react'
import { FormEvent, useState } from 'react'
import AppLayout from '@/layouts/app-layout'
import type { BreadcrumbItem } from '@/types'
import {
    index as organizationsIndex,
    show as organizationsShow,
    edit as organizationsEdit,
    destroy as organizationsDestroy,
    invite as organizationsInvite,
    invitationCancel as organizationsInvitationCancel,
    invitationResend as organizationsInvitationResend,
    removeMember as organizationsRemoveMember,
    updateMemberRole as organizationsUpdateMemberRole,
    follow as organizationsFollow,
    unfollow as organizationsUnfollow,
} from '@/routes/organizations'
import { show as blogsShow } from '@/routes/blogs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Trash2, UserPlus, Users, BookOpen, Crown, Bell, BellOff } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface User {
    id: number
    name: string
    email: string
}

interface Member {
    id: number
    name: string
    email: string
    pivot: {
        role: 'admin' | 'editor' | 'author'
    }
}

interface Tag {
    id: number
    name: string
    slug: string
}

interface Blog {
    id: number
    slug: string
    title: string
    subtitle: string
    published_at: string | null
    reading_time: number
    tags: Tag[]
}

interface Organization {
    id: number
    name: string
    slug: string
    description: string
    logo_url: string | null
    owner: User
    blogs: Blog[]
    users: Member[]
}

interface Invitation {
    id: number
    email: string
    role: string | null
    created_at: string
    expires_at: string | null
}

interface OrganizationShowProps {
    organization: Organization
    isMember: boolean
    userRole: string | null
    isFollowing: boolean
    followersCount: number
    canUpdate: boolean
    canDelete: boolean
    canAddMembers: boolean
    pendingInvitations: Invitation[]
}

export default function OrganizationShow({
    organization,
    isFollowing: initialIsFollowing,
    followersCount: initialFollowersCount,
    canUpdate,
    canDelete,
    canAddMembers,
    pendingInvitations,
}: OrganizationShowProps) {
    const { auth } = usePage().props as { auth: { user: User | null } }

    const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
    const [followersCount, setFollowersCount] = useState(initialFollowersCount)
    const [followProcessing, setFollowProcessing] = useState(false)

    const {
        data: inviteData,
        setData: setInviteData,
        post: sendInvite,
        processing: sendingInvite,
        reset: resetInvite,
        errors: inviteErrors,
    } = useForm({ email: '', role: 'author' as 'admin' | 'editor' | 'author' })

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Organizations', href: organizationsIndex().url },
        { title: organization.name, href: organizationsShow(organization).url },
    ]

    const handleSendInvite = (e: FormEvent) => {
        e.preventDefault()
        sendInvite(organizationsInvite(organization).url, {
            onSuccess: () => resetInvite(),
        })
    }

    const handleCancelInvitation = (invitationId: number) => {
        router.delete(organizationsInvitationCancel({ organization: organization.id, invitation: invitationId }).url)
    }

    const handleResendInvitation = (invitationId: number) => {
        router.post(organizationsInvitationResend({ organization: organization.id, invitation: invitationId }).url, {})
    }

    const handleRemoveMember = (member: Member) => {
        router.delete(organizationsRemoveMember({ organization: organization.id, user: member.id }).url)
    }

    const handleRoleChange = (member: Member, role: string) => {
        router.patch(organizationsUpdateMemberRole({ organization: organization.id, user: member.id }).url, {
            user_id: member.id,
            role,
        })
    }

    const handleFollow = () => {
        if (followProcessing) return
        setFollowProcessing(true)

        if (isFollowing) {
            router.delete(organizationsUnfollow(organization).url, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsFollowing(false)
                    setFollowersCount((c) => c - 1)
                },
                onFinish: () => setFollowProcessing(false),
            })
        } else {
            router.post(
                organizationsFollow(organization).url,
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setIsFollowing(true)
                        setFollowersCount((c) => c + 1)
                    },
                    onFinish: () => setFollowProcessing(false),
                },
            )
        }
    }

    const handleDeleteOrg = () => {
        router.delete(organizationsDestroy(organization).url)
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={organization.name} />

            <div className="p-4 space-y-8">
                {/* Organization Header */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <CardTitle className="text-3xl">{organization.name}</CardTitle>
                                {organization.description && (
                                    <CardDescription className="mt-2 text-base">{organization.description}</CardDescription>
                                )}
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2">
                                {auth?.user && (
                                    <Button
                                        variant={isFollowing ? 'outline' : 'default'}
                                        size="sm"
                                        onClick={handleFollow}
                                        disabled={followProcessing}
                                    >
                                        {isFollowing ? (
                                            <>
                                                <BellOff className="mr-2 h-4 w-4" />
                                                Unfollow
                                            </>
                                        ) : (
                                            <>
                                                <Bell className="mr-2 h-4 w-4" />
                                                Follow
                                            </>
                                        )}
                                    </Button>
                                )}
                                {canUpdate && (
                                    <Link href={organizationsEdit(organization).url}>
                                        <Button size="sm" variant="outline">
                                            Edit
                                        </Button>
                                    </Link>
                                )}
                                {canDelete && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="sm" variant="destructive">
                                                Delete
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete organization?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete <strong>{organization.name}</strong> and all its data. This cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={handleDeleteOrg}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                                <Crown className="h-3.5 w-3.5" />
                                Owner
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Link href={`/users/${organization.owner.id}`} className="font-semibold hover:underline">
                                {organization.owner.name}
                            </Link>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5" />
                                Members
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{organization.users?.length ?? 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                                <BookOpen className="h-3.5 w-3.5" />
                                Blogs
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{organization.blogs?.length ?? 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                                <Bell className="h-3.5 w-3.5" />
                                Followers
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{followersCount}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Members */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Members</h2>
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            {organization.users?.length > 0 ? (
                                <div className="space-y-3">
                                    {organization.users.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{member.name}</p>
                                                    <p className="text-xs text-muted-foreground">{member.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {canAddMembers && organization.owner.id !== member.id ? (
                                                    <Select value={member.pivot.role} onValueChange={(role) => handleRoleChange(member, role)}>
                                                        <SelectTrigger className="w-28 h-7 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="admin">Admin</SelectItem>
                                                            <SelectItem value="editor">Editor</SelectItem>
                                                            <SelectItem value="author">Author</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Badge variant="outline" className="capitalize">
                                                        {member.pivot.role}
                                                    </Badge>
                                                )}
                                                {canAddMembers && organization.owner.id !== member.id && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Remove member?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Remove <strong>{member.name}</strong> from this organization?
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleRemoveMember(member)}
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                >
                                                                    Remove
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm text-center py-4">No members yet.</p>
                            )}

                            {canAddMembers && (
                                <>
                                    <Separator />
                                    <form onSubmit={handleSendInvite} className="space-y-3">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <UserPlus className="h-4 w-4" />
                                            Invite Member
                                        </h3>
                                        <div className="flex gap-2 items-end">
                                            <div className="flex-1 space-y-1">
                                                <Label htmlFor="invite-email">Email address</Label>
                                                <Input
                                                    id="invite-email"
                                                    type="email"
                                                    value={inviteData.email}
                                                    onChange={(e) => setInviteData('email', e.target.value)}
                                                    placeholder="colleague@example.com"
                                                    autoComplete="off"
                                                />
                                                {inviteErrors.email && (
                                                    <p className="text-xs text-destructive mt-1">{inviteErrors.email}</p>
                                                )}
                                            </div>
                                            <div className="space-y-1 w-32">
                                                <Label htmlFor="invite-role">Role</Label>
                                                <Select
                                                    value={inviteData.role}
                                                    onValueChange={(v) => setInviteData('role', v as 'admin' | 'editor' | 'author')}
                                                >
                                                    <SelectTrigger id="invite-role">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                        <SelectItem value="editor">Editor</SelectItem>
                                                        <SelectItem value="author">Author</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button type="submit" disabled={sendingInvite || !inviteData.email}>
                                                {sendingInvite ? 'Sending…' : 'Send Invite'}
                                            </Button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Pending Invitations */}
                {canAddMembers && pendingInvitations.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Pending Invitations</h2>
                        <Card>
                            <CardContent className="pt-6 space-y-3">
                                {pendingInvitations.map((invitation) => (
                                    <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium text-sm">{invitation.email}</p>
                                            <p className="text-xs text-muted-foreground capitalize">
                                                Role: {invitation.role ?? 'author'} · Sent{' '}
                                                {new Date(invitation.created_at).toLocaleDateString()}
                                                {invitation.expires_at &&
                                                    ` · Expires ${new Date(invitation.expires_at).toLocaleDateString()}`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline" onClick={() => handleResendInvitation(invitation.id)}>
                                                Resend
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                                                        Cancel
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Cancel invitation?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Cancel the invitation sent to <strong>{invitation.email}</strong>? They will no
                                                            longer be able to use the invitation link.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Keep</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleCancelInvitation(invitation.id)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            Cancel Invitation
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Blogs */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Organization Blogs</h2>
                    {organization.blogs && organization.blogs.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {organization.blogs.map((blog) => (
                                <Card key={blog.id}>
                                    <CardHeader>
                                        <CardTitle className="line-clamp-2">
                                            <Link href={blogsShow(blog).url} className="hover:underline">
                                                {blog.title}
                                            </Link>
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2">{blog.subtitle}</CardDescription>
                                    </CardHeader>
                                    {blog.tags && blog.tags.length > 0 && (
                                        <CardContent className="pb-2">
                                            <div className="flex flex-wrap gap-1">
                                                {blog.tags.map((tag) => (
                                                    <Badge key={tag.id} variant="secondary" className="text-xs">
                                                        {tag.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </CardContent>
                                    )}
                                    <CardFooter className="flex items-center justify-between">
                                        <p className="text-xs text-muted-foreground">
                                            {blog.published_at ? new Date(blog.published_at).toLocaleDateString() : 'Draft'} · {blog.reading_time} min read
                                        </p>
                                        <Link href={blogsShow(blog).url}>
                                            <Button variant="ghost" size="sm">
                                                Read →
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
