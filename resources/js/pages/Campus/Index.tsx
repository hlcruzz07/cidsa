// resources/js/pages/Campus/Index.tsx

import { CampusStudentManager } from '@/components/Campus/CampusStudentManager';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';

type PageProps = {
    campus: string;
    counts: {
        totalUpdates: number;
        readyStudents: number;
        incompleteStudents: number;
        exportedStudents: number;
    };
    studentsChart: any;
};

export default function Index() {
    const { campus, counts } = usePage<PageProps>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: `Campus - ${campus}`,
            href: `/campus/${campus.toLowerCase().replace(' ', '-')}`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Campus - ${campus}`} />
            <CampusStudentManager campus={campus} counts={counts} />
        </AppLayout>
    );
}
