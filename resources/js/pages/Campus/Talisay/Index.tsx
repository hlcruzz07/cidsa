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
import { StudentProps } from '@/lib/student-types';
import { campusDirectoryArr } from '@/lib/utils';
import apiService from '@/services/apiService';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import dayjs from 'dayjs';
import {
    AlertCircleIcon,
    ArrowUpDownIcon,
    BookMarkedIcon,
    BookOpenCheck,
    CalendarIcon,
    ChartLineIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronsLeftRight,
    EllipsisIcon,
    EyeIcon,
    FilterXIcon,
    ImportIcon,
    PencilIcon,
    Trash2Icon,
    UploadCloudIcon,
    UserPlus2Icon,
    XIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { StudentsUpdateChart } from '../../../components/Campus/StudentChart';
import Widget from '../../../components/Campus/Widget';
import { AddStudentModal } from '../Modal/AddStudentModal';
import ExportModal from '../Modal/ExportModal';
import { ImportModal } from '../Modal/ImportModal';
import PreviewModal from '../Modal/PreviewModal';

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
type PageProps = {
    counts: {
        totalUpdates: number;
        readyStudents: number;
        incompleteStudents: number;
        exportedStudents: number;
    };
};
export default function Index() {
    const { counts } = usePage<PageProps>().props;

    const titlePage = 'Talisay';
    const hrefPage = '/campus/talisay';
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: `Campus - ${titlePage}`,
            href: hrefPage,
        },
    ];
    const [students, setStudents] = useState<PaginatePets | null>(null);

    const [searchValue, setSearchValue] = useState<string | null>(null);
    const [selectedCollege, setSelectedCollege] = useState<string | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
    const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
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

    const collegeTalArr = campusDirectoryArr.find((collegeItem) =>
        collegeItem.campus.includes(titlePage),
    )?.colleges;

    const programsArr =
        collegeTalArr?.filter((item) => item.value === selectedCollege)[0]
            ?.programs || null;

    const majorArr =
        programsArr?.filter((item) => item.name === selectedProgram)[0]
            ?.majors || null;

    const [sectionsArr, setSectionsArr] = useState([]);

    const [canExport, setCanExport] = useState(false);

    const handleFilter = async () => {
        try {
            const params = {
                params: {
                    search: searchValue || null,
                    college: selectedCollege || null,
                    program: selectedProgram || null,
                    major: selectedMajor || null,
                    section: selectedSection || null,
                    year: selectedYear || null,
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
            const { data: paginateData } = await apiService.get(
                route('filter.paginate'),
                params,
            );

            const { data: checkData } = await apiService.get(
                route('filter.check'),
                params,
            );

            setCanExport(checkData);

            setStudents(paginateData);

            const cleanedSections = paginateData.data
                .map((item: any) => item.section)
                .filter((section: any): section is string => Boolean(section))
                .sort((a: any, b: any) => a.localeCompare(b));

            setSectionsArr(cleanedSections);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const resetFilters = () => {
        setSearchValue(null);
        setSelectedCollege(null);
        setSelectedProgram(null);
        setSelectedMajor(null);
        setSelectedSection(null);
        setSelectedYear(null);
        setIsExported(null);
        setIsCompleted(null);
        setRange(undefined);
        setSort('updated_at');
        setOrder('desc');
        setPerPage(10);
    };

    const DEFAULTS = {
        searchValue: null,
        selectedCollege: null,
        selectedProgram: null,
        selectedMajor: null,
        selectedSection: null,
        selectedYear: null,
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
            selectedCollege !== DEFAULTS.selectedCollege ||
            selectedProgram !== DEFAULTS.selectedProgram ||
            selectedMajor !== DEFAULTS.selectedMajor ||
            selectedSection !== DEFAULTS.selectedSection ||
            selectedYear !== DEFAULTS.selectedYear ||
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
        selectedProgram,
        selectedMajor,
        selectedSection,
        selectedYear,
        isExported,
        isCompleted,
        range,
        perPage,
        sort,
        order,
    ]);

    useEffect(() => {
        handleFilter();
    }, [
        searchValue,
        selectedCollege,
        selectedProgram,
        selectedMajor,
        selectedSection,
        selectedYear,
        isExported,
        isCompleted,
        range,
        perPage,
        sort,
        order,
    ]);

    const [isFetchingExport, setIsFetchingExport] = useState(false);

    const fetchExportableStudents = async () => {
        if (isFetchingExport) return;
        const paramsExport = {
            params: {
                search: searchValue || null,
                college: selectedCollege || null,
                program: selectedProgram || null,
                major: selectedMajor || null,
                section: selectedSection || null,
                year: selectedYear || null,
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
            setIsFetchingExport(true);
            setOpenExportModal(true);

            const { data } = await apiService.get(
                route('filter.export'),
                paramsExport,
            );

            setExportedStudents(data);
            setIsFetchingExport(false);
        } catch (error) {
            console.log('Eror Fetching exportable students', error);
        }
    };

    const [exportedStudents, setExportedStudents] = useState<
        StudentProps[] | null
    >(null);

    const [previewStudents, setPreviewStudents] = useState<
        StudentProps[] | null
    >(null);
    const [openPreviewModal, setOpenPreviewModal] = useState(false);

    // Modal
    const [openImportModal, setOpenImportModal] = useState(false);
    const [openAddStudentModal, setOpenAddStudentModal] = useState(false);
    const [openExportModal, setOpenExportModal] = useState(false);

    const handleSingleExport = (student: StudentProps) => {
        if (!student.is_completed) {
            toast.error('Error: student is not completed');
            return;
        }

        window.location.href = route('export.student', student.id);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Campus - ${titlePage}`} />
            <ImportModal
                isOpen={openImportModal}
                setIsOpen={() => setOpenImportModal(false)}
                campus={titlePage}
                reload={handleFilter}
            />
            <PreviewModal
                students={previewStudents}
                isOpen={openPreviewModal}
                setIsOpen={() => setOpenPreviewModal(false)}
            />

            <AddStudentModal
                isOpen={openAddStudentModal}
                setIsOpen={() => setOpenAddStudentModal(false)}
                campus={titlePage}
            />

            <ExportModal
                isOpen={openExportModal}
                onPreview={(students) => {
                    setOpenPreviewModal(true);
                    setPreviewStudents(students);
                }}
                students={exportedStudents}
                setIsOpen={() => setOpenExportModal(false)}
                onLoad={handleFilter}
            />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Widget type="totalUpdates" count={counts.totalUpdates} />
                    <Widget type="readyStudents" count={counts.readyStudents} />
                    <Widget
                        type="incompleteStudents"
                        count={counts.incompleteStudents}
                    />
                    <Widget
                        type="exportedStudents"
                        count={counts.exportedStudents}
                    />
                </div>

                <StudentsUpdateChart campus={titlePage} />

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
                                                setSort('updated_at');
                                                setOrder('desc');
                                            }}
                                        >
                                            Reset <Trash2Icon />
                                        </Button>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button onClick={() => setOpenImportModal(true)}>
                                <ImportIcon /> Import
                            </Button>
                            <Button
                                disabled={!canExport || isFetchingExport}
                                onClick={fetchExportableStudents}
                            >
                                <UploadCloudIcon /> Export
                            </Button>
                        </div>
                        <Button
                            type="button"
                            onClick={() => setOpenAddStudentModal(true)}
                            className="w-full lg:w-auto"
                        >
                            <UserPlus2Icon />
                            Add
                        </Button>
                    </div>
                    <div className="mt-3 flex flex-col items-start justify-between gap-5 md:flex-row md:items-start">
                        <div className="flex w-full grow flex-wrap gap-3 xl:w-auto">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <BookMarkedIcon />
                                        College
                                        <ChevronDownIcon />
                                        {selectedCollege && (
                                            <Badge className="ml-2">
                                                {selectedCollege}
                                            </Badge>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-max"
                                    align="start"
                                >
                                    {collegeTalArr?.map((item, index) => (
                                        <DropdownMenuCheckboxItem
                                            key={index}
                                            checked={
                                                selectedCollege === item.value
                                            }
                                            onSelect={() => {
                                                setSelectedProgram(null);
                                                setSelectedMajor(null);

                                                setSelectedCollege((prev) =>
                                                    prev === item.value
                                                        ? null
                                                        : item.value,
                                                );
                                            }}
                                        >
                                            {item.name}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {programsArr && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline">
                                            <BookOpenCheck />
                                            Programs
                                            <ChevronDownIcon />
                                            {selectedProgram && (
                                                <Badge className="ml-2">
                                                    {selectedProgram}
                                                </Badge>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        className="w-max"
                                        align="start"
                                    >
                                        {programsArr?.map((item, index) => (
                                            <DropdownMenuCheckboxItem
                                                key={index}
                                                checked={
                                                    selectedProgram ===
                                                    item.name
                                                }
                                                onSelect={() => {
                                                    setSelectedMajor(null);
                                                    setSelectedSection(null);
                                                    setSelectedProgram(
                                                        (prev) =>
                                                            prev === item.name
                                                                ? null
                                                                : item.name,
                                                    );
                                                }}
                                            >
                                                {item.name}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                            {majorArr && majorArr.length > 0 && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline">
                                            <BookOpenCheck />
                                            Majors
                                            <ChevronDownIcon />
                                            {selectedMajor && (
                                                <Badge className="ml-2">
                                                    {selectedMajor}
                                                </Badge>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        className="w-max"
                                        align="start"
                                    >
                                        {majorArr?.map((item, index) => (
                                            <DropdownMenuCheckboxItem
                                                key={index}
                                                checked={selectedMajor === item}
                                                onSelect={() => {
                                                    setSelectedSection(null);
                                                    setSelectedMajor((prev) =>
                                                        prev === item
                                                            ? null
                                                            : item,
                                                    );
                                                }}
                                            >
                                                {item}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            {sectionsArr &&
                                sectionsArr.length > 0 &&
                                selectedProgram && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline">
                                                <BookOpenCheck />
                                                Sections
                                                <ChevronDownIcon />
                                                {selectedSection && (
                                                    <Badge className="ml-2">
                                                        {selectedSection}
                                                    </Badge>
                                                )}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            className="w-max"
                                            align="start"
                                        >
                                            {sectionsArr?.map((item, index) => (
                                                <DropdownMenuCheckboxItem
                                                    key={index}
                                                    checked={
                                                        selectedSection === item
                                                    }
                                                    onSelect={() => {
                                                        setSelectedSection(
                                                            (prev) =>
                                                                prev === item
                                                                    ? null
                                                                    : item,
                                                        );
                                                    }}
                                                >
                                                    {item}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <BookOpenCheck />
                                        Year Level
                                        <ChevronDownIcon />
                                        {selectedYear && (
                                            <Badge className="ml-2">
                                                {selectedYear}
                                            </Badge>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-max"
                                    align="start"
                                >
                                    {[
                                        '1st Year',
                                        '2nd Year',
                                        '3rd Year',
                                        '4th Year',
                                        '5th Year',
                                    ].map((item, index) => (
                                        <DropdownMenuCheckboxItem
                                            key={index}
                                            checked={selectedYear === item}
                                            onSelect={() => {
                                                setSelectedYear((prev) =>
                                                    prev === item ? null : item,
                                                );
                                            }}
                                        >
                                            {item}
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

                            {hasActiveFilters && (
                                <Button
                                    type="button"
                                    onClick={resetFilters}
                                    variant="destructive"
                                >
                                    <FilterXIcon /> Reset Filter
                                </Button>
                            )}
                        </div>
                        <p className="text-sm whitespace-nowrap">
                            Total Entries:{' '}
                            <Badge>
                                {Number(students?.total || 0).toLocaleString()}
                            </Badge>
                        </p>
                    </div>
                    <div className="relative mt-3 overflow-x-auto md:shadow-md lg:border">
                        <table className="table w-full text-left text-xs text-foreground">
                            <thead className="lg:border-b">
                                <tr>
                                    {[
                                        '#',
                                        'ID Number',
                                        'Name',
                                        'Campus',
                                        'College',
                                        'Program',
                                        'Major',
                                        'Year Level',
                                        'Section',
                                        'Exported',
                                        'Completed',
                                        'Date Updated',

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
                                {students?.data.map((row, index) => (
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
                                            data-label="Campus"
                                        >
                                            {row.campus}
                                        </td>
                                        <td
                                            className="p-2 whitespace-nowrap"
                                            data-label="College"
                                        >
                                            {row.college}
                                        </td>
                                        <td
                                            className="p-2 whitespace-nowrap"
                                            data-label="Program"
                                        >
                                            {row.program}
                                        </td>
                                        <td
                                            className="p-2 whitespace-nowrap"
                                            data-label="Major"
                                        >
                                            {row.major}
                                        </td>
                                        <td
                                            className="p-2 whitespace-nowrap"
                                            data-label="Year Level"
                                        >
                                            {row.year}
                                        </td>
                                        <td
                                            className="p-2 whitespace-nowrap"
                                            data-label="Section"
                                        >
                                            {row.section}
                                        </td>

                                        <td
                                            className="p-2 whitespace-nowrap"
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
                                            className="p-2 whitespace-nowrap"
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
                                            className="p-2 whitespace-nowrap"
                                            data-label="Date Updated"
                                        >
                                            {row.updated_at
                                                ? dayjs(row.updated_at).format(
                                                      'MMM D, YYYY hh:mm:ss A',
                                                  )
                                                : ''}{' '}
                                        </td>

                                        <td
                                            className="p-2 whitespace-nowrap"
                                            data-label="Action"
                                        >
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
                                                        <Link
                                                            href={route(
                                                                'campus.view.student',
                                                                row.id,
                                                            )}
                                                        >
                                                            <DropdownMenuItem>
                                                                <EyeIcon /> View
                                                            </DropdownMenuItem>
                                                        </Link>
                                                        <Link
                                                            href={route(
                                                                'campus.edit.student',
                                                                row.id,
                                                            )}
                                                        >
                                                            <DropdownMenuItem>
                                                                <PencilIcon />{' '}
                                                                Edit
                                                            </DropdownMenuItem>
                                                        </Link>
                                                        <DropdownMenuItem
                                                            disabled={
                                                                !row.is_completed
                                                            }
                                                            onClick={() => {
                                                                handleSingleExport(
                                                                    row,
                                                                );
                                                            }}
                                                        >
                                                            <UploadCloudIcon />
                                                            Export
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
                                                                                '/api/student/filterPaginate',
                                                                                {
                                                                                    params: {
                                                                                        search:
                                                                                            searchValue ||
                                                                                            null,
                                                                                        college:
                                                                                            selectedCollege ||
                                                                                            null,
                                                                                        program:
                                                                                            selectedProgram ||
                                                                                            null,
                                                                                        major:
                                                                                            selectedMajor ||
                                                                                            null,
                                                                                        section:
                                                                                            selectedSection ||
                                                                                            null,
                                                                                        is_exported:
                                                                                            isExported,
                                                                                        is_completed:
                                                                                            isCompleted,
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
                                                                                        campus: titlePage,
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
