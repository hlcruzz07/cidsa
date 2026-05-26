import DashboardWidget from '@/components/Dashboard/DasboardWidgets';
import { DashboardChart } from '@/components/Dashboard/DashboardChart';
import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { DateRange, PaginateStudents } from '@/lib/custom-types';
import apiService from '@/services/apiService';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import dayjs from 'dayjs';
import {
    ArrowUpDownIcon,
    CalendarIcon,
    ChevronDownIcon,
    ChevronsLeftRight,
    CloudDownloadIcon,
    EyeIcon,
    PencilIcon,
    Trash2Icon,
    UserPlus,
    XIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import { AddStudentModal } from './Campus/Modal/AddStudentModal';
import { ImportModal } from './Campus/Modal/ImportModal';
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

    const [openAddModal, setOpenAddModal] = useState(false);
    const [openImportModal, setOpenImportModal] = useState(false);
    const [openImportPrintedModal, setOpenImportPrintedModal] = useState(false);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <AddStudentModal
                isOpen={openAddModal}
                setIsOpen={() => setOpenAddModal(false)}
            />
            <ImportModal
                isOpen={openImportModal}
                setIsOpen={() => setOpenImportModal(false)}
            />
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
                    <DashboardChart />

                    <div className="my-5">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-wrap items-start justify-between gap-5">
                                    <HeadingSmall
                                        title="Incomplete Students"
                                        description="Students who have not yet completed their required ID information."
                                    />
                                    <div className="flex grow flex-col items-start gap-3 md:grow-0 md:flex-row md:items-center">
                                        <p className="text-sm whitespace-nowrap">
                                            Total Entries:{' '}
                                            <Badge>
                                                {Number(
                                                    students?.total || 0,
                                                ).toLocaleString()}
                                            </Badge>
                                        </p>
                                        <div className="flex w-full flex-wrap items-center justify-end gap-3 md:w-auto">
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="w-full md:w-auto"
                                                variant="outline"
                                                onClick={() =>
                                                    setOpenImportPrintedModal(
                                                        true,
                                                    )
                                                }
                                            >
                                                <CloudDownloadIcon /> Import
                                                Printed Students
                                            </Button>
                                            <Button
                                                type="button"
                                                className="w-full md:w-auto"
                                                size="sm"
                                                onClick={() =>
                                                    setOpenAddModal(true)
                                                }
                                            >
                                                <UserPlus /> Add Student
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="w-full md:w-auto"
                                                onClick={() =>
                                                    setOpenImportModal(true)
                                                }
                                            >
                                                <CloudDownloadIcon /> Import
                                                Students
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col items-start justify-between gap-3 xl:flex-row">
                                    <Input
                                        type="search"
                                        placeholder="Search ID Number, Name..."
                                        className="w-full"
                                        value={searchValue || ''}
                                        onChange={(e) => {
                                            if (e.target.value === '') {
                                                setSearchValue(null);
                                                return;
                                            }
                                            setSearchValue(
                                                e.target.value.toUpperCase(),
                                            );
                                        }}
                                    />

                                    <div className="flex w-full flex-wrap items-center justify-between gap-3 md:w-auto md:grow md:flex-nowrap">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline">
                                                    Show {perPage}{' '}
                                                    <ChevronsLeftRight className="trasform rotate-90" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                className="w-max"
                                                align="end"
                                            >
                                                {[10, 25, 50, 100].map(
                                                    (option) => (
                                                        <DropdownMenuItem
                                                            key={option}
                                                            onClick={() =>
                                                                setPerPage(
                                                                    option,
                                                                )
                                                            }
                                                            className={
                                                                perPage ===
                                                                option
                                                                    ? 'font-medium text-primary'
                                                                    : ''
                                                            }
                                                        >
                                                            {option}
                                                        </DropdownMenuItem>
                                                    ),
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline">
                                                    <ArrowUpDownIcon /> Sort
                                                    <ChevronDownIcon />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                className="w-auto"
                                                align="end"
                                            >
                                                <DropdownMenuLabel>
                                                    Sort By
                                                </DropdownMenuLabel>
                                                <DropdownMenuGroup>
                                                    <div className="flex items-center gap-3">
                                                        <Select
                                                            value={sort}
                                                            onValueChange={(
                                                                value,
                                                            ) => setSort(value)}
                                                        >
                                                            <SelectTrigger className="w-[180px]">
                                                                <SelectValue placeholder="Select a fruit" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectGroup>
                                                                    <SelectItem value="id">
                                                                        #
                                                                    </SelectItem>
                                                                    <SelectItem value="created_at">
                                                                        Date
                                                                        Imported
                                                                    </SelectItem>
                                                                </SelectGroup>
                                                            </SelectContent>
                                                        </Select>
                                                        <Select
                                                            value={order}
                                                            onValueChange={(
                                                                value,
                                                            ) =>
                                                                setOrder(
                                                                    value as
                                                                        | 'asc'
                                                                        | 'desc',
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger className="w-[180px]">
                                                                <SelectValue placeholder="Select a fruit" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectGroup>
                                                                    <SelectItem value="asc">
                                                                        Asc
                                                                    </SelectItem>
                                                                    <SelectItem value="desc">
                                                                        Desc
                                                                    </SelectItem>
                                                                </SelectGroup>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Button
                                                        variant="destructive"
                                                        className="mt-3 w-full"
                                                        type="button"
                                                        onClick={() => {
                                                            setSort(
                                                                'created_at',
                                                            );
                                                            setOrder('desc');
                                                        }}
                                                    >
                                                        Reset <Trash2Icon />
                                                    </Button>
                                                </DropdownMenuGroup>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <div className="flex items-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={`w-max justify-between ${range && 'rounded-e-none border-e-0'}`}
                                                    >
                                                        <CalendarIcon />
                                                        {range?.from &&
                                                        range?.to
                                                            ? `${range.from.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} – ${range.to.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
                                                            : 'Date Added'}

                                                        <ChevronDownIcon />
                                                    </Button>
                                                </DropdownMenuTrigger>

                                                <DropdownMenuContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="range"
                                                        selected={range}
                                                        captionLayout="dropdown"
                                                        onSelect={(
                                                            newRange,
                                                        ) => {
                                                            if (!newRange)
                                                                return;

                                                            setRange(
                                                                newRange as DateRange,
                                                            );
                                                        }}
                                                    />
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            {range && (
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        setRange(undefined)
                                                    }
                                                    className="rounded-s-none"
                                                >
                                                    {' '}
                                                    <XIcon />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="relative mt-3 overflow-x-auto md:shadow-md lg:border">
                                    <table className="table w-full text-left text-xs text-foreground">
                                        <thead className="lg:border-b">
                                            <tr>
                                                {[
                                                    '#',
                                                    'ID Number',
                                                    'Name',

                                                    'Date Added',

                                                    'Action',
                                                ].map((header) => (
                                                    <th
                                                        key={header}
                                                        scope="col"
                                                        className="p-2 whitespace-nowrap"
                                                    >
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="lg:border-b">
                                            {students?.data.map(
                                                (row, index) => (
                                                    <tr
                                                        key={index}
                                                        className="hover:bg-muted/50"
                                                    >
                                                        <td
                                                            className="p-2 whitespace-nowrap"
                                                            data-label="ID"
                                                        >
                                                            {row.id}
                                                        </td>

                                                        <td
                                                            className="p-2 whitespace-nowrap"
                                                            data-label="ID Number"
                                                        >
                                                            {row.id_number}
                                                        </td>
                                                        <td
                                                            className="p-2 whitespace-nowrap"
                                                            data-label="Name"
                                                        >
                                                            {`${row.first_name} ${row.middle_init ? row.middle_init + '.' : ''} ${row.last_name} ${row.suffix ? row.suffix + '.' : ''}`}
                                                        </td>

                                                        <td
                                                            className="p-2 whitespace-nowrap"
                                                            data-label="Date Added"
                                                        >
                                                            {row.created_at
                                                                ? dayjs(
                                                                      row.created_at,
                                                                  ).format(
                                                                      'MMM D, YYYY hh:mm:ss A',
                                                                  )
                                                                : ''}{' '}
                                                        </td>

                                                        <td
                                                            className="p-2 whitespace-nowrap"
                                                            data-label="Action"
                                                        >
                                                            <div className="flex flex-wrap gap-3">
                                                                <Link
                                                                    href={route(
                                                                        'campus.view.student',
                                                                        row.id,
                                                                    )}
                                                                >
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                    >
                                                                        <EyeIcon />
                                                                    </Button>
                                                                </Link>
                                                                <Link
                                                                    href={route(
                                                                        'campus.edit.student',
                                                                        row.id,
                                                                    )}
                                                                >
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                    >
                                                                        <PencilIcon />
                                                                    </Button>
                                                                </Link>{' '}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                            {students?.data.length === 0 ? (
                                                <>
                                                    <tr>
                                                        <td
                                                            colSpan={13}
                                                            className="force-center border p-3 text-center"
                                                        >
                                                            No records found.
                                                        </td>
                                                    </tr>
                                                </>
                                            ) : (
                                                ''
                                            )}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td
                                                    colSpan={12}
                                                    className="px-6 py-4"
                                                >
                                                    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                                                        <p className="text-sm text-muted-foreground">
                                                            Showing{' '}
                                                            <span className="font-medium">
                                                                {students?.from}
                                                            </span>
                                                            –
                                                            <span className="font-medium">
                                                                {students?.to}
                                                            </span>{' '}
                                                            of{' '}
                                                            <span className="font-medium">
                                                                {
                                                                    students?.total
                                                                }
                                                            </span>
                                                        </p>

                                                        <div className="flex flex-wrap gap-2">
                                                            {students?.links?.map(
                                                                (link, idx) => {
                                                                    // Extract page number from link URL
                                                                    let page:
                                                                        | string
                                                                        | null =
                                                                        null;
                                                                    if (
                                                                        link.url
                                                                    ) {
                                                                        const url =
                                                                            new URL(
                                                                                link.url,
                                                                            );
                                                                        page =
                                                                            url.searchParams.get(
                                                                                'page',
                                                                            );
                                                                    }

                                                                    return (
                                                                        <button
                                                                            key={
                                                                                idx
                                                                            }
                                                                            disabled={
                                                                                !link.url
                                                                            }
                                                                            onClick={async (
                                                                                e,
                                                                            ) => {
                                                                                e.preventDefault();
                                                                                if (
                                                                                    !page
                                                                                )
                                                                                    return;

                                                                                try {
                                                                                    const {
                                                                                        data,
                                                                                    } =
                                                                                        await apiService.get(
                                                                                            route(
                                                                                                'filter.paginate.all',
                                                                                            ),
                                                                                            {
                                                                                                params: {
                                                                                                    search:
                                                                                                        searchValue ||
                                                                                                        null,

                                                                                                    from: startOfDay(
                                                                                                        range?.from,
                                                                                                    ),
                                                                                                    to: endOfDay(
                                                                                                        range?.to,
                                                                                                    ),
                                                                                                    perPage:
                                                                                                        perPage,
                                                                                                    sort: sort,
                                                                                                    order: order,
                                                                                                    page,
                                                                                                },
                                                                                            },
                                                                                        );

                                                                                    setStudents(
                                                                                        data,
                                                                                    );
                                                                                } catch (error) {
                                                                                    console.error(
                                                                                        'Failed to fetch page:',
                                                                                        error,
                                                                                    );
                                                                                }
                                                                            }}
                                                                            className={`rounded px-3 py-1 ${
                                                                                link.active
                                                                                    ? 'bg-primary text-white dark:text-black'
                                                                                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                                                                            }`}
                                                                            type="button"
                                                                        >
                                                                            {/* Use inner text instead of dangerouslySetInnerHTML */}
                                                                            <span
                                                                                dangerouslySetInnerHTML={{
                                                                                    __html: link.label,
                                                                                }}
                                                                            />
                                                                        </button>
                                                                    );
                                                                },
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
