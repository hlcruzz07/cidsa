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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    PrinterCheckIcon,
    Search,
    Trash2Icon,
    XIcon,
} from 'lucide-react';
import { useState } from 'react';

export interface FilterOption {
    label: string;
    value: string;
}

export type DateRange = {
    from: Date;
    to?: Date;
};

export type DateField = 'created_at' | 'printed_at' | 'updated_at';

const DATE_FIELD_LABELS: Record<DateField, string> = {
    created_at: 'Date Requested',
    printed_at: 'Date Printed',
    updated_at: 'Date Updated',
};

const DEFAULT_SORT_OPTIONS: FilterOption[] = [
    { label: 'Date Requested', value: 'created_at' },
    { label: 'Date Printed', value: 'printed_at' },
    { label: 'ID Number', value: 'id_number' },
    { label: 'Last Name', value: 'last_name' },
    { label: 'College', value: 'college' },
    { label: 'Program', value: 'program' },
    { label: 'Year Level', value: 'year' },
    { label: 'Reason', value: 'reason' },
    { label: 'Printed Status', value: 'is_printed' },
];

const DEFAULT_REASON_OPTIONS = [
    'Lost ID',
    'Damaged ID',
    'Change Information / Photo',
    'Shift Course / Transfer',
    'Correction',
];

interface ReplacementFilterBarProps {
    // Search
    searchValue: string | null;
    onSearchChange: (value: string | null) => void;

    // Per page
    perPage: number;
    onPerPageChange: (value: number) => void;
    perPageOptions?: number[];

    // Sort
    sort: string;
    onSortChange: (value: string) => void;
    order: 'asc' | 'desc';
    onOrderChange: (value: 'asc' | 'desc') => void;
    sortOptions?: FilterOption[];

    // Student Type
    typeOptions?: string[];
    selectedType: string | null;
    onTypeChange: (value: string | null) => void;

    // College
    collegeOptions?: { name: string; value: string }[];
    selectedCollege: string | null;
    onCollegeChange: (value: string | null) => void;

    // Program
    programOptions?: { name: string }[];
    selectedProgram: string | null;
    onProgramChange: (value: string | null) => void;

    // Major
    majorOptions?: string[];
    selectedMajor: string | null;
    onMajorChange: (value: string | null) => void;

    // Year
    yearOptions?: string[];
    selectedYear: string | null;
    onYearChange: (value: string | null) => void;

    // Status
    isPrinted: boolean | null;
    onPrintedChange: (value: boolean | null) => void;

    // Reason
    reasonOptions?: string[];
    selectedReason?: string | null;
    onReasonChange?: (value: string | null) => void;

    // Date Range & Field
    range: DateRange | undefined;
    onRangeChange: (range: DateRange | undefined) => void;
    dateField: DateField;
    onDateFieldChange: (field: DateField) => void;

    // Reset
    hasActiveFilters: boolean;
    onReset: () => void;

    // Batch print & selection
    selectedIdNumbers?: string[];
    onBatchPrint: () => void;

    totalEntries?: number;
}

export function ReplacementFilterBar({
    searchValue,
    onSearchChange,
    perPage,
    onPerPageChange,
    perPageOptions = [10, 25, 50, 100],
    sort,
    onSortChange,
    order,
    onOrderChange,
    sortOptions = DEFAULT_SORT_OPTIONS,
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
    reasonOptions = DEFAULT_REASON_OPTIONS,
    selectedReason,
    onReasonChange,
    range,
    onRangeChange,
    dateField,
    onDateFieldChange,
    hasActiveFilters,
    onReset,
    selectedIdNumbers = [],
    onBatchPrint,
    totalEntries = 0,
}: ReplacementFilterBarProps) {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const formatDate = (d: Date) =>
        d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });

    const rangeLabel = range?.from
        ? `${DATE_FIELD_LABELS[dateField]}: ${formatDate(range.from)}${
              range.to ? ` – ${formatDate(range.to)}` : ''
          }`
        : null;

    const selectedCollegeName =
        collegeOptions.find((c) => c.value === selectedCollege)?.name ??
        selectedCollege;

    // Small reusable chip for the active-filters row
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
                <div className="relative w-full min-w-[200px] flex-1">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search ID Number, Name, Reason, Receipt..."
                        className="w-full rounded-full pl-9"
                        value={searchValue || ''}
                        onChange={(e) =>
                            onSearchChange(
                                e.target.value === ''
                                    ? null
                                    : e.target.value.toUpperCase(),
                            )
                        }
                    />
                    {searchValue && (
                        <button
                            type="button"
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => onSearchChange(null)}
                            aria-label="Clear search"
                        >
                            <XIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="flex w-max flex-wrap items-center justify-between gap-3">
                    {/* Per Page */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full!"
                            >
                                Show {perPage}
                                <ChevronsLeftRight className="rotate-90 transform" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-max" align="end">
                            {perPageOptions.map((opt) => (
                                <DropdownMenuItem
                                    key={opt}
                                    onClick={() => onPerPageChange(opt)}
                                    className={
                                        perPage === opt
                                            ? 'font-medium text-primary'
                                            : ''
                                    }
                                >
                                    {opt}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Sort */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full!"
                            >
                                <ArrowUpDownIcon /> Sort <ChevronDownIcon />
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
                                                {sortOptions.map((o) => (
                                                    <SelectItem
                                                        key={o.value}
                                                        value={o.value}
                                                    >
                                                        {o.label}
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

                    {/* Batch Print Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full!"
                        onClick={onBatchPrint}
                        disabled={selectedIdNumbers.length === 0}
                    >
                        <PrinterCheckIcon />
                        Print
                        {selectedIdNumbers.length > 0 && (
                            <Badge className="ml-1 px-1.5 py-0 text-[10px]">
                                {selectedIdNumbers.length}
                            </Badge>
                        )}
                    </Button>
                </div>
            </div>

            {/* Bottom Row: Filters */}
            <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-start">
                <div className="flex w-full grow flex-wrap gap-2 xl:w-auto">
                    {/* Student Type */}
                    {typeOptions.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full!"
                                >
                                    Student Type
                                    {selectedType && (
                                        <Badge className="ml-1 text-[10px]">
                                            {selectedType}
                                        </Badge>
                                    )}
                                    <ChevronsLeftRight className="rotate-90 transform" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-max"
                                align="start"
                            >
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

                    {/* College */}
                    {collegeOptions.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full!"
                                >
                                    <BookMarkedIcon /> College
                                    {selectedCollege && (
                                        <Badge className="ml-1 text-[10px]">
                                            {selectedCollege}
                                        </Badge>
                                    )}
                                    <ChevronDownIcon className="h-3.5 w-3.5" />
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

                    {/* Program */}
                    {programOptions?.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full!"
                                >
                                    <BookOpenCheck /> Programs
                                    {selectedProgram && (
                                        <Badge className="ml-1 text-[10px]">
                                            {selectedProgram}
                                        </Badge>
                                    )}
                                    <ChevronDownIcon className="h-3.5 w-3.5" />
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

                    {/* Major */}
                    {majorOptions.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full!"
                                >
                                    <BookOpenCheck /> Majors
                                    {selectedMajor && (
                                        <Badge className="ml-1 text-[10px]">
                                            {selectedMajor}
                                        </Badge>
                                    )}
                                    <ChevronDownIcon className="h-3.5 w-3.5" />
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
                                        onSelect={() =>
                                            onMajorChange(
                                                selectedMajor === item
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

                    {/* Year Level */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full!"
                            >
                                <BookOpenCheck /> Year Level
                                {selectedYear && (
                                    <Badge className="ml-1 text-[10px]">
                                        {selectedYear}
                                    </Badge>
                                )}
                                <ChevronDownIcon className="h-3.5 w-3.5" />
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

                    {/* Status (is_printed) */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full!"
                            >
                                <ChartLineIcon />
                                Status
                                <div className="flex gap-1">
                                    {isPrinted === true && (
                                        <Badge
                                            variant="default"
                                            className="text-[10px]"
                                        >
                                            <CheckIcon className="h-2.5 w-2.5" />{' '}
                                            Printed
                                        </Badge>
                                    )}

                                    {isPrinted === false && (
                                        <Badge
                                            variant="outline"
                                            className="text-[10px]"
                                        >
                                            <ClockIcon className="h-2.5 w-2.5" />{' '}
                                            Pending
                                        </Badge>
                                    )}
                                </div>
                                <ChevronDownIcon className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent className="w-44" align="start">
                            {[
                                { label: 'Printed', value: true },
                                { label: 'Pending', value: false },
                            ].map((item) => (
                                <DropdownMenuCheckboxItem
                                    key={item.label}
                                    checked={isPrinted === item.value}
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        onPrintedChange(
                                            isPrinted === item.value
                                                ? null
                                                : item.value,
                                        );
                                    }}
                                >
                                    {item.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Date Range with DateField selector */}
                    <div className="flex items-center">
                        <DropdownMenu
                            open={isCalendarOpen}
                            onOpenChange={setIsCalendarOpen}
                        >
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={`w-max justify-between rounded-full! ${
                                        range && 'rounded-e-none border-e-0'
                                    }`}
                                >
                                    <CalendarIcon className="h-3.5 w-3.5" />
                                    {rangeLabel ?? DATE_FIELD_LABELS[dateField]}
                                    <ChevronDownIcon className="h-3.5 w-3.5" />
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
                                        <SelectTrigger className="h-8 w-[160px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="created_at">
                                                Date Requested
                                            </SelectItem>
                                            <SelectItem value="printed_at">
                                                Date Printed
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
                                size="sm"
                                onClick={() => onRangeChange(undefined)}
                                className="rounded-e-full"
                            >
                                <XIcon className="h-3.5 w-3.5" />
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

            {/* Active Filters Chip Row */}
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

                    {selectedReason && (
                        <FilterChip
                            label={`Reason: ${selectedReason}`}
                            onClear={() => onReasonChange?.(null)}
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
                        label="Clear filters"
                        onClick={onReset}
                        variant="destructive"
                        showXIcon={false}
                    />
                </div>
            )}
        </div>
    );
}
