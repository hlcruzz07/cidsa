import { Badge } from '@/components/ui/badge';
import BadgeYearLevel from '@/components/ui/BadgeYearLevel';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
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
    ArrowUpDownIcon,
    BookMarkedIcon,
    BookOpenCheckIcon,
    CalendarIcon,
    ChevronDownIcon,
    ChevronsLeftRight,
    EllipsisIcon,
    EyeIcon,
    IdCardIcon,
    PencilIcon,
    Trash2Icon,
    UploadCloudIcon,
    XIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type PetProps = {
    id: number;
    id_type: string;
    id_number: string;
    first_name: string;
    middle_init: string | null;
    last_name: string;
    suffix: string | null;
    campus: string;
    college: string;
    program: string;
    major: string;
    year_level: number;
    section: string;
    created_at: string;
    updated_at: string;
};

type PaginatePets = {
    data: PetProps[];
    links: { url: string | null; label: string; active: boolean }[];
    from: number;
    to: number;
    total: number;
};

type DateRange = {
    from: Date;
    to?: Date;
};

export default function CampusLayout({
    campus,
    link,
}: {
    campus: string;
    link: string;
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: `Campus - ${campus}`,
            href: `/campus/${link}`,
        },
    ];
    const [students, setStudents] = useState<PaginatePets | null>(null);

    const collegeTalArr = campusDirectoryArr.find((collegeItem) =>
        collegeItem.campus.includes(campus),
    )?.colleges;

    const yearLevels = [
        { value: 1, name: '1st Year' },
        { value: 2, name: '2nd Year' },
        { value: 3, name: '3rd Year' },
        { value: 4, name: '4th Year' },
        { value: 5, name: '5th Year' },
    ];

    // Filter Data States
    const [searchValue, setSearchValue] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [selectedCollege, setSelectedCollege] = useState<string[]>([]);
    const [selectedYearLevel, setSelectedYearLevel] = useState<number[]>([]);
    const [range, setRange] = useState<DateRange | undefined>(undefined);
    const [perPage, setPerPage] = useState<number>(10);
    const [sort, setSort] = useState('id');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');

    const handleFilter = async () => {
        try {
            const { data } = await apiService.get('/api/student/filter', {
                params: {
                    search: searchValue || undefined,
                    type: selectedType || undefined,
                    college: selectedCollege.length
                        ? selectedCollege
                        : undefined,
                    year_level: selectedYearLevel.length
                        ? selectedYearLevel
                        : undefined,
                    from: range?.from?.toISOString(),
                    to: range?.to?.toISOString(),
                    perPage: perPage,
                    sort: sort,
                    order: order,
                    campus: campus,
                },
            });

            setStudents(data);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const resetFilters = () => {
        setSearchValue(null);
        setSelectedType(null);
        setSelectedCollege([]);
        setSelectedYearLevel([]);
        setRange(undefined);
        setSort('id');
        setOrder('asc');
        setPerPage(10);
    };

    const DEFAULTS = {
        searchValue: null,
        selectedType: null,
        selectedCollege: [] as string[],
        selectedYearLevel: [] as number[],
        range: undefined as DateRange | undefined,
        perPage: 10,
        sort: 'id',
        order: 'desc' as 'asc' | 'desc',
    };

    const hasActiveFilters = useMemo(() => {
        return (
            searchValue !== DEFAULTS.searchValue ||
            selectedType !== DEFAULTS.selectedType ||
            selectedCollege.length > 0 ||
            selectedYearLevel.length > 0 ||
            range !== DEFAULTS.range ||
            perPage !== DEFAULTS.perPage ||
            sort !== DEFAULTS.sort ||
            order !== DEFAULTS.order
        );
    }, [
        searchValue,
        selectedType,
        selectedCollege,
        selectedYearLevel,
        range,
        perPage,
        sort,
        order,
    ]);

    useEffect(() => {
        handleFilter();
    }, [
        searchValue,
        selectedType,
        selectedCollege,
        selectedYearLevel,
        range,
        perPage,
        sort,
        order,
    ]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Campus - ${campus}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                </div>
                <div className="relative min-h-[100vh] flex-1 rounded-xl border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <div className="flex flex-col items-center justify-between gap-3 xl:flex-row">
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
                                setSearchValue(e.target.value);
                            }}
                        />

                        <div className="flex w-full items-center gap-3 xl:w-auto">
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
                                            onClick={() => setPerPage(option)}
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
                                                            ID
                                                        </SelectItem>
                                                        <SelectItem value="id_type">
                                                            Type
                                                        </SelectItem>
                                                        <SelectItem value="college">
                                                            College
                                                        </SelectItem>
                                                        <SelectItem value="year_level">
                                                            Year Level
                                                        </SelectItem>
                                                        <SelectItem value="section">
                                                            Section
                                                        </SelectItem>
                                                        <SelectItem value="created_at">
                                                            Date
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
                            <Button>
                                <UploadCloudIcon /> Export
                            </Button>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                        <div className="flex w-full grow flex-wrap gap-3 xl:w-auto xl:flex-nowrap">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <IdCardIcon />{' '}
                                        {selectedType
                                            ? selectedType
                                                  .charAt(0)
                                                  .toUpperCase() +
                                              selectedType.slice(1)
                                            : 'Type'}{' '}
                                        <ChevronDownIcon />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-56"
                                    align="start"
                                >
                                    <DropdownMenuRadioGroup
                                        value={selectedType || ''}
                                        onValueChange={(value) =>
                                            setSelectedType(value || null)
                                        }
                                    >
                                        <DropdownMenuRadioItem
                                            value=""
                                            onSelect={(e) => {
                                                e.preventDefault();
                                                setSelectedType('');
                                            }}
                                        >
                                            All
                                        </DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem
                                            value="new"
                                            onSelect={(e) => {
                                                e.preventDefault();
                                                setSelectedType('new');
                                            }}
                                        >
                                            New
                                        </DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem
                                            value="replacement"
                                            onSelect={(e) => {
                                                e.preventDefault();
                                                setSelectedType('replacement');
                                            }}
                                        >
                                            Replacement
                                        </DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
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
                                        <BookOpenCheckIcon /> Year Level
                                        <ChevronDownIcon />
                                        <div className="flex flex-wrap items-center gap-2">
                                            {selectedYearLevel.length > 0 &&
                                                selectedYearLevel.map(
                                                    (year, idx) => (
                                                        <Badge
                                                            key={idx}
                                                            variant="default"
                                                        >
                                                            {year}
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
                                    {yearLevels.map((item) => (
                                        <DropdownMenuCheckboxItem
                                            key={item.value}
                                            checked={selectedYearLevel.includes(
                                                item.value,
                                            )}
                                            onSelect={(e) => {
                                                e.preventDefault();

                                                setSelectedYearLevel((prev) =>
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
                                            {item.name}
                                        </DropdownMenuCheckboxItem>
                                    ))}
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
                                                : 'Date'}

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
                    </div>
                    <div className="relative mt-3 overflow-x-auto md:shadow-md lg:border">
                        <table className="table w-full text-left text-sm text-foreground">
                            <thead className="text lg:border-b">
                                <tr>
                                    <th scope="col" className="p-3">
                                        ID
                                    </th>
                                    <th scope="col" className="p-3">
                                        Type
                                    </th>
                                    <th scope="col" className="p-3">
                                        ID Number
                                    </th>
                                    <th scope="col" className="p-3">
                                        Name
                                    </th>
                                    <th scope="col" className="p-3">
                                        Campus
                                    </th>
                                    <th scope="col" className="p-3">
                                        College
                                    </th>
                                    <th scope="col" className="p-3">
                                        Program
                                    </th>
                                    <th scope="col" className="p-3">
                                        Year Level
                                    </th>
                                    <th scope="col" className="p-3">
                                        Section
                                    </th>
                                    <th scope="col" className="p-3">
                                        Date
                                    </th>

                                    <th scope="col" className="p-3">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="lg:border-b">
                                {students?.data.map((row, index) => (
                                    <tr
                                        key={index}
                                        className="hover:bg-muted/50"
                                    >
                                        <td className="p-3" data-label="ID">
                                            {row.id}
                                        </td>
                                        <td className="p-3" data-label="Type">
                                            {row.id_type === 'new' ? (
                                                <Badge>New</Badge>
                                            ) : (
                                                <Badge variant="destructive">
                                                    Replacement
                                                </Badge>
                                            )}
                                        </td>
                                        <td
                                            className="p-3"
                                            data-label="ID Number"
                                        >
                                            {row.id_number}
                                        </td>
                                        <td className="p-3" data-label="Name">
                                            {`${row.first_name}${row.middle_init ? ' ' + row.middle_init + '.' : ''} ${row.last_name} ${row.suffix ?? ''}`}
                                        </td>
                                        <td className="p-3" data-label="Campus">
                                            {row.campus}
                                        </td>
                                        <td
                                            className="p-3"
                                            data-label="College"
                                        >
                                            {row.college}
                                        </td>
                                        <td
                                            className="p-3"
                                            data-label="Program"
                                        >
                                            {row.program}
                                        </td>
                                        <td
                                            className="p-3"
                                            data-label="Year Level"
                                        >
                                            <BadgeYearLevel
                                                yearLevel={row.year_level}
                                            />
                                        </td>
                                        <td
                                            className="p-3"
                                            data-label="Section"
                                        >
                                            {row.section}
                                        </td>

                                        <td className="p-3" data-label="Date">
                                            {dayjs(row.created_at).format(
                                                'MMM D, YYYY hh:mm:ss A',
                                            )}{' '}
                                        </td>

                                        <td className="p-3" data-label="Action">
                                            <div className="flex flex-wrap gap-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            size="icon-sm"
                                                        >
                                                            <EllipsisIcon />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        className="w-max"
                                                        align="end"
                                                    >
                                                        <DropdownMenuItem>
                                                            <EyeIcon /> View
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <PencilIcon /> Edit
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
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
                            <tfoot>
                                <tr>
                                    <td colSpan={12} className="px-6 py-4">
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
                                                    {students?.total}
                                                </span>
                                            </p>

                                            <div className="flex flex-wrap gap-2">
                                                {students?.links?.map(
                                                    (link, idx) => {
                                                        // Extract page number from link URL
                                                        let page:
                                                            | string
                                                            | null = null;
                                                        if (link.url) {
                                                            const url = new URL(
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
                                                                    if (!page)
                                                                        return;

                                                                    try {
                                                                        const {
                                                                            data,
                                                                        } =
                                                                            await apiService.get(
                                                                                '/api/student/filter',
                                                                                {
                                                                                    params: {
                                                                                        search:
                                                                                            searchValue ||
                                                                                            undefined,
                                                                                        type:
                                                                                            selectedType ||
                                                                                            undefined,
                                                                                        college:
                                                                                            selectedCollege.length
                                                                                                ? selectedCollege
                                                                                                : undefined,
                                                                                        year_level:
                                                                                            selectedYearLevel.length
                                                                                                ? selectedYearLevel
                                                                                                : undefined,
                                                                                        from: range?.from?.toISOString(),
                                                                                        to: range?.to?.toISOString(),
                                                                                        perPage,
                                                                                        sort,
                                                                                        order,
                                                                                        page, // ✅ include the page number
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
                </div>
            </div>
        </AppLayout>
    );
}
