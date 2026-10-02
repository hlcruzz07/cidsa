import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { StudentProps } from '@/lib/custom-types';
import { cn } from '@/lib/utils';
import { ChangeLogsModal } from '@/pages/Campus/Modal/ChangeLogsModal';
import { StudentEditModal } from '@/pages/Campus/Modal/StudentEditModal';
import dayjs from 'dayjs';
import {
    CheckIcon,
    ClockIcon,
    EllipsisVertical,
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
const DEFAULT_ROW_HEIGHT = 48; // unprinted row: 32px avatar + 16px padding

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

interface StudentTableProps {
    students: StudentProps[];
    total?: number;
    from?: number;
    to?: number;
    links?: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    onPageChange?: (page: string) => void;
    isLoading?: boolean;
    onChangeStatus: () => void;
    onPrint?: (id: number) => void;
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

export function StudentTable({
    students,
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
    noticeType = 'new_student',
}: StudentTableProps) {
    const headers = [
        'Name',
        'Campus / Department',
        'Program / Major',
        'Year Level',
        'Records',
        'Date',
        'Action',
    ];

    const getInitials = useInitials();

    const [selectedStudent, setSelectedStudent] = useState<StudentProps | null>(
        null,
    );
    const [editOpen, setEditOpen] = useState(false);

    // Change-logs modal state kept separate from selectedStudent/editOpen
    // above so opening one doesn't affect the other — a row action can
    // trigger either modal independently.
    const [logsStudent, setLogsStudent] = useState<StudentProps | null>(null);
    const [logsOpen, setLogsOpen] = useState(false);

    // Notice modal. Only the id_number is stored, and the student is looked up
    // from the current `students` list on every render, so after a notice is
    // sent/resolved and the parent refetches, the modal shows fresh data
    // instead of a stale snapshot. The ref keeps the last known row so the
    // modal doesn't blank out while the list is reloading.
    const [noticeIdNumber, setNoticeIdNumber] = useState<string | null>(null);
    const [noticeOpen, setNoticeOpen] = useState(false);
    const lastNoticeStudent = useRef<StudentProps | null>(null);
    const foundNoticeStudent =
        students.find((s) => s.id_number === noticeIdNumber) ?? null;
    if (foundNoticeStudent) lastNoticeStudent.current = foundNoticeStudent;
    const noticeStudent = foundNoticeStudent ?? lastNoticeStudent.current;

    // Students with an active notice can't be printed or selected for
    // batch printing until the notice is resolved.
    const noticeBlocked = useMemo(
        () =>
            new Set(
                students
                    .filter((s) => getActiveNotices(s, noticeType).length > 0)
                    .map((s) => s.id_number),
            ),
        [students, noticeType],
    );

    // ─── Loading skeleton sizing ──────────────────────────────────────────────
    // Rows vary in height (a printed row has an extra "Printed" date line), so
    // instead of guessing, measure the real tbody after each successful render
    // and reuse that row count / row height for the skeleton.
    const tbodyRef = useRef<HTMLTableSectionElement>(null);
    const lastLayout = useRef({
        rows: DEFAULT_SKELETON_ROWS,
        rowHeight: DEFAULT_ROW_HEIGHT,
        hadFooter: false,
    });

    useLayoutEffect(() => {
        if (isLoading || students.length === 0 || !tbodyRef.current) return;
        lastLayout.current = {
            rows: students.length,
            rowHeight: tbodyRef.current.offsetHeight / students.length,
            hadFooter: links.length > 0,
        };
    }, [isLoading, students, links]);

    // ─── Selection ────────────────────────────────────────────────────────────
    // Stored as id_number so it persists across pages and filter changes —
    // it isn't tied to whatever rows are currently in `students`.
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
            students
                .filter((s) => !noticeBlocked.has(s.id_number))
                .map((s) => s.id_number),
        [students, noticeBlocked],
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
                student={noticeStudent}
                open={noticeOpen}
                onOpenChange={setNoticeOpen}
                type={noticeType}
                onSuccess={onChangeStatus}
            />

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
                                    aria-label="Select visible students"
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
                                            <div className="flex items-center gap-1">
                                                <Skeleton className="size-8 rounded-md" />
                                                <Skeleton className="size-8 rounded-md" />
                                            </div>
                                        </td>
                                    </tr>
                                ),
                            )
                        ) : students.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={headers.length + 1}
                                    className="border p-3 text-center"
                                >
                                    No records found.
                                </td>
                            </tr>
                        ) : (
                            students.map((row) => {
                                const hasNotice = noticeBlocked.has(
                                    row.id_number,
                                );
                                const isSelected =
                                    !hasNotice &&
                                    selectedSet.has(row.id_number);
                                const activeNotices = getActiveNotices(
                                    row,
                                    noticeType,
                                );
                                const activeNoticeCount = activeNotices.length;
                                const resolvedNotices = (
                                    row.resolved_notices ?? []
                                ).filter((n) => n.type === noticeType);
                                const resolvedNoticeCount =
                                    resolvedNotices.length;
                                const changeLogCount =
                                    row.change_logs?.length ?? 0;
                                const noticeCreatedAt =
                                    activeNotices[0]?.created_at;
                                const printHint = !row.is_completed
                                    ? 'Unavailable: form not completed'
                                    : hasNotice
                                      ? 'Blocked: resolve the notice first'
                                      : "Print this student's ID";
                                const noticeHint =
                                    activeNoticeCount > 0
                                        ? 'View or resolve the active notice'
                                        : row.printed
                                          ? 'Unavailable: ID already printed'
                                          : 'Flag a rule violation and hold printing';

                                return (
                                    <tr
                                        key={row.id_number}
                                        className={`hover:bg-muted/50 ${isSelected ? 'bg-muted/30' : ''}`}
                                    >
                                        <td className="w-8 p-2">
                                            <Checkbox
                                                checked={isSelected}
                                                disabled={hasNotice}
                                                title={
                                                    hasNotice
                                                        ? 'Resolve the notice to select this student'
                                                        : undefined
                                                }
                                                onCheckedChange={(checked) =>
                                                    toggleOne(
                                                        row.id_number,
                                                        checked === true,
                                                    )
                                                }
                                                aria-label={`Select ${row.first_name} ${row.last_name}`}
                                            />
                                        </td>
                                        <td
                                            className="p-2 whitespace-nowrap"
                                            data-label="Name"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="relative">
                                                    {row.printed ? (
                                                        <CheckIcon className="absolute -top-1 -right-2 z-10 size-3.5 rounded-full border bg-primary p-0.5 text-white" />
                                                    ) : (
                                                        <ClockIcon className="absolute -top-1 -right-2 z-10 size-3.5 rounded-full border bg-muted p-0.5 text-white" />
                                                    )}

                                                    <Avatar className="size-8 overflow-hidden rounded-full">
                                                        <AvatarImage
                                                            src={route(
                                                                'gdrive.image',
                                                                row.picture,
                                                            )}
                                                            className="object-cover"
                                                            loading="lazy"
                                                            decoding="async"
                                                            alt={[
                                                                row.first_name,
                                                                row.middle_init,
                                                                row.last_name,
                                                                row.suffix,
                                                            ]
                                                                .filter(Boolean)
                                                                .join(' ')}
                                                        />
                                                        <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                                            {getInitials(
                                                                [
                                                                    row.first_name,
                                                                    row.middle_init,
                                                                    row.last_name,
                                                                    row.suffix,
                                                                ]
                                                                    .filter(
                                                                        Boolean,
                                                                    )
                                                                    .join(' '),
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </div>

                                                <div>
                                                    <h4 className="font-medium">
                                                        {[
                                                            row.first_name,
                                                            row.middle_init,
                                                            row.last_name,
                                                            row.suffix,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' ')
                                                            .toUpperCase()}
                                                    </h4>

                                                    <div className="flex items-center gap-2">
                                                        <small className="text-muted-foreground">
                                                            {row.id_number}
                                                        </small>

                                                        <small className="text-muted-foreground">
                                                            •
                                                        </small>

                                                        <small
                                                            className={`font-bold ${row.printed ? 'text-primary' : 'text-muted-foreground'}`}
                                                        >
                                                            {row.printed
                                                                ? 'Printed'
                                                                : 'Pending'}
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td
                                            className="p-2 whitespace-nowrap"
                                            data-label="Campus"
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">
                                                    {row.campus}
                                                </span>
                                                {row.college_name && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {row.college_name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td
                                            className="p-2 whitespace-nowrap"
                                            data-label="Program"
                                        >
                                            <div className="flex max-w-[300px] flex-col">
                                                <span
                                                    className="truncate font-medium text-foreground"
                                                    title={row.program}
                                                >
                                                    {row.program}
                                                </span>
                                                {row.major ? (
                                                    <span
                                                        className="truncate text-xs text-muted-foreground"
                                                        title={row.major}
                                                    >
                                                        {row.major}
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
                                            {row.year}
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

                                        <td className="p-2 text-[10px]! whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-14 shrink-0 font-medium text-muted-foreground">
                                                        Created
                                                    </span>
                                                    <span className="text-foreground">
                                                        {row.created_at
                                                            ? dayjs(
                                                                  row.created_at,
                                                              ).format(
                                                                  DATE_FORMAT,
                                                              )
                                                            : '—'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-14 shrink-0 font-medium text-muted-foreground">
                                                        Updated
                                                    </span>

                                                    <span
                                                        className={
                                                            row.updated_at &&
                                                            row.created_at &&
                                                            !dayjs(
                                                                row.updated_at,
                                                            ).isSame(
                                                                dayjs(
                                                                    row.created_at,
                                                                ),
                                                            )
                                                                ? 'text-amber-600 dark:text-amber-400'
                                                                : 'text-foreground'
                                                        }
                                                    >
                                                        {row.updated_at
                                                            ? dayjs(
                                                                  row.updated_at,
                                                              ).format(
                                                                  DATE_FORMAT,
                                                              )
                                                            : '—'}
                                                    </span>
                                                </div>

                                                {row.printed?.created_at && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-14 shrink-0 font-medium text-muted-foreground">
                                                            Printed
                                                        </span>
                                                        <span className="font-medium text-green-600 dark:text-green-500">
                                                            {dayjs(
                                                                row.printed
                                                                    .created_at,
                                                            ).format(
                                                                DATE_FORMAT,
                                                            )}
                                                        </span>
                                                    </div>
                                                )}

                                                {noticeCreatedAt && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-14 shrink-0 font-medium text-muted-foreground">
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

                                        <td className="p-2 whitespace-nowrap">
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
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedStudent(
                                                                    row,
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

                                                        {onPrint && (
                                                            <DropdownMenuItem
                                                                disabled={
                                                                    !row.is_completed ||
                                                                    hasNotice
                                                                }
                                                                onClick={() =>
                                                                    onPrint(
                                                                        row.id,
                                                                    )
                                                                }
                                                            >
                                                                <PrinterIcon />
                                                                <ActionLabel
                                                                    title="Print"
                                                                    hint={
                                                                        printHint
                                                                    }
                                                                />
                                                            </DropdownMenuItem>
                                                        )}

                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setLogsStudent(
                                                                    row,
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

                                                        <DropdownMenuItem
                                                            disabled={
                                                                !!row.printed &&
                                                                activeNoticeCount ===
                                                                    0
                                                            }
                                                            onClick={() => {
                                                                setNoticeIdNumber(
                                                                    row.id_number,
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
