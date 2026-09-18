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
    FilterXIcon,
    PrinterCheckIcon,
    Search,
    Trash2Icon,
    XIcon,
} from 'lucide-react';
import { useState } from 'react';

interface FilterOption {
    label: string;
    value: string;
}

// Date range shape — matches FilterBar's / BatchIdPrintDialog's DateRange.
// No dateField selector here since CampusStudentManager only ever passes
// `range` for replacements (no `dateField`/`onDateFieldChange`), so the
// backend's filterPaginate() default of 'created_at' applies.
type DateRange = {
    from: Date;
    to?: Date;
};

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

    // Date Range
    range: DateRange | undefined;
    onRangeChange: (range: DateRange | undefined) => void;

    // Reset
    hasActiveFilters: boolean;
    onReset: () => void;

    // Batch print
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
    sortOptions = [
        { label: '#', value: 'id' },
        { label: 'College', value: 'college' },
        { label: 'Date', value: 'created_at' },
    ],
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
    range,
    onRangeChange,
    hasActiveFilters,
    onReset,
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
        ? `Date: ${formatDate(range.from)}${
              range.to ? ` – ${formatDate(range.to)}` : ''
          }`
        : null;

    return (
        <div className="flex flex-col gap-3">
            {/* Top Row: Search + Actions */}
            <div className="flex flex-col items-start justify-between gap-3 xl:flex-row">
                <div className="relative w-full min-w-[200px] flex-1">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search ID Number, Name..."
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

                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full!"
                        onClick={onBatchPrint}
                    >
                        <PrinterCheckIcon /> Batch Print
                    </Button>
                </div>
            </div>

            {/* Bottom Row: Filters */}
            <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-start">
                <div className="flex w-full grow flex-wrap items-center gap-2 xl:w-auto">
                    {/* College */}
                    {collegeOptions.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
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
                                <Button variant="outline" size="sm">
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
                                <Button variant="outline" size="sm">
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
                            <Button variant="outline" size="sm">
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

                    {/* Status */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
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

                    {/* Date Range — no dateField selector; filters on
                        created_at (StudentRepository::filterPaginate's
                        default when dateField isn't sent). */}
                    <div className="flex items-center">
                        <DropdownMenu
                            open={isCalendarOpen}
                            onOpenChange={setIsCalendarOpen}
                        >
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={
                                        range ? 'rounded-e-none border-e-0' : ''
                                    }
                                >
                                    <CalendarIcon className="h-3.5 w-3.5" />
                                    {rangeLabel ?? 'Date'}
                                    <ChevronDownIcon className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-auto p-3">
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
                                className="rounded-s-none"
                            >
                                <XIcon className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>

                    {/* Reset */}
                    {hasActiveFilters && (
                        <Button
                            type="button"
                            onClick={onReset}
                            variant="destructive"
                            size="sm"
                        >
                            <FilterXIcon className="h-3.5 w-3.5" /> Reset
                        </Button>
                    )}
                </div>

                {/* Total Entries */}
                <p className="text-sm whitespace-nowrap">
                    Total Entries:{' '}
                    <Badge>{Number(totalEntries).toLocaleString()}</Badge>
                </p>
            </div>
        </div>
    );
}
