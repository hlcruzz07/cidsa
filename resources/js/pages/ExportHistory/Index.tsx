import HeadingSmall from '@/components/heading-small';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useInitials } from '@/hooks/use-initials';
import AppLayout from '@/layouts/app-layout';
import { DateRange } from '@/lib/custom-types';
import apiService from '@/services/apiService';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import dayjs from 'dayjs';
import {
    ArrowUpDownIcon,
    CalendarIcon,
    ChevronDownIcon,
    ChevronsLeftRight,
    DownloadIcon,
    Trash2Icon,
    XIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface StudentExportRecord {
    id: number;
    file_name: string;
    file_path: string;
    status: string;
    completed_at: string;
    created_at: string;
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
}

interface PaginateStudentExports {
    data: StudentExportRecord[];
    current_page: number;
    from: number;
    to: number;
    total: number;
    per_page: number;
    last_page: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

export default function Index() {
    const titlePage = 'Export History';
    const hrefPage = '/export-history';
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: `${titlePage}`,
            href: hrefPage,
        },
    ];

    const getInitials = useInitials();

    const [studentExports, setStudentExports] =
        useState<PaginateStudentExports | null>(null);

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

            const exportsRes = await apiService.get(
                route('filter.student.exports'),
                params,
            );
            setStudentExports(exportsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        handleFilter();
    }, [searchValue, range, perPage, sort, order]);

    // Direct download for already completed exports
    const downloadDirectExport = (exportId: number, fileName: string) => {
        toast.success('Downloading export...', {
            description: fileName,
            duration: 2000,
        });
        window.location.href = route('exports.download', exportId);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${titlePage}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between gap-5">
                            <HeadingSmall
                                title="Exported History"
                                description="Records of all students whose information has been exported."
                            />
                            <p className="text-sm whitespace-nowrap">
                                Total Entries:{' '}
                                <Badge>
                                    {Number(
                                        studentExports?.total || 0,
                                    ).toLocaleString()}
                                </Badge>
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-start justify-between gap-3 xl:flex-row">
                            <Input
                                type="search"
                                placeholder="Search Name, Email, File Name..."
                                className="w-full"
                                value={searchValue || ''}
                                onChange={(e) => {
                                    if (e.target.value === '') {
                                        setSearchValue(null);
                                        return;
                                    }
                                    setSearchValue(e.target.value);
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
                                        {[10, 25, 50, 100].map((option) => (
                                            <DropdownMenuItem
                                                key={option}
                                                onClick={() =>
                                                    setPerPage(option)
                                                }
                                                className={
                                                    perPage === option
                                                        ? 'font-medium text-primary'
                                                        : ''
                                                }
                                            >
                                                {option}
                                            </DropdownMenuItem>
                                        ))}
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
                                                    onValueChange={(value) =>
                                                        setSort(value)
                                                    }
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
                                                                Date Exported
                                                            </SelectItem>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                                <Select
                                                    value={order}
                                                    onValueChange={(value) =>
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
                                                    setSort('created_at');
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
                                                {range?.from && range?.to
                                                    ? `${range.from.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} – ${range.to.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
                                                    : 'Date Exported'}

                                                <ChevronDownIcon />
                                            </Button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent className="w-auto p-0">
                                            <Calendar
                                                mode="range"
                                                selected={range}
                                                captionLayout="dropdown"
                                                onSelect={(newRange) => {
                                                    if (!newRange) return;

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
                                            onClick={() => setRange(undefined)}
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
                            <table className="table w-full text-left text-sm text-foreground">
                                <thead className="lg:border-b">
                                    <tr>
                                        {[
                                            '#',
                                            'Exported By',
                                            'Role',
                                            'File Name',
                                            'Date Exported',
                                            'Status',
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
                                    {studentExports?.data.map((row, index) => (
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
                                                data-label="Exported By"
                                            >
                                                <div className="flex gap-3">
                                                    <Avatar className="hidden h-10 w-10 overflow-hidden rounded-full md:block">
                                                        <AvatarImage
                                                            src={''}
                                                            alt={row.user.name}
                                                        />
                                                        <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                                            {getInitials(
                                                                row.user.name,
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h1 className="text-md font-extrabold">
                                                            {row.user.name}
                                                        </h1>
                                                        <small className="text-xs">
                                                            {row.user.email}
                                                        </small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td
                                                className="p-2 whitespace-nowrap"
                                                data-label="Role"
                                            >
                                                {row.user.role}
                                            </td>

                                            <td
                                                className="p-2 whitespace-nowrap"
                                                data-label="File Name"
                                            >
                                                {row.file_name}.zip
                                            </td>

                                            <td
                                                className="p-2 whitespace-nowrap"
                                                data-label="Date Exported"
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
                                                data-label="Status"
                                            >
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-green-500 text-white"
                                                >
                                                    {row.status}
                                                </Badge>
                                            </td>

                                            <td
                                                className="p-2 whitespace-nowrap"
                                                data-label="Action"
                                            >
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            size="icon"
                                                            onClick={() => {
                                                                downloadDirectExport(
                                                                    row.id,
                                                                    row.file_name,
                                                                );
                                                            }}
                                                        >
                                                            <DownloadIcon />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent
                                                        side="top"
                                                        align="center"
                                                    >
                                                        Download
                                                    </TooltipContent>
                                                </Tooltip>
                                            </td>
                                        </tr>
                                    ))}
                                    {studentExports?.data.length === 0 ? (
                                        <>
                                            <tr>
                                                <td
                                                    colSpan={7}
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
                                        <td colSpan={7} className="px-6 py-4">
                                            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                                                <p className="text-sm text-muted-foreground">
                                                    Showing{' '}
                                                    <span className="font-medium">
                                                        {studentExports?.from}
                                                    </span>
                                                    –
                                                    <span className="font-medium">
                                                        {studentExports?.to}
                                                    </span>{' '}
                                                    of{' '}
                                                    <span className="font-medium">
                                                        {studentExports?.total}
                                                    </span>
                                                </p>

                                                <div className="flex flex-wrap gap-2">
                                                    {studentExports?.links?.map(
                                                        (link, idx) => {
                                                            let page:
                                                                | string
                                                                | null = null;
                                                            if (link.url) {
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
                                                                    key={idx}
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
                                                                                        'filter.student.exports',
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

                                                                            setStudentExports(
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
        </AppLayout>
    );
}
