import { BarChart3, Bookmark, FileText, MessageSquare, Users } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { usePage } from '@inertiajs/react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from '@/components/ui/sidebar';
import type { NavItem, SharedData } from '@/types';
import { OrgSwitcher } from './org-switcher';
import { useActiveOrgId } from '@/hooks/use-active-org';

const publicNavItems: NavItem[] = [
    {
        title: 'Blogs',
        href: '/blogs',
        icon: FileText,
    },
    {
        title: 'Community',
        href: '/forums',
        icon: MessageSquare,
    },
];

const personalNavItems: NavItem[] = [
    {
        title: 'Bookmarks',
        href: '/bookmarks',
        icon: Bookmark,
    },
    {
        title: 'My Network',
        href: '/network',
        icon: Users,
    },
    {
        title: 'Analytics',
        href: '/my/analytics',
        icon: BarChart3,
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const page = usePage<SharedData>();
    const auth = page.props.auth;
    const activeOrgId = useActiveOrgId();

    const orgNavItems: NavItem[] = activeOrgId
        ? [
              {
                  title: 'Analytics',
                  href: `/organizations/${activeOrgId}/analytics`,
                  icon: BarChart3,
              },
          ]
        : [];

    const items = auth?.user
        ? activeOrgId
            ? [...publicNavItems, ...orgNavItems]
            : [...publicNavItems, ...personalNavItems]
        : publicNavItems;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <OrgSwitcher />
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={items} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

