import DashboardWidget from '@/components/Dashboard/DasboardWidgets';
import { DashboardChart } from '@/components/Dashboard/DashboardChart';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

type CampusCountProps = {
    campusCounts: {
        talCounts: number;
        aliCounts: number;
        ftCounts: number;
        binCounts: number;
    };
};

export default function Dashboard() {
    const { campusCounts } = usePage<CampusCountProps>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <DashboardWidget
                        type="tal"
                        count={campusCounts.talCounts}
                    />
                    <DashboardWidget
                        type="ali"
                        count={campusCounts.aliCounts}
                    />
                    <DashboardWidget type="ft" count={campusCounts.ftCounts} />
                    <DashboardWidget
                        type="bin"
                        count={campusCounts.binCounts}
                    />
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <DashboardChart />
                </div>
            </div>
        </AppLayout>
    );
}
