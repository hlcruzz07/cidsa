import { ActivityLogFilterBar } from '@/components/ActivityLogs/ActivityLogFilterBar';
import { ActivityLogTable } from '@/components/ActivityLogs/ActivityLogTable';
import Widget from '@/components/Campus/Widget';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import { ActivityLogSummary, PaginateActivityLogs } from '@/lib/custom-types';
import apiService from '@/services/apiService';
import { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import {
    ActivityIcon,
    FileDownIcon,
    LogInIcon,
    PrinterIcon,
    RefreshCwIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

const WIDGET_COLORS = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'];

type PageProps = {
    summary: ActivityLogSummary;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Activity Logs', href: '/activity-logs' },
];

export default function Index() {
    const { summary } = usePage<PageProps>().props;

    const widgets = [
        {
            title: 'Total Logs',
            count: summary.total,
            description: 'All recorded events',
            icon: ActivityIcon,
            color: WIDGET_COLORS[0],
        },
        {
            title: 'Logins',
            count: summary.logins,
            description: 'User login events',
            icon: LogInIcon,
            color: WIDGET_COLORS[1],
        },
        {
            title: 'Prints',
            count: summary.prints,
            description: 'ID card print events',
            icon: PrinterIcon,
            color: WIDGET_COLORS[2],
        },
        {
            title: 'Exports',
            count: summary.exports,
            description: 'Data export events',
            icon: FileDownIcon,
            color: WIDGET_COLORS[3],
        },
        {
            title: 'Last 7 Days',
            count: summary.recent,
            description: 'Activity in the past week',
            icon: RefreshCwIcon,
            color: WIDGET_COLORS[4],
        },
    ];

    // ── Table / filter state ──────────────────────────────────────────────────
    const [logs, setLogs] = useState<PaginateActivityLogs | null>(null);
    const [logsLoading, setLogsLoading] = useState(false);

    const [search, setSearch] = useState<string | null>(null);
    const [action, setAction] = useState<string | null>(null);
    const [dateFrom, setDateFrom] = useState<string | null>(null);
    const [dateTo, setDateTo] = useState<string | null>(null);
    const [perPage, setPerPage] = useState(10);
    const [sort, setSort] = useState('created_at');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');

    const filterParams = () => ({
        search: search || null,
        action: action || null,
        from: dateFrom || null,
        to: dateTo || null,
        perPage,
        sort,
        order,
    });

    const hasActiveFilters = useMemo(
        () =>
            !!(
                search ||
                action ||
                dateFrom ||
                dateTo ||
                perPage !== 10 ||
                sort !== 'created_at' ||
                order !== 'desc'
            ),
        [search, action, dateFrom, dateTo, perPage, sort, order],
    );

    const fetchLogs = async (page?: string) => {
        setLogsLoading(true);
        try {
            const { data } = await apiService.get(
                route('activity-logs.paginate'),
                { params: { ...filterParams(), ...(page ? { page } : {}) } },
            );
            setLogs(data);
        } catch (e) {
            console.error('Error fetching activity logs:', e);
        } finally {
            setLogsLoading(false);
        }
    };

    const resetFilters = () => {
        setSearch(null);
        setAction(null);
        setDateFrom(null);
        setDateTo(null);
        setPerPage(10);
        setSort('created_at');
        setOrder('desc');
    };

    useEffect(() => {
        const t = setTimeout(() => fetchLogs(), 400);
        return () => clearTimeout(t);
    }, [search, action, dateFrom, dateTo, perPage, sort, order]);
    const [tip, setTip] = useState<{
        x: number;
        y: number;
        m: (typeof summary.monthly)[number];
    } | null>(null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activity Logs" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* ── Summary widgets ───────────────────────────────────────── */}
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                    {widgets.map((w) => (
                        <Widget
                            key={w.title}
                            count={w.count}
                            title={w.title}
                            description={w.description}
                            icon={w.icon}
                            color={w.color}
                        />
                    ))}
                </div>

                {/* ── Monthly mini-chart (bar) ───────────────────────────────── */}
                <div className="rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <Heading
                        title="Monthly Activity"
                        description="Breakdown of log types over the last 6 months."
                    />
                    <div className="mt-4 flex items-end gap-2 overflow-x-auto pb-1">
                        {summary.monthly.map((m) => {
                            const max = Math.max(
                                ...summary.monthly.map((x) => x.total),
                                1,
                            );
                            const pct = Math.max((m.total / max) * 100, 2);
                            return (
                                <div
                                    key={m.month}
                                    className="flex min-w-[60px] flex-1 flex-col items-center gap-1"
                                >
                                    {/* stacked bar */}
                                    <div
                                        className="relative w-full cursor-pointer overflow-hidden rounded-t transition hover:brightness-110"
                                        style={{
                                            height: `${Math.round(pct * 1.6)}px`,
                                        }}
                                        onMouseEnter={(e) =>
                                            setTip({
                                                x: e.clientX,
                                                y: e.clientY,
                                                m,
                                            })
                                        }
                                        onMouseMove={(e) =>
                                            setTip({
                                                x: e.clientX,
                                                y: e.clientY,
                                                m,
                                            })
                                        }
                                        onMouseLeave={() => setTip(null)}
                                    >
                                        {/* prints */}
                                        <div
                                            className="absolute right-0 bottom-0 left-0 bg-emerald-400/70 dark:bg-emerald-600/70"
                                            style={{
                                                height: m.total
                                                    ? `${(m.prints / m.total) * 100}%`
                                                    : '0%',
                                            }}
                                        />
                                        {/* exports */}
                                        <div
                                            className="absolute right-0 left-0 bg-violet-400/70 dark:bg-violet-600/70"
                                            style={{
                                                bottom: m.total
                                                    ? `${(m.prints / m.total) * 100}%`
                                                    : '0%',
                                                height: m.total
                                                    ? `${(m.exports / m.total) * 100}%`
                                                    : '0%',
                                            }}
                                        />
                                        {/* logins */}
                                        <div
                                            className="absolute right-0 left-0 bg-blue-400/70 dark:bg-blue-600/70"
                                            style={{
                                                bottom: m.total
                                                    ? `${((m.prints + m.exports) / m.total) * 100}%`
                                                    : '0%',
                                                height: m.total
                                                    ? `${(m.logins / m.total) * 100}%`
                                                    : '0%',
                                            }}
                                        />
                                        {/* rest (sync etc) */}
                                        <div
                                            className="absolute top-0 right-0 left-0 bg-amber-400/60 dark:bg-amber-600/60"
                                            style={{
                                                height: m.total
                                                    ? `${((m.total - m.prints - m.exports - m.logins) / m.total) * 100}%`
                                                    : '0%',
                                            }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">
                                        {m.label}
                                    </span>
                                    <span className="text-[10px] font-semibold tabular-nums">
                                        {m.total}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                        {[
                            { label: 'Login', color: 'bg-blue-400' },
                            { label: 'Print', color: 'bg-emerald-400' },
                            { label: 'Export', color: 'bg-violet-400' },
                            { label: 'Sync', color: 'bg-amber-400' },
                        ].map((l) => (
                            <span
                                key={l.label}
                                className="flex items-center gap-1"
                            >
                                <span
                                    className={`h-2.5 w-2.5 rounded-sm ${l.color}/70`}
                                />
                                {l.label}
                            </span>
                        ))}
                    </div>

                    {/* Tooltip */}
                    {tip && (
                        <div
                            className="pointer-events-none fixed z-50 min-w-[140px] -translate-x-1/2 -translate-y-full rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
                            style={{ left: tip.x, top: tip.y - 12 }}
                        >
                            <div className="mb-1 font-semibold">
                                {tip.m.label}
                            </div>
                            {[
                                {
                                    label: 'Login',
                                    value: tip.m.logins,
                                    color: 'bg-blue-400',
                                },
                                {
                                    label: 'Print',
                                    value: tip.m.prints,
                                    color: 'bg-emerald-400',
                                },
                                {
                                    label: 'Export',
                                    value: tip.m.exports,
                                    color: 'bg-violet-400',
                                },
                                {
                                    label: 'Sync / other',
                                    value:
                                        tip.m.total -
                                        tip.m.prints -
                                        tip.m.exports -
                                        tip.m.logins,
                                    color: 'bg-amber-400',
                                },
                            ].map((row) => (
                                <div
                                    key={row.label}
                                    className="flex items-center justify-between gap-4"
                                >
                                    <span className="flex items-center gap-1.5">
                                        <span
                                            className={`h-2 w-2 rounded-sm ${row.color}`}
                                        />
                                        {row.label}
                                    </span>
                                    <span className="tabular-nums">
                                        {row.value}
                                    </span>
                                </div>
                            ))}
                            <div className="mt-1 flex justify-between border-t pt-1 font-semibold">
                                <span>Total</span>
                                <span className="tabular-nums">
                                    {tip.m.total}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Paginated table ───────────────────────────────────────── */}
                <div className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <Heading
                            title="Activity Log Records"
                            description="All user-generated events including logins, prints, exports, and syncs."
                        />
                    </div>

                    <ActivityLogFilterBar
                        searchValue={search}
                        onSearchChange={setSearch}
                        action={action}
                        onActionChange={setAction}
                        dateFrom={dateFrom}
                        onDateFromChange={setDateFrom}
                        dateTo={dateTo}
                        onDateToChange={setDateTo}
                        perPage={perPage}
                        onPerPageChange={setPerPage}
                        sort={sort}
                        onSortChange={setSort}
                        order={order}
                        onOrderChange={setOrder}
                        hasActiveFilters={hasActiveFilters}
                        onReset={resetFilters}
                        totalEntries={logs?.total ?? 0}
                    />

                    <ActivityLogTable
                        logs={logs?.data ?? []}
                        total={logs?.total}
                        from={logs?.from ?? undefined}
                        to={logs?.to ?? undefined}
                        links={logs?.links}
                        onPageChange={(page) => fetchLogs(page)}
                        isLoading={logsLoading}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
