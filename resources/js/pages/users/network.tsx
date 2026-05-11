import AppLayout from '@/layouts/app-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Head, Link } from '@inertiajs/react';
import { show as usersShow } from '@/routes/users';
import type { BreadcrumbItem } from '@/types';
import { Users } from 'lucide-react';

interface Person {
    id: number;
    first_name: string;
    last_name: string;
    avatar_url?: string | null;
    bio?: string | null;
}

interface PaginatedPeople {
    data: Person[];
    current_page: number;
    last_page: number;
}

interface NetworkProps {
    followers: PaginatedPeople;
    following: PaginatedPeople;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'My Network', href: '/network' }];

function PersonCard({ person }: { person: Person }) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-3">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={person.avatar_url ?? undefined} alt={person.first_name} />
                    <AvatarFallback>
                        {person.first_name.charAt(0)}
                        {person.last_name.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                        <Link href={usersShow({ user: person.id }).url} className="hover:underline">
                            {person.first_name} {person.last_name}
                        </Link>
                    </CardTitle>
                </div>
            </CardHeader>
            {person.bio && (
                <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{person.bio}</p>
                </CardContent>
            )}
            <CardContent className="pt-0">
                <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={usersShow({ user: person.id }).url}>View profile</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

function PeopleGrid({ data, emptyTitle, emptyDescription }: { data: Person[]; emptyTitle: string; emptyDescription: string }) {
    if (data.length === 0) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <Users />
                    </EmptyMedia>
                    <EmptyTitle>{emptyTitle}</EmptyTitle>
                    <EmptyDescription>{emptyDescription}</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                    <Button asChild>
                        <Link href="/blogs">Discover writers</Link>
                    </Button>
                </EmptyContent>
            </Empty>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((person) => (
                <PersonCard key={person.id} person={person} />
            ))}
        </div>
    );
}

export default function NetworkPage({ followers, following }: NetworkProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Network" />
            <div className="p-4 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">My Network</h1>
                    <p className="text-sm text-muted-foreground">People who follow you and writers you follow.</p>
                </div>

                <Tabs defaultValue="followers" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="followers">Followers ({followers.data.length})</TabsTrigger>
                        <TabsTrigger value="following">Following ({following.data.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="followers">
                        <PeopleGrid
                            data={followers.data}
                            emptyTitle="No followers yet"
                            emptyDescription="Share your work to grow your audience."
                        />
                    </TabsContent>

                    <TabsContent value="following">
                        <PeopleGrid
                            data={following.data}
                            emptyTitle="Not following anyone yet"
                            emptyDescription="Follow writers whose work inspires you."
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
