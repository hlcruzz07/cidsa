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
import dayjs from 'dayjs';
import {
    ActivityIcon,
    ArrowUpDownIcon,
    CalendarIcon,
    ChevronDownIcon,
    ChevronsLeftRight,
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

interface ActivityLogFilterBarProps {
    // Search
    searchValue: string | null;
    onSearchChange: (v: string | null) => void;

    // Action
    action: string | null;
    onActionChange: (v: string | null) => void;

    // Date range (YYYY-MM-DD strings)
    dateFrom: string | null;
    onDateFromChange: (v: string | null) => void;
    dateTo: string | null;
    onDateToChange: (v: string | null) => void;

    // Per Page
    perPage: number;
    onPerPageChange: (v: number) => void;
    perPageOptions?: number[];

    // Sort
    sort: string;
    onSortChange: (v: string) => void;
    order: 'asc' | 'desc';
    onOrderChange: (v: 'asc' | 'desc') => void;
    sortOptions?: FilterOption[];

    // Reset
    hasActiveFilters: boolean;
    onReset: () => void;

    // Total entries
    totalEntries: number;
}

const ACTION_OPTIONS: FilterOption[] = [
    { value: 'login', label: 'Login' },
    { value: 'print', label: 'Print' },
    { value: 'export', label: 'Export' },
    { value: 'sync_data', label: 'Sync Data' },
];

const DEFAULT_SORT_OPTIONS: FilterOption[] = [
    { label: 'Date', value: 'created_at' },
    { label: 'Action', value: 'action' },
    { label: 'ID', value: 'id' },
];

const DATE_FORMAT = 'YYYY-MM-DD';

// Small reusable chip for the active-filters row — label + click-to-clear.
function FilterChip({
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
}) {
    return (
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
}

export function ActivityLogFilterBar({
    searchValue,
    onSearchChange,
    action,
    onActionChange,
    dateFrom,
    onDateFromChange,
    dateTo,
    onDateToChange,
    perPage,
    onPerPageChange,
    perPageOptions = [10, 25, 50, 100],
    sort,
    onSortChange,
    order,
    onOrderChange,
    sortOptions = DEFAULT_SORT_OPTIONS,
    hasActiveFilters,
    onReset,
    totalEntries,
}: ActivityLogFilterBarProps) {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // The parent stores the range as YYYY-MM-DD strings; the Calendar
    // wants Date objects.
    const range: DateRange | undefined = dateFrom
        ? {
              from: dayjs(dateFrom).toDate(),
              to: dateTo ? dayjs(dateTo).toDate() : undefined,
          }
        : undefined;

    const handleRangeChange = (newRange: DateRange | undefined) => {
        if (!newRange) return;
        onDateFromChange(
            newRange.from ? dayjs(newRange.from).format(DATE_FORMAT) : null,
        );
        onDateToChange(
            newRange.to ? dayjs(newRange.to).format(DATE_FORMAT) : null,
        );
    };

    const clearRange = () => {
        onDateFromChange(null);
        onDateToChange(null);
    };

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

    const actionLabel =
        ACTION_OPTIONS.find((o) => o.value === action)?.label ?? action;

    return (
        <div className="flex flex-col gap-3">
            {/* Top Row: Search + Actions */}
            <div className="flex flex-col items-start justify-between gap-3 xl:flex-row">
                <Input
                    id="activity-log-search"
                    type="search"
                    placeholder="Search user, student, browser, IP…"
                    className="w-full rounded-full ps-4!"
                    value={searchValue || ''}
                    onChange={(e) =>
                        onSearchChange(
                            e.target.value === '' ? null : e.target.value,
                        )
                    }
                />

                <div className="flex w-full flex-wrap items-center justify-between gap-3 md:w-auto md:grow md:flex-nowrap">
                    {/* Per Page */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                id="activity-log-per-page"
                                variant="outline"
                                className="rounded-full!"
                            >
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
                            <Button
                                id="activity-log-sort"
                                variant="outline"
                                className="rounded-full!"
                            >
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
                                                <SelectItem value="desc">
                                                    Newest first
                                                </SelectItem>
                                                <SelectItem value="asc">
                                                    Oldest first
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
                </div>
            </div>

            {/* Bottom Row: Filters */}
            <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-start">
                <div className="flex w-full grow flex-wrap gap-3 xl:w-auto">
                    {/* Action Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                id="activity-log-action"
                                variant="outline"
                                className="rounded-full!"
                            >
                                <ActivityIcon />
                                Action
                                <ChevronDownIcon />
                                {action && (
                                    <Badge className="ml-2">
                                        {actionLabel}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-max" align="start">
                            {ACTION_OPTIONS.map((item) => (
                                <DropdownMenuCheckboxItem
                                    key={item.value}
                                    checked={action === item.value}
                                    onSelect={() =>
                                        onActionChange(
                                            action === item.value
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

                    {/* Date Range */}
                    <div className="flex items-center">
                        <DropdownMenu
                            open={isCalendarOpen}
                            onOpenChange={setIsCalendarOpen}
                        >
                            <DropdownMenuTrigger asChild>
                                <Button
                                    id="activity-log-date-range"
                                    variant="outline"
                                    className={`w-max justify-between rounded-full ${range && 'rounded-e-none border-e-0'}`}
                                >
                                    <CalendarIcon />
                                    {rangeLabel ?? 'Date Range'}
                                    <ChevronDownIcon />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-auto space-y-3 p-3">
                                <Calendar
                                    mode="range"
                                    selected={range}
                                    captionLayout="dropdown"
                                    onSelect={(newRange) =>
                                        handleRangeChange(
                                            newRange as DateRange | undefined,
                                        )
                                    }
                                />
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {range && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={clearRange}
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

                    {action && (
                        <FilterChip
                            label={`Action: ${actionLabel}`}
                            onClear={() => onActionChange(null)}
                        />
                    )}

                    {rangeLabel && (
                        <FilterChip label={rangeLabel} onClear={clearRange} />
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
