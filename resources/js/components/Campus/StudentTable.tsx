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
import { useInitials } from '@/hooks/use-initials';
import { StudentProps } from '@/lib/custom-types';
import { ChangeLogsModal } from '@/pages/Campus/Modal/ChangeLogsModal';
import { StudentEditModal } from '@/pages/Campus/Modal/StudentEditModal';
import { router } from '@inertiajs/react';
import dayjs from 'dayjs';
import {
    CheckIcon,
    ClockIcon,
    EllipsisIcon,
    HistoryIcon,
    PrinterIcon,
    UserSearch,
    X,
} from 'lucide-react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

// Used only until the table has rendered real rows at least once.
const DEFAULT_SKELETON_ROWS = 10;
const DEFAULT_ROW_HEIGHT = 48; // unprinted row: 32px avatar + 16px padding

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
}: StudentTableProps) {
    const headers = [
        'Name',
        'Campus / Department',
        'Program / Major',
        'Year Level',
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

    const visibleIdNumbers = useMemo(
        () => students.map((s) => s.id_number),
        [students],
    );

    const allVisibleSelected =
        visibleIdNumbers.length > 0 &&
        visibleIdNumbers.every((id) => selectedSet.has(id));
    const someVisibleSelected =
        !allVisibleSelected &&
        visibleIdNumbers.some((id) => selectedSet.has(id));

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
            const visibleSet = new Set(visibleIdNumbers);
            updateSelection(selected.filter((id) => !visibleSet.has(id)));
        } else {
            const missing = visibleIdNumbers.filter(
                (id) => !selectedSet.has(id),
            );
            updateSelection([...selected, ...missing]);
        }
    };

    const clearSelection = () => updateSelection([]);

    const handleStatus = (status: 'pending' | 'printed', id_number: string) => {
        router.put(
            route('update.student.new.status', {
                status,
                id_number,
            }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    onChangeStatus();
                },
            },
        );
    };

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

            <ChangeLogsModal
                student={logsStudent}
                open={logsOpen}
                onOpenChange={setLogsOpen}
            />

            {/* Selection bar — selection persists across pages, so show the
                running total and a way to reset it. */}
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
                                        isLoading || students.length === 0
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
                                const isSelected = selectedSet.has(
                                    row.id_number,
                                );

                                return (
                                    <tr
                                        key={row.id_number}
                                        className={`hover:bg-muted/50 ${isSelected ? 'bg-muted/30' : ''}`}
                                    >
                                        <td className="w-8 p-2">
                                            <Checkbox
                                                checked={isSelected}
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
                                                            .join(' ')}
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
                                                                  'MMM D, YYYY · h:mm A',
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
                                                                  'MMM D, YYYY · h:mm A',
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
                                                                'MMM D, YYYY · h:mm A',
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
                                                            <EllipsisIcon />
                                                        </Button>
                                                    </DropdownMenuTrigger>

                                                    <DropdownMenuContent
                                                        className="w-max"
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
                                                            View
                                                        </DropdownMenuItem>

                                                        {onPrint && (
                                                            <DropdownMenuItem
                                                                disabled={
                                                                    !row.is_completed
                                                                }
                                                                onClick={() =>
                                                                    onPrint(
                                                                        row.id,
                                                                    )
                                                                }
                                                            >
                                                                <PrinterIcon />
                                                                Print
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
                                                            Update Logs
                                                        </DropdownMenuItem>

                                                        {/* {row.printed_exists ? (
                                                            <DropdownMenuItem
                                                                disabled={
                                                                    !row.is_completed
                                                                }
                                                                onClick={() =>
                                                                    handleStatus(
                                                                        'pending',
                                                                        row.id_number,
                                                                    )
                                                                }
                                                            >
                                                                <ClockIcon />
                                                                Mark as Pending
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem
                                                                disabled={
                                                                    !row.is_completed
                                                                }
                                                                onClick={() =>
                                                                    handleStatus(
                                                                        'printed',
                                                                        row.id_number,
                                                                    )
                                                                }
                                                            >
                                                                <CheckCheckIcon />
                                                                Mark as Printed
                                                            </DropdownMenuItem>
                                                        )} */}
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
                                                {/* Same box sizes as the real footer:
                                                    text-sm line (h-5) and pagination
                                                    buttons (py-1 + 16px line = h-6). */}
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
        </>
    );
}
