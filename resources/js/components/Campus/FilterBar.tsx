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
    ChevronDownIcon,
    ChevronsLeftRight,
    FilterXIcon,
    PrinterCheckIcon,
    Trash2Icon,
    XIcon,
} from 'lucide-react';
import { useState } from 'react';

type DateRange = {
    from: Date;
    to?: Date;
};

interface FilterOption {
    label: string;
    value: string;
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

    // Date Range
    range: DateRange | undefined;
    onRangeChange: (range: DateRange | undefined) => void;

    // Reset
    hasActiveFilters: boolean;
    onReset: () => void;

    // Total entries
    totalEntries?: number;
    onBatchPrint: () => void;
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
        { label: 'College', value: 'college' },
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
    range,
    onRangeChange,
    hasActiveFilters,
    onReset,
    onBatchPrint,
    totalEntries = 0,
}: FilterBarProps) {
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
                            <Button variant="outline">
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
                            <Button variant="outline">
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
                                        onSortChange('updated_at');
                                        onOrderChange('desc');
                                    }}
                                >
                                    Reset <Trash2Icon />
                                </Button>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button onClick={onBatchPrint}>
                        <PrinterCheckIcon /> Batch Print
                    </Button>
                </div>
            </div>

            {/* Bottom Row: Filters */}
            <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-start">
                <div className="flex w-full grow flex-wrap gap-3 xl:w-auto">
                    {/* Type Filter */}
                    {typeOptions.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
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

                    {/* Year Filter */}
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

                    {/* Date Range */}
                    <div className="flex items-center">
                        <DropdownMenu
                            open={isCalendarOpen}
                            onOpenChange={setIsCalendarOpen}
                        >
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

                    {/* Reset Filters */}
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
