import DashboardWidget from '@/components/Dashboard/DasboardWidgets';
import { DashboardChart } from '@/components/Dashboard/DashboardChart';
import AppLayout from '@/layouts/app-layout';
import { DateRange, PaginateStudents } from '@/lib/custom-types';
import apiService from '@/services/apiService';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import { ImportPrintedStudents } from './Campus/Modal/ImportPrintedStudents';
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

    const [students, setStudents] = useState<PaginateStudents | null>(null);

    const [searchValue, setSearchValue] = useState<string | null>(null);
    const [range, setRange] = useState<DateRange | undefined>(undefined);
    const [perPage, setPerPage] = useState<number>(10);
    const [sort, setSort] = useState('created_at');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');

    const startOfDay = (d?: Date) =>
        d ? new Date(d.setHours(0, 0, 0, 0)).toISOString() : null;

    const endOfDay = (d?: Date) =>
        d ? new Date(d.setHours(23, 59, 59, 999)).toISOString() : null;

    const handleFilter = async () => {
        try {
            const params = {
                params: {
                    search: searchValue || null,

                    from: startOfDay(range?.from),
                    to: endOfDay(range?.to),
                    perPage: perPage,
                    sort: sort,
                    order: order,
                },
            };
            const { data: paginateData } = await apiService.get(
                route('filter.paginate.all'),
                params,
            );

            setStudents(paginateData);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    useEffect(() => {
        handleFilter();
    }, [searchValue, range, perPage, sort, order]);

    const [openImportPrintedModal, setOpenImportPrintedModal] = useState(false);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <ImportPrintedStudents
                isOpen={openImportPrintedModal}
                setIsOpen={() => setOpenImportPrintedModal(false)}
                reload={handleFilter}
            />
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
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <DashboardChart onImport={setOpenImportPrintedModal} />
                </div>
            </div>
        </AppLayout>
    );
}
