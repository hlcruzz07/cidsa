import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useInitials } from '@/hooks/use-initials';
import { StudentProps, StudentReplacement } from '@/lib/custom-types';
import { StudentEditModal } from '@/pages/Campus/Modal/StudentEditModal';
import dayjs from 'dayjs';
import {
    CheckIcon,
    ClockIcon,
    EllipsisIcon,
    EyeIcon,
    FileTextIcon,
    PrinterIcon,
    UserSearch,
    X,
} from 'lucide-react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface ReplacementTableProps {
    replacements: StudentReplacement[];
    total?: number;
    from?: number;
    to?: number;
    links?: PaginationLink[];
    onPageChange: (page: string) => void;
    isLoading?: boolean;
    onPrint?: (student: StudentProps) => void;
    onChangeStatus: () => void;
    selectedIdNumbers?: string[];
    onSelectionChange?: (idNumbers: string[]) => void;
}

const DEFAULT_SKELETON_ROWS = 10;
const DEFAULT_ROW_HEIGHT = 48;

export function ReplacementTable({
    replacements,
    total = 0,
    from = 0,
    to = 0,
    links = [],
    onPageChange,
    isLoading = false,
    onPrint,
    onChangeStatus,
    selectedIdNumbers,
    onSelectionChange,
}: ReplacementTableProps) {
    const headers = [
        'Name',
        'Campus / Department',
        'Program / Major',
        'Year Level',
        'Reason',
        'Receipt',
        'Date',
        'Action',
    ];

    const getInitials = useInitials();

    // Modals
    const [selectedStudent, setSelectedStudent] = useState<StudentProps | null>(
        null,
    );
    const [editOpen, setEditOpen] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
    const [receiptOpen, setReceiptOpen] = useState(false);

    // Selection
    const [internalSelected, setInternalSelected] = useState<string[]>([]);
    const isControlled = selectedIdNumbers !== undefined;
    const selected = isControlled ? selectedIdNumbers : internalSelected;

    const updateSelection = (next: string[]) => {
        if (isControlled) {
            onSelectionChange?.(next);
        } else {
            setInternalSelected(next);
        }
    };

    const selectedSet = useMemo(() => new Set(selected), [selected]);

    const visibleIdNumbers = useMemo(
        () =>
            replacements
                .map((r) => r.student?.id_number)
                .filter((id): id is string => !!id),
        [replacements],
    );

    const allVisibleSelected =
        visibleIdNumbers.length > 0 &&
        visibleIdNumbers.every((id) => selectedSet.has(id));

    const someVisibleSelected =
        visibleIdNumbers.some((id) => selectedSet.has(id)) &&
        !allVisibleSelected;

    const toggleAllVisible = () => {
        if (allVisibleSelected) {
            const visibleSet = new Set(visibleIdNumbers);
            updateSelection(selected.filter((id) => !visibleSet.has(id)));
        } else {
            const missing = visibleIdNumbers.filter(
                (id) => !selectedSet.has(id),
            );
            updateSelection([...selected, ...missing]);
        }
    };

    const toggleOne = (id: string, checked: boolean) => {
        if (checked) {
            if (!selectedSet.has(id)) updateSelection([...selected, id]);
        } else {
            updateSelection(selected.filter((x) => x !== id));
        }
    };

    const clearSelection = () => updateSelection([]);

    // Skeleton sizing
    const tbodyRef = useRef<HTMLTableSectionElement>(null);
    const lastLayout = useRef({
        rows: DEFAULT_SKELETON_ROWS,
        rowHeight: DEFAULT_ROW_HEIGHT,
        hadFooter: false,
    });

    useLayoutEffect(() => {
        if (isLoading) return;
        const tbody = tbodyRef.current;
        if (!tbody) return;

        const renderedRows = tbody.querySelectorAll('tr').length;
        if (renderedRows > 0) {
            lastLayout.current.rows = renderedRows;
            lastLayout.current.rowHeight = Math.max(
                Math.round(tbody.getBoundingClientRect().height / renderedRows),
                DEFAULT_ROW_HEIGHT,
            );
        }
        lastLayout.current.hadFooter = links.length > 0;
    }, [isLoading, replacements, links.length]);

    const skeletonRowCount = lastLayout.current.rows;
    const skeletonRowHeight = lastLayout.current.rowHeight;

    const showFooter =
        links.length > 0 || (isLoading && lastLayout.current.hadFooter);

    return (
        <>
            <StudentEditModal
                student={selectedStudent}
                open={editOpen}
                onOpenChange={setEditOpen}
                onSuccess={onChangeStatus}
            />

            {/* Receipt Preview Dialog */}
            <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
                <DialogContent className="max-w-2xl!">
                    <DialogHeader>
                        <DialogTitle>Payment Receipt</DialogTitle>
                        <DialogDescription>
                            Proof of payment submitted by the student for ID replacement.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex max-h-[70vh] items-center justify-center overflow-auto rounded-lg border bg-muted/20 p-2">
                        {receiptUrl ? (
                            <img
                                src={receiptUrl}
                                alt="Payment receipt"
                                className="max-h-[60vh] w-auto rounded object-contain shadow-sm"
                            />
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No receipt image available.
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Selection bar */}
            {selected.length > 0 && (
                <div className="mt-3 flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-xs">
                    <span className="font-medium text-foreground">
                        {selected.length} replacement student(s) selected
                    </span>
                    <button
                        type="button"
                        className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-destructive"
                        onClick={clearSelection}
                    >
                        <X className="h-3.5 w-3.5" /> Clear
                    </button>
                </div>
            )}

            <div className="relative mt-3 overflow-x-auto md:shadow-md lg:border">
                <table
                    className="table w-full text-left text-xs text-foreground"
                    aria-busy={isLoading}
                >
                    <thead className="lg:border-b">
                        <tr>
                            <th scope="col" className="w-8 p-2">
                                <Checkbox
                                    checked={
                                        allVisibleSelected
                                            ? true
                                            : someVisibleSelected
                                              ? 'indeterminate'
                                              : false
                                    }
                                    onCheckedChange={toggleAllVisible}
                                    disabled={
                                        isLoading ||
                                        visibleIdNumbers.length === 0
                                    }
                                    aria-label="Select all visible replacement requests"
                                />
                            </th>
                            {headers.map((header) => (
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

                    {isLoading ? (
                        <tbody>
                            {Array.from({ length: skeletonRowCount }).map(
                                (_, idx) => (
                                    <tr
                                        key={`skel-${idx}`}
                                        style={{ height: skeletonRowHeight }}
                                        className="border-b last:border-b-0"
                                    >
                                        <td className="w-8 p-2">
                                            <Skeleton className="size-4 rounded-sm" />
                                        </td>
                                        <td className="p-2 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Skeleton className="size-8 shrink-0 rounded-full" />
                                                <div className="flex flex-col gap-1">
                                                    <Skeleton className="h-3.5 w-32" />
                                                    <Skeleton className="h-3 w-20" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-2 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <Skeleton className="h-3.5 w-24" />
                                                <Skeleton className="h-3 w-16" />
                                            </div>
                                        </td>
                                        <td className="p-2 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <Skeleton className="h-3.5 w-36" />
                                                <Skeleton className="h-3 w-20" />
                                            </div>
                                        </td>
                                        <td className="p-2 whitespace-nowrap">
                                            <Skeleton className="h-3.5 w-14" />
                                        </td>
                                        <td className="p-2 whitespace-nowrap">
                                            <Skeleton className="h-3.5 w-24" />
                                        </td>
                                        <td className="p-2 whitespace-nowrap">
                                            <Skeleton className="h-6 w-16 rounded-md" />
                                        </td>
                                        <td className="p-2 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <Skeleton className="h-3 w-24" />
                                                <Skeleton className="h-3 w-20" />
                                            </div>
                                        </td>
                                        <td className="p-2 whitespace-nowrap">
                                            <Skeleton className="size-7 rounded-md" />
                                        </td>
                                    </tr>
                                ),
                            )}
                        </tbody>
                    ) : (
                        <tbody ref={tbodyRef} className="lg:border-b">
                            {replacements.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={headers.length + 1}
                                        className="border p-4 text-center text-muted-foreground"
                                    >
                                        No replacement requests found.
                                    </td>
                                </tr>
                            ) : (
                                replacements.map((r) => {
                                    const idNumber = r.student?.id_number;
                                    const isSelected =
                                        !!idNumber && selectedSet.has(idNumber);

                                    const fullName = [
                                        r.student?.first_name,
                                        r.student?.middle_init,
                                        r.student?.last_name,
                                        r.student?.suffix,
                                    ]
                                        .filter(Boolean)
                                        .join(' ')
                                        .toUpperCase();

                                    return (
                                        <tr
                                            key={r.id}
                                            className={`hover:bg-muted/50 ${isSelected ? 'bg-muted/30' : ''}`}
                                        >
                                            <td className="w-8 p-2">
                                                <Checkbox
                                                    checked={isSelected}
                                                    disabled={!idNumber}
                                                    onCheckedChange={(checked) => {
                                                        if (idNumber) {
                                                            toggleOne(
                                                                idNumber,
                                                                checked === true,
                                                            );
                                                        }
                                                    }}
                                                    aria-label={`Select ${fullName || 'request'}`}
                                                />
                                            </td>

                                            <td
                                                className="p-2 whitespace-nowrap"
                                                data-label="Name"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="relative">
                                                        {r.is_printed ? (
                                                            <CheckIcon className="absolute -top-1 -right-2 z-10 size-3.5 rounded-full border bg-primary p-0.5 text-white" />
                                                        ) : (
                                                            <ClockIcon className="absolute -top-1 -right-2 z-10 size-3.5 rounded-full border bg-muted p-0.5 text-white" />
                                                        )}

                                                        <Avatar className="size-8 overflow-hidden rounded-full">
                                                            <AvatarImage
                                                                src={route(
                                                                    'gdrive.image',
                                                                    r.student?.picture,
                                                                )}
                                                                className="object-cover"
                                                                loading="lazy"
                                                                decoding="async"
                                                                alt={fullName}
                                                            />
                                                            <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                                                {getInitials(fullName)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </div>

                                                    <div>
                                                        <h4 className="font-medium text-foreground">
                                                            {fullName}
                                                        </h4>

                                                        <div className="flex items-center gap-2">
                                                            <small className="text-muted-foreground">
                                                                {r.student?.id_number}
                                                            </small>

                                                            <small className="text-muted-foreground">
                                                                •
                                                            </small>

                                                            <small
                                                                className={`font-semibold ${
                                                                    r.is_printed
                                                                        ? 'text-primary'
                                                                        : 'text-amber-600 dark:text-amber-500'
                                                                }`}
                                                            >
                                                                {r.is_printed
                                                                    ? 'Printed'
                                                                    : 'Pending'}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td
                                                className="p-2 whitespace-nowrap"
                                                data-label="Campus / Department"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-foreground">
                                                        {r.student?.campus ?? '—'}
                                                    </span>
                                                    {r.student?.college_name && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {r.student.college_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td
                                                className="p-2 whitespace-nowrap"
                                                data-label="Program / Major"
                                            >
                                                <div className="flex max-w-[280px] flex-col">
                                                    <span
                                                        className="truncate font-medium text-foreground"
                                                        title={r.student?.program}
                                                    >
                                                        {r.student?.program}
                                                    </span>
                                                    {r.student?.major ? (
                                                        <span
                                                            className="truncate text-xs text-muted-foreground"
                                                            title={r.student?.major}
                                                        >
                                                            {r.student?.major}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            --
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td
                                                className="p-2 whitespace-nowrap"
                                                data-label="Year Level"
                                            >
                                                {r.student?.year ?? '—'}
                                            </td>

                                            <td
                                                className="max-w-[180px] truncate p-2"
                                                data-label="Reason"
                                            >
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="inline-block max-w-[170px] truncate rounded bg-muted/50 px-2 py-0.5 text-xs font-medium">
                                                            {r.reason ?? '—'}
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="max-w-xs">{r.reason ?? '—'}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </td>

                                            <td
                                                className="p-2 whitespace-nowrap"
                                                data-label="Receipt"
                                            >
                                                {r.receipt ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 gap-1 px-2 text-xs"
                                                        onClick={() => {
                                                            setReceiptUrl(r.receipt);
                                                            setReceiptOpen(true);
                                                        }}
                                                    >
                                                        <EyeIcon className="h-3.5 w-3.5" />
                                                        View
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </td>

                                            <td className="p-2 text-[10px]! whitespace-nowrap" data-label="Date">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-14 shrink-0 font-medium text-muted-foreground">
                                                            Requested
                                                        </span>
                                                        <span className="text-foreground">
                                                            {r.created_at
                                                                ? dayjs(
                                                                      r.created_at,
                                                                  ).format(
                                                                      'MMM D, YYYY · h:mm A',
                                                                  )
                                                                : '—'}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-14 shrink-0 font-medium text-muted-foreground">
                                                            Printed
                                                        </span>
                                                        {r.printed_at ? (
                                                            <span className="font-medium text-green-600 dark:text-green-500">
                                                                {dayjs(
                                                                    r.printed_at,
                                                                ).format(
                                                                    'MMM D, YYYY · h:mm A',
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground italic">
                                                                Not yet printed
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="p-2 whitespace-nowrap" data-label="Action">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            aria-label="Actions"
                                                        >
                                                            <EllipsisIcon />
                                                        </Button>
                                                    </DropdownMenuTrigger>

                                                    <DropdownMenuContent
                                                        className="w-48"
                                                        align="end"
                                                    >
                                                        <DropdownMenuLabel>
                                                            Actions
                                                        </DropdownMenuLabel>

                                                        {onPrint && r.student && (
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    onPrint(
                                                                        r.student!,
                                                                    )
                                                                }
                                                            >
                                                                <PrinterIcon />
                                                                Preview & Print ID
                                                            </DropdownMenuItem>
                                                        )}

                                                        {r.receipt && (
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setReceiptUrl(r.receipt);
                                                                    setReceiptOpen(true);
                                                                }}
                                                            >
                                                                <FileTextIcon />
                                                                View Receipt
                                                            </DropdownMenuItem>
                                                        )}

                                                        {r.student && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setSelectedStudent(r.student!);
                                                                        setEditOpen(true);
                                                                    }}
                                                                >
                                                                    <UserSearch />
                                                                    View Details
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    )}

                    {showFooter && (
                        <tfoot>
                            <tr>
                                <td colSpan={headers.length + 1} className="px-6 py-4">
                                    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                                        <p className="text-sm text-muted-foreground">
                                            Showing{' '}
                                            <span className="font-medium">
                                                {from}
                                            </span>
                                            –
                                            <span className="font-medium">
                                                {to}
                                            </span>{' '}
                                            of{' '}
                                            <span className="font-medium">
                                                {total}
                                            </span>
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {links.map((link, idx) => {
                                                let page: string | null = null;
                                                if (link.url) {
                                                    const url = new URL(link.url);
                                                    page =
                                                        url.searchParams.get(
                                                            'page',
                                                        );
                                                }
                                                return (
                                                    <button
                                                        key={idx}
                                                        disabled={
                                                            !link.url ||
                                                            !onPageChange
                                                        }
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (
                                                                page &&
                                                                onPageChange
                                                            ) {
                                                                onPageChange(page);
                                                            }
                                                        }}
                                                        className={`rounded px-3 py-1 ${
                                                            link.active
                                                                ? 'bg-primary text-white dark:text-black'
                                                                : 'bg-muted text-muted-foreground hover:bg-muted/70'
                                                        }`}
                                                        type="button"
                                                    >
                                                        <span
                                                            dangerouslySetInnerHTML={{
                                                                __html: link.label,
                                                            }}
                                                        />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </>
    );
}
