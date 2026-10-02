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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useInitials } from '@/hooks/use-initials';
import { StudentProps, StudentReplacement } from '@/lib/custom-types';
import { cn } from '@/lib/utils';
import { ChangeLogsModal } from '@/pages/Campus/Modal/ChangeLogsModal';
import { StudentEditModal } from '@/pages/Campus/Modal/StudentEditModal';
import dayjs from 'dayjs';
import {
    CheckIcon,
    ClockIcon,
    EllipsisVertical,
    EyeIcon,
    FileTextIcon,
    HistoryIcon,
    type LucideIcon,
    MessagesCircle,
    PrinterIcon,
    UserSearch,
    X,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { StudentNoticeDialog } from './StudentNoticeDialog';

// Used only until the table has rendered real rows at least once.
const DEFAULT_SKELETON_ROWS = 10;
const DEFAULT_ROW_HEIGHT = 48;

const DATE_FORMAT = 'MMM D, YYYY · h:mm A';

// Active = not soft-deleted and of the type this table works with.
const getActiveNotices = (student: StudentProps, type: string) =>
    (student.notices ?? []).filter((n) => !n.deleted_at && n.type === type);

// Two-line label for dropdown actions: what it does + a short hint on when
// it's available, so staff can tell what each action is for.
function ActionLabel({ title, hint }: { title: string; hint: string }) {
    return (
        <span className="flex flex-col">
            <span>{title}</span>
            <span className="text-[10px] font-normal text-muted-foreground">
                {hint}
            </span>
        </span>
    );
}

// Compact count pill with a tooltip for context. Dimmed at 0 so only
// non-empty relations stand out.
function CountChip({
    icon: Icon,
    count,
    label,
    alert = false,
    children,
}: {
    icon: LucideIcon;
    count: number;
    label: string; // singular, e.g. "active notice"
    alert?: boolean;
    children?: React.ReactNode;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span
                    tabIndex={0}
                    className={cn(
                        'inline-flex cursor-default items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        count === 0
                            ? 'border-transparent text-muted-foreground/40'
                            : alert
                              ? 'border-destructive/40 bg-destructive/10 text-destructive'
                              : 'bg-muted text-foreground',
                    )}
                >
                    <Icon className="size-3" />
                    {count}
                </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs space-y-1.5">
                <p className="font-semibold">
                    {count} {label}
                    {count === 1 ? '' : 's'}
                </p>
                {children}
            </TooltipContent>
        </Tooltip>
    );
}

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
    /**
     * Selected students, stored as id_number. Pass this together with
     * onSelectionChange to control the selection from the parent (e.g. to
     * print the selected IDs). If omitted, the table keeps its own state.
     */
    selectedIdNumbers?: string[];
    onSelectionChange?: (idNumbers: string[]) => void;
    /** Notice type saved with each notice sent from this table. */
    noticeType?: string;
}

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
    noticeType = 'replacement',
}: ReplacementTableProps) {
    const headers = [
        'Name',
        'Campus / Department',
        'Program / Major',
        'Year Level',
        'Reason',
        'Receipt',
        'Records',
        'Date',
        'Action',
    ];

    const getInitials = useInitials();

    // View-details modal
    const [selectedStudent, setSelectedStudent] = useState<StudentProps | null>(
        null,
    );
    const [editOpen, setEditOpen] = useState(false);

    // Change-logs modal, kept separate so either modal opens independently.
    const [logsStudent, setLogsStudent] = useState<StudentProps | null>(null);
    const [logsOpen, setLogsOpen] = useState(false);

    // Receipt preview
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
    const [receiptOpen, setReceiptOpen] = useState(false);

    // Notice modal. Only the replacement id is stored, and the row is looked up
    // from the current `replacements` list on every render, so after a notice
    // is sent/resolved and the parent refetches, the modal shows fresh data
    // instead of a stale snapshot. The ref keeps the last known row so the
    // modal doesn't blank out while the list is reloading.
    const [noticeReplacementId, setNoticeReplacementId] = useState<
        number | null
    >(null);
    const [noticeOpen, setNoticeOpen] = useState(false);
    const lastNoticeReplacement = useRef<StudentReplacement | null>(null);
    const foundNoticeReplacement =
        replacements.find((r) => r.id === noticeReplacementId) ?? null;
    if (foundNoticeReplacement)
        lastNoticeReplacement.current = foundNoticeReplacement;
    const noticeReplacement =
        foundNoticeReplacement ?? lastNoticeReplacement.current;

    // Students with an active notice can't be printed or selected for
    // batch printing until the notice is resolved.
    const noticeBlocked = useMemo(
        () =>
            new Set(
                replacements
                    .filter(
                        (r) =>
                            r.student &&
                            getActiveNotices(r.student, noticeType).length > 0,
                    )
                    .map((r) => r.student!.id_number),
            ),
        [replacements, noticeType],
    );

    // ─── Loading skeleton sizing ──────────────────────────────────────────────
    // Measure the real tbody after each successful render and reuse that row
    // count / row height for the skeleton.
    const tbodyRef = useRef<HTMLTableSectionElement>(null);
    const lastLayout = useRef({
        rows: DEFAULT_SKELETON_ROWS,
        rowHeight: DEFAULT_ROW_HEIGHT,
        hadFooter: false,
    });

    useLayoutEffect(() => {
        if (isLoading || replacements.length === 0 || !tbodyRef.current) return;
        lastLayout.current = {
            rows: replacements.length,
            rowHeight: tbodyRef.current.offsetHeight / replacements.length,
            hadFooter: links.length > 0,
        };
    }, [isLoading, replacements, links]);

    // ─── Selection ────────────────────────────────────────────────────────────
    // Stored as id_number so it persists across pages and filter changes.
    const [internalSelected, setInternalSelected] = useState<string[]>([]);
    const isControlled = selectedIdNumbers !== undefined;
    const selected = isControlled ? selectedIdNumbers : internalSelected;

    const selectedSet = useMemo(() => new Set(selected), [selected]);

    const updateSelection = (next: string[]) => {
        if (!isControlled) setInternalSelected(next);
        onSelectionChange?.(next);
    };

    // If a student gets a notice while already selected, drop them from the
    // selection so they can't slip into a batch print.
    useEffect(() => {
        if (noticeBlocked.size === 0) return;
        if (selected.some((id) => noticeBlocked.has(id))) {
            updateSelection(selected.filter((id) => !noticeBlocked.has(id)));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [noticeBlocked, selected]);

    // Only rows without an active notice can be selected.
    const selectableIdNumbers = useMemo(
        () =>
            replacements
                .map((r) => r.student?.id_number)
                .filter((id): id is string => !!id && !noticeBlocked.has(id)),
        [replacements, noticeBlocked],
    );

    const allVisibleSelected =
        selectableIdNumbers.length > 0 &&
        selectableIdNumbers.every((id) => selectedSet.has(id));
    const someVisibleSelected =
        !allVisibleSelected &&
        selectableIdNumbers.some((id) => selectedSet.has(id));

    const toggleOne = (idNumber: string, checked: boolean) => {
        if (checked) {
            if (!selectedSet.has(idNumber)) {
                updateSelection([...selected, idNumber]);
            }
        } else {
            updateSelection(selected.filter((id) => id !== idNumber));
        }
    };

    const toggleVisible = () => {
        if (allVisibleSelected) {
            const visibleSet = new Set(selectableIdNumbers);
            updateSelection(selected.filter((id) => !visibleSet.has(id)));
        } else {
            const missing = selectableIdNumbers.filter(
                (id) => !selectedSet.has(id),
            );
            updateSelection([...selected, ...missing]);
        }
    };

    const clearSelection = () => updateSelection([]);
    const showFooter =
        links.length > 0 || (isLoading && lastLayout.current.hadFooter);

    return (
        <TooltipProvider delayDuration={150}>
            <StudentEditModal
                student={selectedStudent}
                open={editOpen}
                onOpenChange={setEditOpen}
                onSuccess={onChangeStatus}
            />

            <ChangeLogsModal
                student={logsStudent}
                open={logsOpen}
                onOpenChange={setLogsOpen}
            />

            <StudentNoticeDialog
                student={noticeReplacement?.student ?? null}
                open={noticeOpen}
                onOpenChange={setNoticeOpen}
                type={noticeType}
                printed={!!noticeReplacement?.is_printed}
                onSuccess={onChangeStatus}
            />

            {/* Receipt Preview Dialog */}
            <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
                <DialogContent className="max-w-2xl!">
                    <DialogHeader>
                        <DialogTitle>Payment Receipt</DialogTitle>
                        <DialogDescription>
                            Proof of payment submitted by the student for ID
                            replacement.
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
                        {selected.length} selected
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
                                    onCheckedChange={toggleVisible}
                                    disabled={
                                        isLoading ||
                                        selectableIdNumbers.length === 0
                                    }
                                    aria-label="Select visible replacement requests"
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
                    <tbody ref={tbodyRef} className="lg:border-b">
                        {isLoading ? (
                            Array.from({ length: lastLayout.current.rows }).map(
                                (_, i) => (
                                    <tr
                                        key={`skeleton-${i}`}
                                        style={{
                                            height: lastLayout.current
                                                .rowHeight,
                                        }}
                                    >
                                        <td className="w-8 p-2">
                                            <Skeleton className="size-4 rounded-[4px]" />
                                        </td>
                                        {/* Name */}
                                        <td className="p-2">
                                            <div className="flex items-center gap-2">
                                                <Skeleton className="size-8 shrink-0 rounded-full" />
                                                <div className="flex flex-col gap-1.5">
                                                    <Skeleton className="h-3 w-32" />
                                                    <Skeleton className="h-2.5 w-24" />
                                                </div>
                                            </div>
                                        </td>
                                        {/* Campus / Department */}
                                        <td className="p-2">
                                            <div className="flex flex-col gap-1.5">
                                                <Skeleton className="h-3 w-28" />
                                                <Skeleton className="h-3 w-36" />
                                            </div>
                                        </td>
                                        {/* Program / Major */}
                                        <td className="p-2">
                                            <div className="flex flex-col gap-1.5">
                                                <Skeleton className="h-3 w-40" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                        </td>
                                        {/* Year Level */}
                                        <td className="p-2">
                                            <Skeleton className="h-3 w-14" />
                                        </td>
                                        {/* Reason */}
                                        <td className="p-2">
                                            <Skeleton className="h-5 w-24 rounded" />
                                        </td>
                                        {/* Receipt */}
                                        <td className="p-2">
                                            <Skeleton className="h-7 w-16 rounded-md" />
                                        </td>
                                        {/* Records */}
                                        <td className="p-2">
                                            <div className="flex items-center gap-1">
                                                <Skeleton className="h-5 w-9 rounded-md" />
                                                <Skeleton className="h-5 w-9 rounded-md" />
                                                <Skeleton className="h-5 w-9 rounded-md" />
                                            </div>
                                        </td>
                                        {/* Date */}
                                        <td className="p-2">
                                            <div className="flex flex-col gap-1.5">
                                                <Skeleton className="h-2.5 w-40" />
                                                <Skeleton className="h-2.5 w-40" />
                                            </div>
                                        </td>
                                        {/* Action */}
                                        <td className="p-2">
                                            <Skeleton className="size-8 rounded-md" />
                                        </td>
                                    </tr>
                                ),
                            )
                        ) : replacements.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={headers.length + 1}
                                    className="border p-3 text-center"
                                >
                                    No replacement requests found.
                                </td>
                            </tr>
                        ) : (
                            replacements.map((r) => {
                                const student = r.student;
                                const idNumber = student?.id_number;

                                const hasNotice =
                                    !!idNumber && noticeBlocked.has(idNumber);
                                const isSelected =
                                    !!idNumber &&
                                    !hasNotice &&
                                    selectedSet.has(idNumber);

                                const activeNotices = student
                                    ? getActiveNotices(student, noticeType)
                                    : [];
                                const activeNoticeCount = activeNotices.length;
                                const resolvedNotices = (
                                    student?.resolved_notices ?? []
                                ).filter((n) => n.type === noticeType);
                                const resolvedNoticeCount =
                                    resolvedNotices.length;
                                const changeLogCount =
                                    student?.change_logs?.length ?? 0;
                                const noticeCreatedAt =
                                    activeNotices[0]?.created_at;

                                const fullName = [
                                    student?.first_name,
                                    student?.middle_init,
                                    student?.last_name,
                                    student?.suffix,
                                ]
                                    .filter(Boolean)
                                    .join(' ')
                                    .toUpperCase();

                                const printHint = hasNotice
                                    ? 'Blocked: resolve the notice first'
                                    : "Preview and print this student's ID";
                                const noticeHint =
                                    activeNoticeCount > 0
                                        ? 'View or resolve the active notice'
                                        : r.is_printed
                                          ? 'Unavailable: replacement already printed'
                                          : 'Flag a rule violation and hold printing';

                                return (
                                    <tr
                                        key={r.id}
                                        className={`hover:bg-muted/50 ${isSelected ? 'bg-muted/30' : ''}`}
                                    >
                                        <td className="w-8 p-2">
                                            <Checkbox
                                                checked={isSelected}
                                                disabled={
                                                    !idNumber || hasNotice
                                                }
                                                title={
                                                    hasNotice
                                                        ? 'Resolve the notice to select this student'
                                                        : undefined
                                                }
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
                                                                student?.picture,
                                                            )}
                                                            className="object-cover"
                                                            loading="lazy"
                                                            decoding="async"
                                                            alt={fullName}
                                                        />
                                                        <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                                            {getInitials(
                                                                fullName,
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </div>

                                                <div>
                                                    <h4 className="font-medium">
                                                        {fullName}
                                                    </h4>

                                                    <div className="flex items-center gap-2">
                                                        <small className="text-muted-foreground">
                                                            {idNumber}
                                                        </small>

                                                        <small className="text-muted-foreground">
                                                            •
                                                        </small>

                                                        <small
                                                            className={`font-bold ${r.is_printed ? 'text-primary' : 'text-muted-foreground'}`}
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
                                                    {student?.campus ?? '—'}
                                                </span>
                                                {student?.college_name && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {student.college_name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td
                                            className="p-2 whitespace-nowrap"
                                            data-label="Program / Major"
                                        >
                                            <div className="flex max-w-[300px] flex-col">
                                                <span
                                                    className="truncate font-medium text-foreground"
                                                    title={student?.program}
                                                >
                                                    {student?.program}
                                                </span>
                                                {student?.major ? (
                                                    <span
                                                        className="truncate text-xs text-muted-foreground"
                                                        title={student.major}
                                                    >
                                                        {student.major}
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
                                            {student?.year ?? '—'}
                                        </td>

                                        <td className="p-2" data-label="Reason">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span
                                                        tabIndex={0}
                                                        className="inline-block max-w-[170px] cursor-default truncate rounded bg-muted/50 px-2 py-0.5 align-middle text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                    >
                                                        {r.reason ?? '—'}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="max-w-xs break-words whitespace-pre-wrap">
                                                        {r.reason ?? '—'}
                                                    </p>
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
                                                        setReceiptUrl(
                                                            r.receipt,
                                                        );
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

                                        <td
                                            className="p-2 whitespace-nowrap"
                                            data-label="Records"
                                        >
                                            <div className="flex items-center gap-1">
                                                <CountChip
                                                    icon={MessagesCircle}
                                                    count={activeNoticeCount}
                                                    label="active notice"
                                                    alert
                                                >
                                                    {activeNoticeCount === 0 ? (
                                                        <p className="opacity-70">
                                                            No notice. This
                                                            student can be
                                                            printed.
                                                        </p>
                                                    ) : (
                                                        <>
                                                            {activeNotices.map(
                                                                (n) => (
                                                                    <div
                                                                        key={
                                                                            n.id
                                                                        }
                                                                        className="space-y-0.5"
                                                                    >
                                                                        <p className="line-clamp-3 break-words whitespace-pre-wrap">
                                                                            {
                                                                                n.message
                                                                            }
                                                                        </p>
                                                                        <p className="text-[10px] opacity-70">
                                                                            {n
                                                                                .user
                                                                                ?.name ??
                                                                                'Unknown user'}
                                                                            {n.created_at &&
                                                                                ` · ${dayjs(n.created_at).format(DATE_FORMAT)}`}
                                                                        </p>
                                                                    </div>
                                                                ),
                                                            )}
                                                            <p className="text-[10px] opacity-70">
                                                                Printing is on
                                                                hold until
                                                                resolved.
                                                            </p>
                                                        </>
                                                    )}
                                                </CountChip>

                                                <CountChip
                                                    icon={CheckIcon}
                                                    count={resolvedNoticeCount}
                                                    label="resolved notice"
                                                >
                                                    {resolvedNoticeCount ===
                                                    0 ? (
                                                        <p className="opacity-70">
                                                            No resolved notices
                                                            yet.
                                                        </p>
                                                    ) : (
                                                        <>
                                                            {resolvedNotices
                                                                .slice(0, 3)
                                                                .map((n) => (
                                                                    <div
                                                                        key={
                                                                            n.id
                                                                        }
                                                                        className="space-y-0.5"
                                                                    >
                                                                        <p className="line-clamp-2 break-words whitespace-pre-wrap">
                                                                            {
                                                                                n.message
                                                                            }
                                                                        </p>
                                                                        {n.deleted_at && (
                                                                            <p className="text-[10px] opacity-70">
                                                                                Resolved{' '}
                                                                                {dayjs(
                                                                                    n.deleted_at,
                                                                                ).format(
                                                                                    DATE_FORMAT,
                                                                                )}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            {resolvedNoticeCount >
                                                                3 && (
                                                                <p className="text-[10px] opacity-70">
                                                                    +
                                                                    {resolvedNoticeCount -
                                                                        3}{' '}
                                                                    more in the
                                                                    Notice
                                                                    dialog.
                                                                </p>
                                                            )}
                                                        </>
                                                    )}
                                                </CountChip>

                                                <CountChip
                                                    icon={HistoryIcon}
                                                    count={changeLogCount}
                                                    label="update log"
                                                >
                                                    <p className="opacity-70">
                                                        {changeLogCount === 0
                                                            ? "This student's record has not been changed."
                                                            : 'Open Update Logs in the actions menu to see what changed.'}
                                                    </p>
                                                </CountChip>
                                            </div>
                                        </td>

                                        <td
                                            className="p-2 text-[10px]! whitespace-nowrap"
                                            data-label="Date"
                                        >
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-16 shrink-0 font-medium text-muted-foreground">
                                                        Requested
                                                    </span>
                                                    <span className="text-foreground">
                                                        {r.created_at
                                                            ? dayjs(
                                                                  r.created_at,
                                                              ).format(
                                                                  DATE_FORMAT,
                                                              )
                                                            : '—'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-16 shrink-0 font-medium text-muted-foreground">
                                                        Printed
                                                    </span>
                                                    {r.printed_at ? (
                                                        <span className="font-medium text-green-600 dark:text-green-500">
                                                            {dayjs(
                                                                r.printed_at,
                                                            ).format(
                                                                DATE_FORMAT,
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground italic">
                                                            Not yet printed
                                                        </span>
                                                    )}
                                                </div>

                                                {noticeCreatedAt && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-16 shrink-0 font-medium text-muted-foreground">
                                                            Noticed
                                                        </span>
                                                        <span className="font-medium text-destructive">
                                                            {dayjs(
                                                                noticeCreatedAt,
                                                            ).format(
                                                                DATE_FORMAT,
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        <td
                                            className="p-2 whitespace-nowrap"
                                            data-label="Action"
                                        >
                                            <div className="flex items-center gap-1">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            aria-label="Actions"
                                                        >
                                                            <EllipsisVertical />
                                                        </Button>
                                                    </DropdownMenuTrigger>

                                                    <DropdownMenuContent
                                                        className="w-64"
                                                        align="end"
                                                    >
                                                        <DropdownMenuLabel>
                                                            Actions
                                                        </DropdownMenuLabel>
                                                        <DropdownMenuSeparator />

                                                        {student && (
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedStudent(
                                                                        student,
                                                                    );
                                                                    setEditOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                            >
                                                                <UserSearch />
                                                                <ActionLabel
                                                                    title="View"
                                                                    hint="See this student's full record"
                                                                />
                                                            </DropdownMenuItem>
                                                        )}

                                                        {onPrint && student && (
                                                            <DropdownMenuItem
                                                                disabled={
                                                                    hasNotice
                                                                }
                                                                onClick={() =>
                                                                    onPrint(
                                                                        student,
                                                                    )
                                                                }
                                                            >
                                                                <PrinterIcon />
                                                                <ActionLabel
                                                                    title="Preview & Print ID"
                                                                    hint={
                                                                        printHint
                                                                    }
                                                                />
                                                            </DropdownMenuItem>
                                                        )}

                                                        {r.receipt && (
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setReceiptUrl(
                                                                        r.receipt,
                                                                    );
                                                                    setReceiptOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                            >
                                                                <FileTextIcon />
                                                                <ActionLabel
                                                                    title="View Receipt"
                                                                    hint="See the proof of payment"
                                                                />
                                                            </DropdownMenuItem>
                                                        )}

                                                        {student && (
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setLogsStudent(
                                                                        student,
                                                                    );
                                                                    setLogsOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                            >
                                                                <HistoryIcon />
                                                                <ActionLabel
                                                                    title="Update Logs"
                                                                    hint="See changes made to this record"
                                                                />
                                                                {changeLogCount >
                                                                    0 && (
                                                                    <Badge>
                                                                        {
                                                                            changeLogCount
                                                                        }
                                                                    </Badge>
                                                                )}
                                                            </DropdownMenuItem>
                                                        )}

                                                        {student && (
                                                            <DropdownMenuItem
                                                                disabled={
                                                                    !!r.is_printed &&
                                                                    activeNoticeCount ===
                                                                        0
                                                                }
                                                                onClick={() => {
                                                                    setNoticeReplacementId(
                                                                        r.id,
                                                                    );
                                                                    setNoticeOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                            >
                                                                <MessagesCircle />
                                                                <ActionLabel
                                                                    title="Notice"
                                                                    hint={
                                                                        noticeHint
                                                                    }
                                                                />
                                                                {activeNoticeCount >
                                                                    0 && (
                                                                    <Badge>
                                                                        {
                                                                            activeNoticeCount
                                                                        }
                                                                    </Badge>
                                                                )}
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>

                    {showFooter && (
                        <tfoot>
                            <tr>
                                <td
                                    colSpan={headers.length + 1}
                                    className="px-6 py-4"
                                >
                                    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                                        {isLoading ? (
                                            <>
                                                <Skeleton className="h-5 w-32" />
                                                <Skeleton className="h-6 w-56" />
                                            </>
                                        ) : (
                                            <>
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
                                                                    !link.url ||
                                                                    !onPageChange
                                                                }
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault();
                                                                    if (
                                                                        page &&
                                                                        onPageChange
                                                                    ) {
                                                                        onPageChange(
                                                                            page,
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
                                                                <span
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: link.label,
                                                                    }}
                                                                />
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </TooltipProvider>
    );
}
