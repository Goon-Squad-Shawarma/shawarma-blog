import { Link, router, usePage } from '@inertiajs/react';
import { Building2, ChevronsUpDown, Plus, User } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { create as orgsCreate, show as orgsShow } from '@/routes/organizations';
import type { Organization } from '@/types/auth';
import { clearActiveOrg, setActiveOrg, useActiveOrgId } from '@/hooks/use-active-org';

export function OrgSwitcher() {
    const { auth } = usePage().props;
    const organizations: Organization[] = auth.organizations ?? [];
    const activeOrgId = useActiveOrgId();
    const activeOrg = organizations.find((o) => o.id === activeOrgId) ?? null;

    const handlePersonal = (e: React.MouseEvent) => {
        e.preventDefault();
        clearActiveOrg();
        router.visit('/bookmarks');
    };

    const handlePickOrg = (e: React.MouseEvent, org: Organization) => {
        e.preventDefault();
        setActiveOrg(org.id);
        router.visit(orgsShow(org.id).url);
    };

    if (organizations.length === 0) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton size="lg" asChild>
                        <Link href={orgsCreate().url}>
                            <div className="flex aspect-square size-8 items-center justify-center rounded-md border border-dashed border-sidebar-primary/40 text-sidebar-primary/60">
                                <Plus size={16} />
                            </div>
                            <div className="ml-1 grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold text-muted-foreground">New Organization</span>
                            </div>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        );
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-foreground">
                                {activeOrg?.logo_url ? (
                                    <img src={activeOrg.logo_url} alt={activeOrg.name} className="h-full w-full object-cover" />
                                ) : (
                                    <Building2 size={16} />
                                )}
                            </div>
                            <div className="ml-1 grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{activeOrg?.name ?? 'Personal'}</span>
                                {!activeOrg && (
                                    <span className="truncate text-xs text-muted-foreground">Switch organization</span>
                                )}
                            </div>
                            <ChevronsUpDown className="ms-auto size-4 text-muted-foreground/60" aria-hidden="true" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-52 rounded-md"
                        align="start"
                        side="bottom"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">
                            Account
                        </DropdownMenuLabel>
                        <DropdownMenuItem asChild className="gap-2 p-2">
                            <Link href="/bookmarks" onClick={handlePersonal}>
                                <div className="flex size-6 items-center justify-center rounded-md bg-muted text-foreground">
                                    <User size={12} />
                                </div>
                                <span className="font-medium">Personal</span>
                                {!activeOrg && <div className="ml-auto size-2 rounded-full bg-primary" />}
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">
                            Organizations
                        </DropdownMenuLabel>
                        {organizations.map((org) => (
                            <DropdownMenuItem key={org.id} asChild className="gap-2 p-2">
                                <Link href={orgsShow(org.id).url} onClick={(e) => handlePickOrg(e, org)}>
                                    <div className="flex size-6 items-center justify-center overflow-hidden rounded-md bg-muted text-foreground">
                                        {org.logo_url ? (
                                            <img src={org.logo_url} alt={org.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <Building2 size={12} />
                                        )}
                                    </div>
                                    <span className="font-medium">{org.name}</span>
                                    {org.id === activeOrg?.id && (
                                        <div className="ml-auto size-2 rounded-full bg-primary" />
                                    )}
                                </Link>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="gap-2 p-2">
                            <Link href={orgsCreate().url}>
                                <div className="flex size-6 items-center justify-center rounded-md border border-dashed">
                                    <Plus size={12} />
                                </div>
                                <span className="font-medium text-muted-foreground">Create organization</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
