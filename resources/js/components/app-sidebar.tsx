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
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Building2, Landmark, LayoutGrid, School, Trees } from 'lucide-react';
import { route } from 'ziggy-js';
import AppLogo from './app-logo';
const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
];
const campusesNavItems: NavItem[] = [
    {
        title: 'Talisay',
        href: '/campus/Talisay',
        icon: School,
    },
    {
        title: 'Alijis',
        href: '/campus/Alijis',
        icon: Building2,
    },
    {
        title: 'Fortune Towne',
        href: '/campus/Fortune Towne',
        icon: Landmark,
    },
    {
        title: 'Binalbagan',
        href: '/campus/Binalbagan',
        icon: Trees,
    },
];

const manageNavItems: NavItem[] = [
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
                                <Link href={route('dashboard')} prefetch>
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
        </>
    );
}
