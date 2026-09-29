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
    ArrowUpDownIcon,
    CalendarIcon,
    ChartLineIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronsLeftRight,
    ClockIcon,
    HashIcon,
    MapPinIcon,
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

interface InventoryFilterBarProps {
    // Campus
    campusOptions: string[];
    selectedCampus: string | null;
    onCampusChange: (v: string | null) => void;

    // Status (pending = not yet received, received = confirmed)
    status: string | null;
    onStatusChange: (v: string | null) => void;

    // Search
    searchValue: string | null;
    onSearchChange: (v: string | null) => void;

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

    // Received date range (YYYY-MM-DD strings)
    dateFrom: string | null;
    onDateFromChange: (v: string | null) => void;
    dateTo: string | null;
    onDateToChange: (v: string | null) => void;

    // Quantity range
    minQuantity: string | null;
    onMinQuantityChange: (v: string | null) => void;
    maxQuantity: string | null;
    onMaxQuantityChange: (v: string | null) => void;

    // Reset
    hasActiveFilters: boolean;
    onReset: () => void;

    // Total entries
    totalEntries?: number;
}

const STATUS_OPTIONS: { label: string; value: 'pending' | 'received' }[] = [
    { label: 'Pending', value: 'pending' },
    { label: 'Received', value: 'received' },
];

const DEFAULT_SORT_OPTIONS: FilterOption[] = [
    { label: 'Date Created', value: 'created_at' },
    { label: 'Date Received', value: 'received_at' },
    { label: 'Quantity', value: 'quantity' },
    { label: 'Reference No.', value: 'ref_no' },
    { label: 'Delivered By', value: 'delivered_by' },
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

export function InventoryFilterBar({
    campusOptions,
    selectedCampus,
    onCampusChange,
    status,
    onStatusChange,
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
    dateFrom,
    onDateFromChange,
    dateTo,
    onDateToChange,
    minQuantity,
    onMinQuantityChange,
    maxQuantity,
    onMaxQuantityChange,
    hasActiveFilters,
    onReset,
    totalEntries = 0,
}: InventoryFilterBarProps) {
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
        ? `Received: ${formatDate(range.from)}${
              range.to ? ` – ${formatDate(range.to)}` : ''
          }`
        : null;

    const hasQuantityFilter = !!(minQuantity || maxQuantity);
    const quantityLabel = hasQuantityFilter
        ? `Quantity: ${minQuantity || '0'} – ${maxQuantity || '∞'}`
        : null;

    const statusLabel =
        STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;

    return (
        <div className="flex flex-col gap-3">
            {/* Top Row: Search + Actions */}
            <div className="flex flex-col items-start justify-between gap-3 xl:flex-row">
                <Input
                    type="search"
                    placeholder="Search Reference No., Delivered By, Remarks..."
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
                </div>
            </div>

            {/* Bottom Row: Filters */}
            <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-start">
                <div className="flex w-full grow flex-wrap gap-3 xl:w-auto">
                    {/* Campus Filter */}
                    {campusOptions.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="rounded-full!"
                                >
                                    <MapPinIcon />
                                    Campus
                                    <ChevronDownIcon />
                                    {selectedCampus && (
                                        <Badge className="ml-2">
                                            {selectedCampus}
                                        </Badge>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-max"
                                align="start"
                            >
                                {campusOptions.map((item) => (
                                    <DropdownMenuCheckboxItem
                                        key={item}
                                        checked={selectedCampus === item}
                                        onSelect={() =>
                                            onCampusChange(
                                                selectedCampus === item
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

                    {/* Status Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-full!">
                                <ChartLineIcon />
                                Status
                                {status === 'received' && (
                                    <Badge className="ml-2">
                                        <CheckIcon className="h-2.5 w-2.5" />{' '}
                                        Received
                                    </Badge>
                                )}
                                {status === 'pending' && (
                                    <Badge variant="outline" className="ml-2">
                                        <ClockIcon className="h-2.5 w-2.5" />{' '}
                                        Pending
                                    </Badge>
                                )}
                                <ChevronDownIcon />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-max" align="start">
                            {STATUS_OPTIONS.map((item) => (
                                <DropdownMenuCheckboxItem
                                    key={item.value}
                                    checked={status === item.value}
                                    onSelect={() =>
                                        onStatusChange(
                                            status === item.value
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

                    {/* Quantity Range */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-full!">
                                <HashIcon />
                                Quantity
                                <ChevronDownIcon />
                                {hasQuantityFilter && (
                                    <Badge className="ml-2">
                                        {minQuantity || '0'} –{' '}
                                        {maxQuantity || '∞'}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-auto space-y-3 p-3"
                            align="start"
                            onKeyDown={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min={0}
                                    className="h-8 w-24"
                                    placeholder="Min"
                                    value={minQuantity ?? ''}
                                    onChange={(e) =>
                                        onMinQuantityChange(
                                            e.target.value || null,
                                        )
                                    }
                                />
                                <span className="text-xs text-muted-foreground">
                                    –
                                </span>
                                <Input
                                    type="number"
                                    min={0}
                                    className="h-8 w-24"
                                    placeholder="Max"
                                    value={maxQuantity ?? ''}
                                    onChange={(e) =>
                                        onMaxQuantityChange(
                                            e.target.value || null,
                                        )
                                    }
                                />
                            </div>
                            {hasQuantityFilter && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => {
                                        onMinQuantityChange(null);
                                        onMaxQuantityChange(null);
                                    }}
                                >
                                    Clear <Trash2Icon />
                                </Button>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Received Date Range */}
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
                                    {rangeLabel ?? 'Date Received'}
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

                    {selectedCampus && (
                        <FilterChip
                            label={`Campus: ${selectedCampus}`}
                            onClear={() => onCampusChange(null)}
                        />
                    )}

                    {status && (
                        <FilterChip
                            label={`Status: ${statusLabel}`}
                            onClear={() => onStatusChange(null)}
                        />
                    )}

                    {quantityLabel && (
                        <FilterChip
                            label={quantityLabel}
                            onClear={() => {
                                onMinQuantityChange(null);
                                onMaxQuantityChange(null);
                            }}
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
