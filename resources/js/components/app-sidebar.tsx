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
import { User, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    Building2,
    Landmark,
    LayoutGrid,
    Package,
    School,
    Trees,
    Users,
} from 'lucide-react';
import { route } from 'ziggy-js';
import AppLogo from './app-logo';

const SUPER_ADMIN_ROLE = 'super admin';
const ALL_CAMPUS_VALUE = 'all';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
];

// `code` matches user.campus (tal, ali, ft, bin)
type CampusNavItem = NavItem & { code: string };

const campusesNavItems: CampusNavItem[] = [
    {
        title: 'Talisay',
        href: '/campus/Talisay',
        icon: School,
        code: 'tal',
    },
    {
        title: 'Alijis',
        href: '/campus/Alijis',
        icon: Building2,
        code: 'ali',
    },
    {
        title: 'Fortune Towne',
        href: '/campus/Fortune Towne',
        icon: Landmark,
        code: 'ft',
    },
    {
        title: 'Binalbagan',
        href: '/campus/Binalbagan',
        icon: Trees,
        code: 'bin',
    },
];

const manageNavItems: NavItem[] = [
    {
        title: 'Activity Logs',
        href: '/activity-logs',
        icon: Activity,
    },
    {
        title: 'Inventory',
        href: '/inventory',
        icon: Package,
    },
    {
        title: 'Users',
        href: '/users',
        icon: Users,
    },
];

type PageProps = {
    auth: {
        user: User;
    };
};

const normalize = (value?: string | null) =>
    (value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[_\s]+/g, ' ');

export function AppSidebar() {
    const { auth } = usePage<PageProps>().props;

    const isSuperAdmin = normalize(auth.user.role) === SUPER_ADMIN_ROLE;
    const userCampus = normalize(auth.user.campus);
    const hasAllCampuses = isSuperAdmin || userCampus === ALL_CAMPUS_VALUE;

    // Disable every campus that isn't the user's own
    const campusItems: NavItem[] = campusesNavItems.map(
        ({ code, ...item }) => ({
            ...item,
            disabled: !hasAllCampuses && code !== userCampus,
        }),
    );

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
                    <NavMain title="Campus" items={campusItems} />
                    {isSuperAdmin && (
                        <NavMain title="Management" items={manageNavItems} />
                    )}
                </SidebarContent>

                <SidebarFooter>
                    <NavUser />
                </SidebarFooter>
            </Sidebar>
        </>
    );
}
