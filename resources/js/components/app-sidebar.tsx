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
    Building2,
    FolderUpIcon,
    Landmark,
    LayoutGrid,
    School,
    Trees,
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
        title: 'Fortune Towne',
        href: '/campus/fortune-towne',
        icon: Landmark,
    },
    {
        title: 'Binalbagan',
        href: '/campus/binalbagan',
        icon: Trees,
    },
];

const manageNavItems: NavItem[] = [
    {
        title: 'Export History',
        href: '/export-history',
        icon: FolderUpIcon,
    },
    // {
    //     title: 'Reports',
    //     href: dashboard(),
    //     icon: BarChart2,
    // },
    // {
    //     title: 'Activity Logs',
    //     href: dashboard(),
    //     icon: LogsIcon,
    // },
    // {
    //     title: 'Users',
    //     href: dashboard(),
    //     icon: Users,
    // },
    // {
    //     title: 'Roles & Permission',
    //     href: dashboard(),
    //     icon: LockIcon,
    // },
];

export function AppSidebar() {
    // Modal

    return (
        <>
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
                    <NavMain title="Management" items={manageNavItems} />
                </SidebarContent>

                <SidebarFooter>
                    <NavUser />
                </SidebarFooter>
            </Sidebar>
        </>
    );
}
