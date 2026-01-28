import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
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
import { campusDirectoryArr } from '@/lib/utils';
import apiService from '@/services/apiService';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import dayjs from 'dayjs';
import {
    AlertCircleIcon,
    ArrowUpDownIcon,
    BookMarkedIcon,
    CalendarIcon,
    ChartLineIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronsLeftRight,
    SearchIcon,
    Trash2Icon,
    XIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type StudentProps = {
    id: number;
    id_number: string;
    first_name: string;
    middle_init: string | null;
    last_name: string;
    suffix: string | null;
    program: string;
    college: string;
    college_name: string;
    campus: string;
    emergency_first_name: string;
    emergency_middle_init: string | null;
    emergency_last_name: string;
    emergency_suffix: string | null;
    is_exported: boolean;
    is_completed: boolean;
    barangay: string;
    city: string;
    zip_code: string;
    contact_number: string;
    province: string;
    created_at: string;
    updated_at: string;
};

type PaginatePets = {
    data: StudentProps[];
    links: { url: string | null; label: string; active: boolean }[];
    from: number;
    to: number;
    total: number;
};

type DateRange = {
    from: Date;
    to?: Date;
};

export default function Index() {
    const titlePage = 'Talisay';
    const hrefPage = '/campus/talisay';
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: `Campus - ${titlePage}`,
            href: hrefPage,
        },
    ];
    const [students, setStudents] = useState<PaginatePets | null>(null);

    const collegeTalArr = campusDirectoryArr.find((collegeItem) =>
        collegeItem.campus.includes(titlePage),
    )?.colleges;

    // Filter Data States
    const [searchValue, setSearchValue] = useState<string | null>(null);
    const [selectedCollege, setSelectedCollege] = useState<string[]>([]);
    const [isExported, setIsExported] = useState<boolean | null>(null);
    const [isCompleted, setIsCompleted] = useState<boolean | null>(null);
    const [range, setRange] = useState<DateRange | undefined>(undefined);
    const [perPage, setPerPage] = useState<number>(10);
    const [sort, setSort] = useState('updated_at');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');

    const startOfDay = (d?: Date) =>
        d ? new Date(d.setHours(0, 0, 0, 0)).toISOString() : null;

    const endOfDay = (d?: Date) =>
        d ? new Date(d.setHours(23, 59, 59, 999)).toISOString() : null;

    const handleFilter = async () => {
        const params = {
            params: {
                search: searchValue || null,
                college: selectedCollege.length ? selectedCollege : null,
                is_exported: isExported,
                is_completed: isCompleted,
                from: startOfDay(range?.from),
                to: endOfDay(range?.to),
                perPage: perPage,
                sort: sort,
                order: order,
                campus: titlePage,
            },
        };

        try {
            const { data } = await apiService.get(
                '/api/student/filterPaginate',
                params,
            );

            setStudents(data);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const resetFilters = () => {
        setSearchValue(null);
        setSelectedCollege([]);
        setIsExported(null);
        setIsCompleted(null);
        setRange(undefined);
        setSort('updated_at');
        setOrder('desc');
        setPerPage(10);
    };

    const DEFAULTS = {
        searchValue: null,
        selectedCollege: [] as string[],
        isExported: null,
        isCompleted: null,
        range: undefined as DateRange | undefined,
        perPage: 10,
        sort: 'updated_at',
        order: 'desc' as 'asc' | 'desc',
    };

    const hasActiveFilters = useMemo(() => {
        return (
            searchValue !== DEFAULTS.searchValue ||
            selectedCollege.length > 0 ||
            isExported !== DEFAULTS.isExported ||
            isCompleted !== DEFAULTS.isCompleted ||
            range !== DEFAULTS.range ||
            perPage !== DEFAULTS.perPage ||
            sort !== DEFAULTS.sort ||
            order !== DEFAULTS.order
        );
    }, [
        searchValue,
        selectedCollege,
        isExported,
        isCompleted,
        range,
        perPage,
        sort,
        order,
    ]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Campus - ${titlePage}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="relative min-h-[100vh] flex-1 rounded-xl border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
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
                                setSearchValue(e.target.value.toUpperCase());
                            }}
                        />

                        <div className="flex w-full flex-wrap items-center justify-between gap-3 md:w-auto md:grow md:flex-nowrap">
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
                                                        <SelectItem value="college">
                                                            College
                                                        </SelectItem>

                                                        <SelectItem value="updated_at">
                                                            Date Updated
                                                        </SelectItem>
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            <Select
                                                value={order}
                                                onValueChange={(value) =>
                                                    setOrder(
                                                        value as 'asc' | 'desc',
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
                                                setSort('id');
                                                setOrder('asc');
                                            }}
                                        >
                                            Reset <Trash2Icon />
                                        </Button>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button type="button">
                                <SearchIcon /> See Result
                            </Button>
                        </div>
                    </div>
                    <div className="mt-3 flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
                        <div className="flex w-full grow flex-wrap gap-3 xl:w-auto xl:flex-nowrap">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <BookMarkedIcon /> College
                                        <ChevronDownIcon />
                                        <div className="flex flex-wrap items-center gap-2">
                                            {selectedCollege.length > 0 &&
                                                selectedCollege.map(
                                                    (college, idx) => (
                                                        <Badge
                                                            key={idx}
                                                            variant="default"
                                                        >
                                                            {college}
                                                        </Badge>
                                                    ),
                                                )}
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-max"
                                    align="start"
                                >
                                    {collegeTalArr?.map((item, index) => (
                                        <DropdownMenuCheckboxItem
                                            key={index}
                                            checked={selectedCollege.includes(
                                                item.value,
                                            )}
                                            onSelect={(event) => {
                                                event.preventDefault();
                                                setSelectedCollege((prev) =>
                                                    prev.includes(item.value)
                                                        ? prev.filter(
                                                              (s) =>
                                                                  s !==
                                                                  item.value,
                                                          )
                                                        : [...prev, item.value],
                                                );
                                            }}
                                        >
                                            {item.value} - {item.name}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <ChartLineIcon />
                                        Status
                                        <div className="space-x-1">
                                            {isExported ? (
                                                <Badge variant="default">
                                                    <CheckIcon />
                                                    Exported
                                                </Badge>
                                            ) : isExported !== null ? (
                                                <Badge variant="destructive">
                                                    <AlertCircleIcon />
                                                    Exported
                                                </Badge>
                                            ) : (
                                                ''
                                            )}
                                            {isCompleted ? (
                                                <Badge variant="default">
                                                    <CheckIcon />
                                                    Completed
                                                </Badge>
                                            ) : isCompleted !== null ? (
                                                <Badge variant="destructive">
                                                    <AlertCircleIcon />
                                                    Completed
                                                </Badge>
                                            ) : (
                                                ''
                                            )}
                                        </div>
                                        <ChevronDownIcon />
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    className="w-max"
                                    align="start"
                                >
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                            Exported
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                            {[
                                                { label: 'Yes', value: true },
                                                { label: 'No', value: false },
                                            ].map((item) => (
                                                <DropdownMenuCheckboxItem
                                                    key={item.label}
                                                    checked={
                                                        isExported ===
                                                        item.value
                                                    }
                                                    onSelect={(event) => {
                                                        event.preventDefault();

                                                        setIsExported(
                                                            isExported ===
                                                                item.value
                                                                ? null
                                                                : item.value,
                                                        );
                                                    }}
                                                >
                                                    {item.label}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                    <DropdownMenuSeparator />

                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                            Completed
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                            {[
                                                { label: 'Yes', value: true },
                                                { label: 'No', value: false },
                                            ].map((item) => (
                                                <DropdownMenuCheckboxItem
                                                    key={item.label}
                                                    checked={
                                                        isCompleted ===
                                                        item.value
                                                    }
                                                    onSelect={(event) => {
                                                        event.preventDefault();

                                                        // toggle behavior (click again to clear)
                                                        setIsCompleted(
                                                            isCompleted ===
                                                                item.value
                                                                ? null
                                                                : item.value,
                                                        );
                                                    }}
                                                >
                                                    {item.label}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </DropdownMenuSubContent>
                                    </DropdownMenuSub>
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
                                                : 'Date Updated'}

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

                                                setRange(newRange as DateRange);
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
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        Limit {perPage}{' '}
                                        <ChevronsLeftRight className="trasform rotate-90" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-max"
                                    align="end"
                                >
                                    {[10, 25, 50, 100, 200, 500].map(
                                        (option) => (
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
                                        ),
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {hasActiveFilters && (
                                <Button
                                    type="button"
                                    onClick={resetFilters}
                                    variant="destructive"
                                >
                                    <Trash2Icon /> Reset All
                                </Button>
                            )}
                        </div>
                        <p className="text-sm">
                            Total Entries:{' '}
                            <Badge>
                                {Number(students?.total || 0).toLocaleString()}
                            </Badge>
                        </p>
                    </div>
                    <div className="relative mt-3 overflow-x-auto md:shadow-md lg:border">
                        <table className="table w-full text-left text-sm text-foreground">
                            <thead className="text lg:border-b">
                                <tr>
                                    {[
                                        '#',
                                        'ID Number',
                                        'Name',
                                        'Campus',
                                        'College',
                                        'Program',
                                        'Exported',
                                        'Completed',
                                        'Date Updated',
                                        'Date Created',
                                        'Action',
                                    ].map((header) => (
                                        <th
                                            key={header}
                                            scope="col"
                                            className="p-3 whitespace-nowrap"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="lg:border-b">
                                {students?.data.map((row, index) => (
                                    <tr
                                        key={index}
                                        className="hover:bg-muted/50"
                                    >
                                        <td
                                            className="p-3 whitespace-nowrap"
                                            data-label="ID"
                                        >
                                            {row.id}
                                        </td>

                                        <td
                                            className="p-3 whitespace-nowrap"
                                            data-label="ID Number"
                                        >
                                            {row.id_number}
                                        </td>
                                        <td
                                            className="p-3 whitespace-nowrap"
                                            data-label="Name"
                                        >
                                            {`${row.first_name}${row.middle_init ? ' ' + row.middle_init : ''} ${row.last_name} ${row.suffix ?? ''}`}
                                        </td>
                                        <td
                                            className="p-3 whitespace-nowrap"
                                            data-label="Campus"
                                        >
                                            {row.campus}
                                        </td>
                                        <td
                                            className="p-3 whitespace-nowrap"
                                            data-label="College"
                                        >
                                            {row.college}
                                        </td>
                                        <td
                                            className="p-3 whitespace-nowrap"
                                            data-label="Program"
                                        >
                                            {row.program}
                                        </td>

                                        <td
                                            className="p-3 whitespace-nowrap"
                                            data-label="Exported"
                                        >
                                            {row.is_exported ? (
                                                <>
                                                    <Badge>Yes</Badge>
                                                </>
                                            ) : (
                                                <>
                                                    <Badge variant="destructive">
                                                        No
                                                    </Badge>
                                                </>
                                            )}
                                        </td>
                                        <td
                                            className="p-3 whitespace-nowrap"
                                            data-label="Completed"
                                        >
                                            {row.is_completed ? (
                                                <>
                                                    <Badge>Yes</Badge>
                                                </>
                                            ) : (
                                                <>
                                                    <Badge variant="destructive">
                                                        No
                                                    </Badge>
                                                </>
                                            )}
                                        </td>
                                        <td
                                            className="p-3 whitespace-nowrap"
                                            data-label="Date Updated"
                                        >
                                            {row.updated_at
                                                ? dayjs(row.updated_at).format(
                                                      'MMM D, YYYY hh:mm:ss A',
                                                  )
                                                : ''}{' '}
                                        </td>
                                        <td
                                            className="p-3 whitespace-nowrap"
                                            data-label="Date Created"
                                        >
                                            {dayjs(row.created_at).format(
                                                'MMM D, YYYY hh:mm:ss A',
                                            )}{' '}
                                        </td>
                                    </tr>
                                ))}
                                {students?.data.length === 0 ? (
                                    <>
                                        <tr>
                                            <td
                                                colSpan={12}
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
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
