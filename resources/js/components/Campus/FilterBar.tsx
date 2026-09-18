import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import apiService from '@/services/apiService';
import { usePage } from '@inertiajs/react';
import {
    ArrowUpDownIcon,
    BookMarkedIcon,
    BookOpenCheck,
    CalendarIcon,
    ChartLineIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronsLeftRight,
    ClockIcon,
    DownloadCloudIcon,
    EllipsisIcon,
    PrinterCheckIcon,
    RefreshCcwIcon,
    Trash2Icon,
    XIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

type DateRange = {
    from: Date;
    to?: Date;
};

// Which timestamp column the date range picker filters against. Keep in
// sync with the `dateField` values StudentRepository::filterPaginate
// accepts ('created_at' | 'updated_at').
type DateField = 'created_at' | 'updated_at';

const DATE_FIELD_LABELS: Record<DateField, string> = {
    created_at: 'Date Created',
    updated_at: 'Date Updated',
};

interface FilterOption {
    label: string;
    value: string;
}

// Keep these keys in sync with COLUMN_DEFINITIONS in
// StudentPrintStatusExportController. 'program' is optional and off by
// default (see DEFAULT_EXPORT_COLUMNS) — each sheet is already scoped to
// one program and named in the sheet title, but some exports (e.g. a
// flatter, unsplit list) want it spelled out per row too.
const EXPORT_COLUMNS: { key: string; label: string }[] = [
    { key: 'student_id', label: 'ID Number' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'program', label: 'Program' },
    { key: 'year_level', label: 'Year Level' },
    { key: 'section', label: 'Section' },
    { key: 'status', label: 'Status' },
    { key: 'date_printed', label: 'Date Printed' },
    { key: 'date_received', label: 'Date Received (blank)' },
    { key: 'signature', label: 'Signature (blank)' },
];

// Columns selected by default when the export dialog opens. 'program' is
// deliberately left out here — it's available to toggle on, not default.
const DEFAULT_EXPORT_COLUMNS = [
    'student_id',
    'full_name',
    'year_level',
    'section',
    'status',
    'date_printed',
];

// Keep in sync with the `status` values StudentPrintStatusExportController
// can produce (Printed / Pending / No Data).
const EXPORT_STATUS_OPTIONS = ['Printed', 'Pending', 'No Data'];

// Keep in sync with YEAR_LEVEL_MIN/MAX in StudentPrintStatusExportController.
// Values are raw SIS integers (1-4) — the backend filters and groups on
// these ints directly, never on "1st Year"-style strings. Labels here are
// display-only, for the checkbox list and the exported sheet.
const EXPORT_YEAR_LEVELS: { value: number; label: string }[] = [
    { value: 1, label: '1st Year' },
    { value: 2, label: '2nd Year' },
    { value: 3, label: '3rd Year' },
    { value: 4, label: '4th Year' },
];

// How long the Sync Year Level toast counts down before actually firing the
// request. Gives the user a window to cancel a click they didn't mean to
// make (e.g. hit the wrong menu item).
const SYNC_YEAR_LEVEL_DELAY_SECONDS = 5;

// Printed status options for the FilterBar's Status filter — mirrors the
// same is_printed filter used by BatchIdPrintDialog, so the main table and
// the batch print list stay consistent with each other.
const PRINTED_STATUS_OPTIONS: { label: string; value: boolean }[] = [
    { label: 'Printed', value: true },
    { label: 'Pending', value: false },
];

export interface ExportStatusOptions {
    programs: string[]; // empty array = all programs
    columns: string[]; // column keys, in EXPORT_COLUMNS order
    statuses: string[]; // empty array = all statuses
    yearLevels: number[]; // raw SIS ints (1-4); empty array = all year levels
}

interface SyncYearLevelResponse {
    message: string;
    campus: string;
    sis_students_found: number;
    updated: number;
    unmatched_in_local_db: number;
}

// The toast body shown during the cancellable countdown. Rendered via
// toast.custom, so this is the *entire* toast — no default title/description
// chrome from the toast library.
function SyncYearLevelCountdownToast({
    campus,
    seconds,
    onCancel,
}: {
    campus: string;
    seconds: number;
    onCancel: () => void;
}) {
    const [remaining, setRemaining] = useState(seconds);

    useEffect(() => {
        if (remaining <= 0) return;

        const interval = setInterval(() => {
            setRemaining((r) => Math.max(0, r - 1));
        }, 1000);

        return () => clearInterval(interval);
    }, [remaining]);

    return (
        <div className="flex w-full items-center justify-between gap-4 rounded-md border bg-background p-4 shadow-lg">
            <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">
                    Syncing year levels for {campus}
                </p>
                <p className="text-xs text-muted-foreground">
                    Starting syncing in {remaining}s, this will pull each
                    student's current year level.
                </p>
            </div>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
            >
                Cancel
            </Button>
        </div>
    );
}

interface FilterBarProps {
    // Search
    searchValue: string | null;
    onSearchChange: (value: string | null) => void;

    // Per Page
    perPage: number;
    onPerPageChange: (value: number) => void;
    perPageOptions?: number[];

    // Sort
    sort: string;
    onSortChange: (value: string) => void;
    order: 'asc' | 'desc';
    onOrderChange: (value: 'asc' | 'desc') => void;
    sortOptions?: FilterOption[];

    // Type Filter
    typeOptions?: string[];
    selectedType: string | null;
    onTypeChange: (value: string | null) => void;

    // College Filter
    collegeOptions?: { name: string; value: string }[];
    selectedCollege: string | null;
    onCollegeChange: (value: string | null) => void;

    // Program Filter
    programOptions?: { name: string }[];
    selectedProgram: string | null;
    onProgramChange: (value: string | null) => void;

    // Major Filter
    majorOptions?: string[];
    selectedMajor: string | null;
    onMajorChange: (value: string | null) => void;

    // Year Filter
    yearOptions?: string[];
    selectedYear: string | null;
    onYearChange: (value: string | null) => void;

    // Printed Status Filter — matches the batch print dialog's status
    // filter (null = all, true = printed, false = pending)
    isPrinted: boolean | null;
    onPrintedChange: (value: boolean | null) => void;

    // Campus for this table
    campus: string;

    // Date Range — dateField controls which column ('created_at' or
    // 'updated_at') the picked range filters against.
    range: DateRange | undefined;
    onRangeChange: (range: DateRange | undefined) => void;
    dateField: DateField;
    onDateFieldChange: (field: DateField) => void;

    // Reset
    hasActiveFilters: boolean;
    onReset: () => void;

    // Total entries
    totalEntries?: number;
    onBatchPrint: () => void;
    onExportStatus: (options: ExportStatusOptions) => void;
}

export function FilterBar({
    searchValue,
    onSearchChange,
    perPage,
    onPerPageChange,
    perPageOptions = [10, 25, 50, 100],
    sort,
    onSortChange,
    order,
    onOrderChange,
    sortOptions = [
        { label: '#', value: 'id' },
        { label: 'Last Name', value: 'last_name' },
        { label: 'Date Created', value: 'created_at' },
        { label: 'Date Updated', value: 'updated_at' },
    ],
    typeOptions = ['Undergraduate', 'Graduate Studies'],
    selectedType,
    onTypeChange,
    collegeOptions = [],
    selectedCollege,
    onCollegeChange,
    programOptions = [],
    selectedProgram,
    onProgramChange,
    majorOptions = [],
    selectedMajor,
    onMajorChange,
    yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'],
    selectedYear,
    onYearChange,
    isPrinted,
    onPrintedChange,
    campus,
    range,
    onRangeChange,
    dateField,
    onDateFieldChange,
    hasActiveFilters,
    onReset,
    onBatchPrint,
    onExportStatus,
    totalEntries = 0,
}: FilterBarProps) {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [exportSelectedPrograms, setExportSelectedPrograms] = useState<
        string[]
    >([]);
    const [exportSelectedColumns, setExportSelectedColumns] = useState<
        string[]
    >(DEFAULT_EXPORT_COLUMNS);
    const [exportSelectedStatuses, setExportSelectedStatuses] = useState<
        string[]
    >([]);
    // Multiple selection now (checkboxes), raw SIS ints — empty = all.
    const [exportYearLevels, setExportYearLevels] = useState<number[]>([]);

    // Pending Sync Year Level countdown — tracked so a second click can
    // cancel/replace an in-flight countdown, and so we can clean it up if
    // the component unmounts mid-countdown.
    const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { programs } = usePage().props as {
        programs?: { name: string }[];
    };

    const allProgramNames = (programs ?? []).map((p) => p.name);
    const allProgramsSelected =
        allProgramNames.length > 0 &&
        exportSelectedPrograms.length === allProgramNames.length;

    const toggleSelectAllPrograms = () => {
        setExportSelectedPrograms(allProgramsSelected ? [] : allProgramNames);
    };

    const toggleProgram = (name: string) => {
        setExportSelectedPrograms((prev) =>
            prev.includes(name)
                ? prev.filter((p) => p !== name)
                : [...prev, name],
        );
    };

    const allColumnsSelected =
        exportSelectedColumns.length === EXPORT_COLUMNS.length;

    const toggleSelectAllColumns = () => {
        setExportSelectedColumns(
            allColumnsSelected ? [] : EXPORT_COLUMNS.map((c) => c.key),
        );
    };

    const toggleColumn = (key: string) => {
        setExportSelectedColumns((prev) =>
            prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key],
        );
    };

    const toggleStatus = (status: string) => {
        setExportSelectedStatuses((prev) =>
            prev.includes(status)
                ? prev.filter((v) => v !== status)
                : [...prev, status],
        );
    };

    const allStatusesSelected =
        exportSelectedStatuses.length === EXPORT_STATUS_OPTIONS.length;

    const toggleYearLevel = (level: number) => {
        setExportYearLevels((prev) =>
            prev.includes(level)
                ? prev.filter((l) => l !== level)
                : [...prev, level],
        );
    };

    const allYearLevelsSelected =
        exportYearLevels.length === EXPORT_YEAR_LEVELS.length;

    const handleExport = () => {
        onExportStatus({
            programs: exportSelectedPrograms,
            columns: exportSelectedColumns,
            statuses: exportSelectedStatuses,
            yearLevels: exportYearLevels,
        });
        setIsExportDialogOpen(false);
    };

    // Fires the actual sync call once the countdown completes uncancelled.
    // Uses toast.promise so the countdown toast is immediately replaced by
    // a loading -> success/error toast, rather than the countdown UI
    // lingering or just vanishing with no feedback.
    const performYearLevelSync = () => {
        const syncPromise = apiService
            .post<SyncYearLevelResponse>(route('api.student.sync-year-level'), {
                campus,
            })
            .then((response) => response.data);

        toast.promise(syncPromise, {
            loading: `Syncing year levels for ${campus}...`,
            success: (data) =>
                `Synced ${data.updated} student(s) for ${campus}${
                    data.unmatched_in_local_db > 0
                        ? ` (${data.unmatched_in_local_db} SIS record(s) had no local match).`
                        : '.'
                }`,
            error: (err) =>
                err?.response?.data?.message ??
                `Something went wrong while syncing year levels for ${campus}.`,
        });
    };

    const handleSyncYearLevel = () => {
        // A second click while one is already counting down replaces it
        // rather than stacking two syncs.
        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
            syncTimeoutRef.current = null;
        }

        let cancelled = false;

        const toastId = toast.custom(
            () => (
                <SyncYearLevelCountdownToast
                    campus={campus}
                    seconds={SYNC_YEAR_LEVEL_DELAY_SECONDS}
                    onCancel={() => {
                        cancelled = true;
                        if (syncTimeoutRef.current) {
                            clearTimeout(syncTimeoutRef.current);
                            syncTimeoutRef.current = null;
                        }
                        toast.dismiss(toastId);
                        toast.info('Year level sync cancelled.');
                    }}
                />
            ),
            {
                duration: SYNC_YEAR_LEVEL_DELAY_SECONDS * 1000 + 500,
            },
        );

        syncTimeoutRef.current = setTimeout(() => {
            syncTimeoutRef.current = null;
            toast.dismiss(toastId);
            if (!cancelled) {
                performYearLevelSync();
            }
        }, SYNC_YEAR_LEVEL_DELAY_SECONDS * 1000);
    };

    // Don't leave a pending sync ticking toward firing after this component
    // (e.g. the whole table page) unmounts.
    useEffect(() => {
        return () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
        };
    }, []);

    const formatDate = (d: Date) =>
        d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });

    // Human-readable label for the current range, prefixed with which
    // column it's filtering — used both on the trigger button and in the
    // active-filters row below.
    const rangeLabel = range?.from
        ? `${DATE_FIELD_LABELS[dateField]}: ${formatDate(range.from)}${
              range.to ? ` – ${formatDate(range.to)}` : ''
          }`
        : null;

    // College badge wants the human-readable name, not the raw value.
    const selectedCollegeName =
        collegeOptions.find((c) => c.value === selectedCollege)?.name ??
        selectedCollege;

    // Small reusable chip for the active-filters row — label + click-to-clear.
    const FilterChip = ({
        label,
        onClear,
        variant = 'secondary',
        showXIcon = true,
        onClick,
    }: {
        label: string;
        onClear?: () => void;
        variant?: 'secondary' | 'destructive';
        showXIcon?: boolean;
        onClick?: () => void;
    }) => (
        <Badge
            variant={variant}
            className="cursor-default gap-1 rounded-full p-1.5 px-2 text-xs"
            onClick={() => onClick?.()}
        >
            <span>{label}</span>
            {showXIcon && (
                <button
                    type="button"
                    onClick={() => onClear?.()}
                    className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                    aria-label={`Remove filter: ${label}`}
                >
                    <XIcon className="h-3 w-3" />
                </button>
            )}
        </Badge>
    );

    return (
        <div className="flex flex-col gap-3">
            {/* Top Row: Search + Actions */}

            <div className="flex flex-col items-start justify-between gap-3 xl:flex-row">
                <Input
                    type="search"
                    placeholder="Search ID Number, Name..."
                    className="w-full rounded-full ps-4!"
                    value={searchValue || ''}
                    onChange={(e) => {
                        onSearchChange(
                            e.target.value === ''
                                ? null
                                : e.target.value.toUpperCase(),
                        );
                    }}
                />

                <div className="flex w-full flex-wrap items-center justify-between gap-3 md:w-auto md:grow md:flex-nowrap">
                    {/* Per Page */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-full!">
                                Show {perPage}{' '}
                                <ChevronsLeftRight className="rotate-90 transform" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-max" align="end">
                            {perPageOptions.map((option) => (
                                <DropdownMenuItem
                                    key={option}
                                    onClick={() => onPerPageChange(option)}
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

                    {/* Sort */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-full!">
                                <ArrowUpDownIcon /> Sort
                                <ChevronDownIcon />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-auto" align="end">
                            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                            <DropdownMenuGroup>
                                <div className="flex items-center gap-3">
                                    <Select
                                        value={sort}
                                        onValueChange={onSortChange}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select field" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {sortOptions.map((option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={order}
                                        onValueChange={(v) =>
                                            onOrderChange(v as 'asc' | 'desc')
                                        }
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Order" />
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
                                        onSortChange('created_at');
                                        onOrderChange('desc');
                                    }}
                                >
                                    Reset <Trash2Icon />
                                </Button>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                aria-label="More actions"
                                className="rounded-full"
                            >
                                <EllipsisIcon />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onBatchPrint}>
                                <PrinterCheckIcon />
                                Batch Print
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault();
                                    setIsExportDialogOpen(true);
                                }}
                            >
                                <DownloadCloudIcon />
                                Export Status
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={handleSyncYearLevel}>
                                <RefreshCcwIcon />
                                Sync Year Level
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Bottom Row: Filters */}
            <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-start">
                <div className="flex w-full grow flex-wrap gap-3 xl:w-auto">
                    {/* Type Filter */}
                    {typeOptions.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="rounded-full!"
                                >
                                    Student Type{' '}
                                    {selectedType && (
                                        <Badge className="ml-2">
                                            {selectedType}
                                        </Badge>
                                    )}
                                    <ChevronsLeftRight className="rotate-90 transform" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-max" align="end">
                                {typeOptions.map((item) => (
                                    <DropdownMenuCheckboxItem
                                        key={item}
                                        checked={selectedType === item}
                                        onSelect={() =>
                                            onTypeChange(
                                                selectedType === item
                                                    ? null
                                                    : item,
                                            )
                                        }
                                    >
                                        {item}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* College Filter */}
                    {collegeOptions.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="rounded-full!"
                                >
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
                                {collegeOptions.map((item) => (
                                    <DropdownMenuCheckboxItem
                                        key={item.value}
                                        checked={selectedCollege === item.value}
                                        onSelect={() => {
                                            onProgramChange(null);
                                            onMajorChange(null);
                                            onCollegeChange(
                                                selectedCollege === item.value
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
                    )}

                    {/* Program Filter */}
                    {programOptions?.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="rounded-full!"
                                >
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
                                {programOptions.map((item) => (
                                    <DropdownMenuCheckboxItem
                                        key={item.name}
                                        checked={selectedProgram === item.name}
                                        onSelect={() => {
                                            onMajorChange(null);

                                            onProgramChange(
                                                selectedProgram === item.name
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

                    {/* Major Filter */}
                    {majorOptions?.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="rounded-full!"
                                >
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
                                {majorOptions.map((item) => (
                                    <DropdownMenuCheckboxItem
                                        key={item}
                                        checked={selectedMajor === item}
                                        onSelect={() => {
                                            onMajorChange(
                                                selectedMajor === item
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

                    {/* Year Level Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-full!">
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
                        <DropdownMenuContent className="w-max" align="start">
                            {yearOptions.map((item) => (
                                <DropdownMenuCheckboxItem
                                    key={item}
                                    checked={selectedYear === item}
                                    onSelect={() =>
                                        onYearChange(
                                            selectedYear === item ? null : item,
                                        )
                                    }
                                >
                                    {item}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Printed Status Filter — mirrors the batch print
                        dialog's is_printed filter, so both stay consistent. */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-full!">
                                <ChartLineIcon />
                                Status
                                {isPrinted === true && (
                                    <Badge className="ml-2">
                                        <CheckIcon className="h-2.5 w-2.5" />{' '}
                                        Printed
                                    </Badge>
                                )}
                                {isPrinted === false && (
                                    <Badge variant="outline" className="ml-2">
                                        <ClockIcon className="h-2.5 w-2.5" />{' '}
                                        Pending
                                    </Badge>
                                )}
                                <ChevronDownIcon />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-max" align="start">
                            {PRINTED_STATUS_OPTIONS.map((item) => (
                                <DropdownMenuCheckboxItem
                                    key={item.label}
                                    checked={isPrinted === item.value}
                                    onSelect={() =>
                                        onPrintedChange(
                                            isPrinted === item.value
                                                ? null
                                                : item.value,
                                        )
                                    }
                                >
                                    {item.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Date Range — the field selector inside the dropdown
                        decides whether the picked dates filter on
                        created_at or updated_at. */}
                    <div className="flex items-center">
                        <DropdownMenu
                            open={isCalendarOpen}
                            onOpenChange={setIsCalendarOpen}
                        >
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={`w-max justify-between rounded-full ${range && 'rounded-e-none border-e-0'}`}
                                >
                                    <CalendarIcon />
                                    {rangeLabel ?? DATE_FIELD_LABELS[dateField]}
                                    <ChevronDownIcon />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-auto space-y-3 p-3">
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs whitespace-nowrap text-muted-foreground">
                                        Filter by
                                    </Label>
                                    <Select
                                        value={dateField}
                                        onValueChange={(v) =>
                                            onDateFieldChange(v as DateField)
                                        }
                                    >
                                        <SelectTrigger className="h-8 w-[150px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="created_at">
                                                Date Created
                                            </SelectItem>
                                            <SelectItem value="updated_at">
                                                Date Updated
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Calendar
                                    mode="range"
                                    selected={range}
                                    captionLayout="dropdown"
                                    onSelect={(newRange) => {
                                        if (!newRange) return;
                                        onRangeChange(newRange as DateRange);
                                    }}
                                />
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {range && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => onRangeChange(undefined)}
                                className="rounded-e-full"
                            >
                                <XIcon />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Total Entries */}
                <p className="text-sm whitespace-nowrap">
                    Total Entries:{' '}
                    <Badge>{Number(totalEntries).toLocaleString()}</Badge>
                </p>
            </div>

            {/* Active Filters — mirrors exactly what's being sent to
                filterPaginate right now, each removable individually. */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed p-3">
                    <span className="text-xs font-medium whitespace-nowrap text-muted-foreground">
                        Active filters:
                    </span>

                    {searchValue && (
                        <FilterChip
                            label={`Search: ${searchValue}`}
                            onClear={() => onSearchChange(null)}
                        />
                    )}

                    {selectedType && (
                        <FilterChip
                            label={`Type: ${selectedType}`}
                            onClear={() => onTypeChange(null)}
                        />
                    )}

                    {selectedCollege && (
                        <FilterChip
                            label={`College: ${selectedCollegeName}`}
                            onClear={() => {
                                onCollegeChange(null);
                                onProgramChange(null);
                                onMajorChange(null);
                            }}
                        />
                    )}

                    {selectedProgram && (
                        <FilterChip
                            label={`Program: ${selectedProgram}`}
                            onClear={() => {
                                onProgramChange(null);
                                onMajorChange(null);
                            }}
                        />
                    )}

                    {selectedMajor && (
                        <FilterChip
                            label={`Major: ${selectedMajor}`}
                            onClear={() => onMajorChange(null)}
                        />
                    )}

                    {selectedYear && (
                        <FilterChip
                            label={`Year Level: ${selectedYear}`}
                            onClear={() => onYearChange(null)}
                        />
                    )}

                    {isPrinted !== null && (
                        <FilterChip
                            label={`Status: ${
                                isPrinted ? 'Printed' : 'Pending'
                            }`}
                            onClear={() => onPrintedChange(null)}
                        />
                    )}

                    {rangeLabel && (
                        <FilterChip
                            label={rangeLabel}
                            onClear={() => onRangeChange(undefined)}
                        />
                    )}

                    {(perPage !== 10 ||
                        sort !== 'created_at' ||
                        order !== 'desc') && (
                        <FilterChip
                            label={`Sort: ${
                                sortOptions.find((o) => o.value === sort)
                                    ?.label ?? sort
                            } (${order}) · Show ${perPage}`}
                            onClear={() => {
                                onPerPageChange(10);
                                onSortChange('created_at');
                                onOrderChange('desc');
                            }}
                        />
                    )}

                    <FilterChip
                        label={`Clear filters`}
                        onClick={onReset}
                        variant="destructive"
                        showXIcon={false}
                    />
                </div>
            )}

            {/* Export Status Dialog */}
            <Dialog
                open={isExportDialogOpen}
                onOpenChange={setIsExportDialogOpen}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Export Status</DialogTitle>
                        <DialogDescription>
                            Choose which programs, statuses, year level, and
                            columns to include in the exported spreadsheet.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[70vh]">
                        <div className="flex flex-col gap-3 pr-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">
                                    Programs
                                </Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleSelectAllPrograms}
                                >
                                    {allProgramsSelected
                                        ? 'Deselect All'
                                        : 'Select All'}
                                </Button>
                            </div>

                            <ScrollArea className="h-40 rounded-md border p-3">
                                <div className="flex flex-col gap-2">
                                    {allProgramNames.length === 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            No programs available.
                                        </p>
                                    )}
                                    {allProgramNames.map((name) => (
                                        <div
                                            key={name}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox
                                                id={`export-program-${name}`}
                                                checked={exportSelectedPrograms.includes(
                                                    name,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleProgram(name)
                                                }
                                            />
                                            <Label
                                                htmlFor={`export-program-${name}`}
                                                className="text-sm font-normal"
                                            >
                                                {name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>

                            <p className="text-xs text-muted-foreground">
                                {exportSelectedPrograms.length === 0
                                    ? 'No programs selected, export will include all programs.'
                                    : `${exportSelectedPrograms.length} program(s) selected.`}
                            </p>

                            <Separator />

                            {/* Status Filter */}
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">
                                    Status
                                </Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        setExportSelectedStatuses(
                                            allStatusesSelected
                                                ? []
                                                : [...EXPORT_STATUS_OPTIONS],
                                        )
                                    }
                                >
                                    {allStatusesSelected
                                        ? 'Deselect All'
                                        : 'Select All'}
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-3 rounded-md border p-3">
                                {EXPORT_STATUS_OPTIONS.map((status) => (
                                    <div
                                        key={status}
                                        className="flex items-center gap-2"
                                    >
                                        <Checkbox
                                            id={`export-status-${status}`}
                                            checked={exportSelectedStatuses.includes(
                                                status,
                                            )}
                                            onCheckedChange={() =>
                                                toggleStatus(status)
                                            }
                                        />
                                        <Label
                                            htmlFor={`export-status-${status}`}
                                            className="text-sm font-normal"
                                        >
                                            {status}
                                        </Label>
                                    </div>
                                ))}
                            </div>

                            <p className="text-xs text-muted-foreground">
                                {exportSelectedStatuses.length === 0
                                    ? 'No statuses selected, export will include all statuses.'
                                    : `${exportSelectedStatuses.length} status(es) selected.`}
                            </p>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">
                                    Year Level
                                </Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        setExportYearLevels(
                                            allYearLevelsSelected
                                                ? []
                                                : EXPORT_YEAR_LEVELS.map(
                                                      (y) => y.value,
                                                  ),
                                        )
                                    }
                                >
                                    {allYearLevelsSelected
                                        ? 'Deselect All'
                                        : 'Select All'}
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-3 rounded-md border p-3">
                                {EXPORT_YEAR_LEVELS.map((yearLevel) => (
                                    <div
                                        key={yearLevel.value}
                                        className="flex items-center gap-2"
                                    >
                                        <Checkbox
                                            id={`export-year-level-${yearLevel.value}`}
                                            checked={exportYearLevels.includes(
                                                yearLevel.value,
                                            )}
                                            onCheckedChange={() =>
                                                toggleYearLevel(yearLevel.value)
                                            }
                                        />
                                        <Label
                                            htmlFor={`export-year-level-${yearLevel.value}`}
                                            className="text-sm font-normal"
                                        >
                                            {yearLevel.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>

                            <p className="text-xs text-muted-foreground">
                                {exportYearLevels.length === 0
                                    ? 'No year levels selected, export will include all year levels.'
                                    : `${exportYearLevels.length} year level(s) selected.`}
                            </p>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">
                                    Columns
                                </Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleSelectAllColumns}
                                >
                                    {allColumnsSelected
                                        ? 'Deselect All'
                                        : 'Select All'}
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                                {EXPORT_COLUMNS.map((column) => (
                                    <div
                                        key={column.key}
                                        className="flex items-center gap-2"
                                    >
                                        <Checkbox
                                            id={`export-column-${column.key}`}
                                            checked={exportSelectedColumns.includes(
                                                column.key,
                                            )}
                                            onCheckedChange={() =>
                                                toggleColumn(column.key)
                                            }
                                        />
                                        <Label
                                            htmlFor={`export-column-${column.key}`}
                                            className="text-sm font-normal"
                                        >
                                            {column.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>

                            <p className="text-xs text-muted-foreground">
                                {exportSelectedColumns.length === 0
                                    ? 'Select at least one column to export.'
                                    : `${exportSelectedColumns.length} column(s) selected.`}
                            </p>
                        </div>
                    </ScrollArea>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsExportDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleExport}
                            disabled={exportSelectedColumns.length === 0}
                        >
                            <DownloadCloudIcon />
                            Export
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
