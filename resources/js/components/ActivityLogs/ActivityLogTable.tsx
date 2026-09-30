import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from '@/types';
import dayjs from 'dayjs';
import { EyeIcon } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';

const DEFAULT_SKELETON_ROWS = 10;
const DEFAULT_ROW_HEIGHT = 48;

export interface ActivityLogEntry {
    id: number;
    action: string;
    ip_address: string | null;
    user_agent: string | null;
    browser: string | null;
    print_type: string | null;
    created_at: string;
    user: User | null;
    student: {
        id: number;
        id_number: string;
        first_name: string;
        last_name: string;
    } | null;
}

interface ActivityLogTableProps {
    logs: ActivityLogEntry[];
    total?: number;
    from?: number;
    to?: number;
    links?: Array<{ url: string | null; label: string; active: boolean }>;
    onPageChange?: (page: string) => void;
    isLoading?: boolean;
}

const ACTION_BADGE: Record<string, string> = {
    login: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    print: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    export: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    sync_data:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

const ACTION_LABEL: Record<string, string> = {
    login: 'Login',
    print: 'Print',
    export: 'Export',
    sync_data: 'Sync Data',
};

const HEADERS = [
    '#',
    'Action',
    'User',
    'Browser',
    'IP Address',
    'Date',
    'Details',
];

const SKELETON_WIDTHS: Record<string, string> = {
    '#': 'w-8',
    Action: 'w-16',
    User: 'w-32',
    Browser: 'w-24',
    'IP Address': 'w-28',
    Date: 'w-36',
    Details: 'w-8',
};

// "id_card" / "temporary-id" -> "Id Card" / "Temporary Id"
const formatPrintType = (value: string | null) =>
    value
        ? value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : '—';

// Only print logs carry student / print type info.
const hasDetails = (log: ActivityLogEntry) => !!(log.student || log.print_type);

function ActionBadge({ action }: { action: string }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                ACTION_BADGE[action] ?? 'bg-muted text-muted-foreground'
            }`}
        >
            {ACTION_LABEL[action] ?? action}
        </span>
    );
}

function DetailRow({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-4 border-b py-2 last:border-b-0">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-right text-sm font-medium">{value}</span>
        </div>
    );
}

function formatCampus(campus: string, role: string) {
    if (role === 'super admin') {
        return 'Super Administrator';
    }

    switch (campus) {
        case 'tal':
            return 'Talisay Campus';
        case 'ali':
            return 'Alijis Campus';
        case 'ft':
            return 'Fortune Towne Campus';
        case 'bin':
            return 'Binalbagan Campus';
        default:
            return 'Unknown Campus';
    }
}

export function ActivityLogTable({
    logs,
    total = 0,
    from = 0,
    to = 0,
    links = [],
    onPageChange,
    isLoading = false,
}: ActivityLogTableProps) {
    const tbodyRef = useRef<HTMLTableSectionElement>(null);
    const lastLayout = useRef({
        rows: DEFAULT_SKELETON_ROWS,
        rowHeight: DEFAULT_ROW_HEIGHT,
        hadFooter: false,
    });
    const [selectedLog, setSelectedLog] = useState<ActivityLogEntry | null>(
        null,
    );

    useLayoutEffect(() => {
        if (isLoading || logs.length === 0 || !tbodyRef.current) return;
        lastLayout.current = {
            rows: logs.length,
            rowHeight: tbodyRef.current.offsetHeight / logs.length,
            hadFooter: links.length > 0,
        };
    }, [isLoading, logs, links]);

    const showFooter =
        links.length > 0 || (isLoading && lastLayout.current.hadFooter);

    return (
        <>
            <div className="relative mt-3 overflow-x-auto md:shadow-md lg:border">
                <table
                    className="w-full text-left text-xs text-foreground"
                    aria-busy={isLoading}
                >
                    <thead className="lg:border-b">
                        <tr>
                            {HEADERS.map((h) => (
                                <th
                                    key={h}
                                    scope="col"
                                    className="p-2 font-medium whitespace-nowrap text-muted-foreground"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody ref={tbodyRef} className="lg:border-b">
                        {isLoading ? (
                            Array.from({ length: lastLayout.current.rows }).map(
                                (_, i) => (
                                    <tr
                                        key={`sk-${i}`}
                                        style={{
                                            height: lastLayout.current
                                                .rowHeight,
                                        }}
                                    >
                                        {HEADERS.map((h) => (
                                            <td key={h} className="p-2">
                                                <Skeleton
                                                    className={`h-3 ${SKELETON_WIDTHS[h] ?? 'w-20'}`}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ),
                            )
                        ) : logs.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={HEADERS.length}
                                    className="border p-6 text-center text-muted-foreground"
                                >
                                    No activity logs found.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr
                                    key={log.id}
                                    className="transition-colors hover:bg-muted/50"
                                >
                                    <td className="p-2 text-muted-foreground tabular-nums">
                                        {log.id}
                                    </td>
                                    <td className="p-2 whitespace-nowrap">
                                        <ActionBadge action={log.action} />
                                    </td>
                                    <td className="p-2 whitespace-nowrap">
                                        {log.user ? (
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-medium">
                                                    {log.user.name}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {formatCampus(
                                                        log.user.campus,
                                                        log.user.role,
                                                    )}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                —
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-2 whitespace-nowrap text-muted-foreground">
                                        {log.browser ?? '—'}
                                    </td>
                                    <td className="p-2 whitespace-nowrap text-muted-foreground tabular-nums">
                                        {log.ip_address ?? '—'}
                                    </td>
                                    <td className="p-2 whitespace-nowrap text-muted-foreground">
                                        {log.created_at
                                            ? dayjs(log.created_at).format(
                                                  'MMM D, YYYY · h:mm A',
                                              )
                                            : '—'}
                                    </td>
                                    <td className="p-2 whitespace-nowrap">
                                        {hasDetails(log) ? (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                aria-label={`View details for log #${log.id}`}
                                                title="View student & print type"
                                                onClick={() =>
                                                    setSelectedLog(log)
                                                }
                                            >
                                                <EyeIcon className="h-3.5 w-3.5" />
                                            </Button>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                —
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {showFooter && (
                        <tfoot>
                            <tr>
                                <td
                                    colSpan={HEADERS.length}
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
                                                            page = new URL(
                                                                link.url,
                                                            ).searchParams.get(
                                                                'page',
                                                            );
                                                        }
                                                        return (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                disabled={
                                                                    !link.url ||
                                                                    !onPageChange
                                                                }
                                                                onClick={() => {
                                                                    if (
                                                                        page &&
                                                                        onPageChange
                                                                    )
                                                                        onPageChange(
                                                                            page,
                                                                        );
                                                                }}
                                                                className={`rounded px-3 py-1 text-xs ${
                                                                    link.active
                                                                        ? 'bg-primary text-white dark:text-black'
                                                                        : 'bg-muted text-muted-foreground hover:bg-muted/70'
                                                                }`}
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

            {/* Details dialog: student + print type for print logs */}
            <Dialog
                open={!!selectedLog}
                onOpenChange={(open) => {
                    if (!open) setSelectedLog(null);
                }}
            >
                <DialogContent className="sm:max-w-md">
                    {selectedLog && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    Log #{selectedLog.id}
                                    <ActionBadge action={selectedLog.action} />
                                </DialogTitle>
                                <DialogDescription>
                                    {selectedLog.created_at
                                        ? dayjs(selectedLog.created_at).format(
                                              'MMM D, YYYY · h:mm A',
                                          )
                                        : '—'}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex flex-col">
                                <DetailRow
                                    label="Print Type"
                                    value={
                                        selectedLog.print_type ? (
                                            <Badge variant="secondary">
                                                {formatPrintType(
                                                    selectedLog.print_type,
                                                )}
                                            </Badge>
                                        ) : (
                                            '—'
                                        )
                                    }
                                />
                                <DetailRow
                                    label="Student"
                                    value={
                                        selectedLog.student
                                            ? `${selectedLog.student.last_name}, ${selectedLog.student.first_name}`
                                            : '—'
                                    }
                                />
                                <DetailRow
                                    label="ID Number"
                                    value={
                                        selectedLog.student?.id_number ?? '—'
                                    }
                                />
                                <DetailRow
                                    label="Printed By"
                                    value={
                                        selectedLog.user
                                            ? `${selectedLog.user.name} (${selectedLog.user.campus})`
                                            : '—'
                                    }
                                />
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
