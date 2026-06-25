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
    FilterXIcon,
    PrinterCheckIcon,
    Trash2Icon,
    XIcon,
} from 'lucide-react';
import { useState } from 'react';

type DateRange = { from: Date; to?: Date };

interface FilterOption {
    label: string;
    value: string;
}

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

    // Date range
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
        { label: 'Date Updated', value: 'updated_at' },
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

    return (
        <div className="flex flex-col gap-3">
            {/* Top Row: Search + Actions */}
            <div className="flex flex-col items-start justify-between gap-3 xl:flex-row">
                <Input
                    type="search"
                    placeholder="Search ID Number, Name..."
                    className="w-full"
                    value={searchValue || ''}
                    onChange={(e) =>
                        onSearchChange(
                            e.target.value === ''
                                ? null
                                : e.target.value.toUpperCase(),
                        )
                    }
                />

                <div className="flex w-full flex-wrap items-center justify-between gap-3 md:w-auto md:grow md:flex-nowrap">
                    {/* Per Page */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
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
                            <Button variant="outline">
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
                                        onSortChange('updated_at');
                                        onOrderChange('desc');
                                    }}
                                >
                                    Reset <Trash2Icon />
                                </Button>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Batch Print */}
                    <Button onClick={onBatchPrint}>
                        <PrinterCheckIcon /> Batch Print
                    </Button>
                </div>
            </div>

            {/* Bottom Row: Filters */}
            <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-start">
                <div className="flex w-full grow flex-wrap gap-3 xl:w-auto">
                    {/* College */}
                    {collegeOptions.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <BookMarkedIcon /> College{' '}
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

                    {/* Program */}
                    {programOptions?.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <BookOpenCheck /> Programs{' '}
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

                    {/* Major */}
                    {majorOptions?.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <BookOpenCheck /> Majors <ChevronDownIcon />
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
                            <Button variant="outline">
                                <BookOpenCheck /> Year Level <ChevronDownIcon />
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

                    {/* Status — is_printed + is_completed */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <ChartLineIcon /> Status
                                <div className="space-x-1">
                                    {isPrinted === true && (
                                        <Badge variant="default">
                                            <CheckIcon className="h-3 w-3" />{' '}
                                            Printed
                                        </Badge>
                                    )}
                                    {isPrinted === false && (
                                        <Badge variant="destructive">
                                            <AlertCircleIcon className="h-3 w-3" />{' '}
                                            Printed
                                        </Badge>
                                    )}
                                </div>
                                <ChevronDownIcon />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-max" align="start">
                            {/* Printed */}
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    Printed
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    {[
                                        { label: 'Yes', value: true },
                                        { label: 'No', value: false },
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
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Date Range */}
                    <div className="flex items-center">
                        <DropdownMenu
                            open={isCalendarOpen}
                            onOpenChange={setIsCalendarOpen}
                        >
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={`w-max justify-between ${range ? 'rounded-e-none border-e-0' : ''}`}
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
                                        onRangeChange(newRange as DateRange);
                                        setIsCalendarOpen(false);
                                    }}
                                />
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {range && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => onRangeChange(undefined)}
                                className="rounded-s-none"
                            >
                                <XIcon />
                            </Button>
                        )}
                    </div>

                    {/* Reset */}
                    {hasActiveFilters && (
                        <Button
                            type="button"
                            onClick={onReset}
                            variant="destructive"
                        >
                            <FilterXIcon /> Reset Filter
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
