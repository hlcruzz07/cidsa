import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    BarChart2,
    Building2,
    FolderArchiveIcon,
    Landmark,
    LayoutGrid,
    LockIcon,
    LogsIcon,
    School,
    Trees,
    Users,
} from 'lucide-react';
import AppLogo from './app-logo';
const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];
const campusesNavItems: NavItem[] = [
    {
        title: 'Talisay',
        href: '/campus/talisay',
        icon: School,
    },
    {
        title: 'Alijis',
        href: '/campus/alijis',
        icon: Building2,
    },
    {
        title: 'Binalbagan',
        href: '/campus/binalbagan',
        icon: Trees,
    },
    {
        title: 'Fortune Towne',
        href: '/campus/fortune-towne',
        icon: Landmark,
    },
];

const manageNavItems: NavItem[] = [
    {
        title: 'Academic Directory',
        href: dashboard(),
        icon: FolderArchiveIcon,
    },
    {
        title: 'Reports',
        href: dashboard(),
        icon: BarChart2,
    },
    {
        title: 'Activity Logs',
        href: dashboard(),
        icon: LogsIcon,
    },
    {
        title: 'Users',
        href: dashboard(),
        icon: Users,
    },
    {
        title: 'Roles & Permission',
        href: dashboard(),
        icon: LockIcon,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain title="Main" items={mainNavItems} />
                <NavMain title="Campus" items={campusesNavItems} />
                {/* <NavMain title="Management" items={manageNavItems} /> */}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
