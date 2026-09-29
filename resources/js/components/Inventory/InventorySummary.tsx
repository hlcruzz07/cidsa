import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import dayjs from 'dayjs';
import {
    AlertTriangleIcon,
    ArrowDownRightIcon,
    ArrowUpRightIcon,
    ClipboardCheckIcon,
    ClockIcon,
    InfoIcon,
    MinusIcon,
    PackageIcon,
    PrinterIcon,
    TruckIcon,
} from 'lucide-react';
import { ReactNode, useState } from 'react';
import { InventoryAuditDialog } from './InventoryAuditDialog';

type Period = '7' | '30' | '90';

export interface InventorySummaryData {
    /** All-time totals across every campus. stock = received - printed. */
    totals: {
        stock: number;
        received: number;
        printed: number;
    };
    periods: Record<
        Period,
        {
            sent_quantity: number;
            sent_count: number;
            previous_quantity: number;
            used_quantity: number;
            previous_used: number;
        }
    >;
    pending: {
        count: number;
        quantity: number;
        overdue_count: number;
        overdue_days: number;
        oldest_days: number | null;
    };
    received_last_30: number;
    avg_confirm_days: number | null;
    monthly: {
        label: string;
        month: string;
        sent: number;
        received: number;
        used: number;
    }[];
    campuses: {
        stock_id: number;
        campus: string;
        stock: number;
        sent_30: number;
        printed_30: number;
        received_total: number;
        printed_total: number;
        avg_daily_use: number;
        days_left: number | null;
        pending_quantity: number;
        pending_count: number;
        last_sent_at: string | null;
        has_discrepancy: boolean;
    }[];
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
    { value: '7', label: '7d' },
    { value: '30', label: '30d' },
    { value: '90', label: '90d' },
];

/** Stock that will run out within this many days is flagged as low. */
const LOW_STOCK_DAYS = 14;

const fmt = (n: number) => n.toLocaleString();

function getDelta(current: number, previous: number) {
    if (previous === 0) {
        return current === 0
            ? { dir: 'flat' as const, label: 'No change vs previous period' }
            : { dir: 'up' as const, label: 'New activity this period' };
    }
    const pct = Math.round(((current - previous) / previous) * 100);
    if (pct === 0) {
        return { dir: 'flat' as const, label: 'Same as previous period' };
    }
    return {
        dir: pct > 0 ? ('up' as const) : ('down' as const),
        label: `${pct > 0 ? '+' : ''}${pct}% vs previous period`,
    };
}

function DeltaLine({
    current,
    previous,
}: {
    current: number;
    previous: number;
}) {
    const delta = getDelta(current, previous);
    const Icon =
        delta.dir === 'up'
            ? ArrowUpRightIcon
            : delta.dir === 'down'
              ? ArrowDownRightIcon
              : MinusIcon;

    return (
        <span className="flex items-center gap-1">
            <Icon className="size-3" />
            {delta.label}
        </span>
    );
}

function getStockStatus(c: InventorySummaryData['campuses'][number]) {
    if (c.stock < 0 || c.has_discrepancy) {
        return {
            label: 'Check records',
            note: 'Printed count exceeds confirmed deliveries',
            className:
                'border-red-500/40 text-red-600 dark:border-red-500/40 dark:text-red-500',
        };
    }
    if (c.stock === 0) {
        return {
            label: 'Out of stock',
            note: 'No cards left to print',
            className:
                'border-red-500/40 text-red-600 dark:border-red-500/40 dark:text-red-500',
        };
    }
    if (c.days_left !== null && c.days_left <= LOW_STOCK_DAYS) {
        return {
            label: 'Low',
            note: `About ${fmt(c.days_left)} day(s) left at current use`,
            className:
                'border-amber-500/40 text-amber-600 dark:border-amber-400/40 dark:text-amber-400',
        };
    }
    return {
        label: 'Healthy',
        note:
            c.days_left !== null
                ? `About ${fmt(c.days_left)} day(s) left at current use`
                : 'No printing in the last 30 days',
        className:
            'border-green-600/40 text-green-600 dark:border-green-500/40 dark:text-green-500',
    };
}

function StatCard({
    title,
    caption,
    value,
    footer,
    icon,
    valueClassName = '',
}: {
    title: string;
    caption: string;
    value: ReactNode;
    footer: ReactNode;
    icon: ReactNode;
    valueClassName?: string;
}) {
    return (
        <div className="flex flex-col gap-2 rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    {icon}
                    {title}
                </div>
                <span className="text-[11px] text-muted-foreground/80">
                    {caption}
                </span>
            </div>
            <div
                className={`text-2xl font-semibold tabular-nums ${valueClassName}`}
            >
                {value}
            </div>
            <div className="text-xs text-muted-foreground">{footer}</div>
        </div>
    );
}

export function InventorySummary({
    summary,
}: {
    summary: InventorySummaryData;
}) {
    const [period, setPeriod] = useState<Period>('30');
    const [auditStock, setAuditStock] = useState<{
        id: number;
        campus: string;
    } | null>(null);
    const [monthTip, setMonthTip] = useState<{
        x: number;
        y: number;
        m: (typeof summary.monthly)[number];
    } | null>(null);

    const current = summary.periods[period];
    const { pending, totals } = summary;
    const avgPerDay =
        Math.round((current.used_quantity / Number(period)) * 10) / 10;

    const chartMax = Math.max(
        1,
        ...summary.monthly.flatMap((m) => [m.sent, m.received, m.used]),
    );
    const sixMonth = summary.monthly.reduce(
        (t, m) => ({
            sent: t.sent + m.sent,
            received: t.received + m.received,
            used: t.used + m.used,
        }),
        { sent: 0, received: 0, used: 0 },
    );

    return (
        <div className="flex flex-col gap-5">
            <InventoryAuditDialog
                stockId={auditStock?.id ?? null}
                campus={auditStock?.campus ?? ''}
                open={auditStock !== null}
                onOpenChange={(open: boolean) => !open && setAuditStock(null)}
            />

            {/* ─── Header: what the numbers mean + period switch ─────────── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <InfoIcon className="mt-0.5 size-4 shrink-0" />
                    <p className="max-w-2xl">
                        <span className="font-medium text-foreground">
                            In Stock = confirmed deliveries − IDs printed.
                        </span>{' '}
                        A delivery only counts once the campus confirms it.
                        Every print in the activity log uses one card from the
                        printing user&apos;s campus.
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                    Period
                    <div className="flex gap-1">
                        {PERIOD_OPTIONS.map((o) => (
                            <Button
                                key={o.value}
                                type="button"
                                size="sm"
                                variant={
                                    period === o.value ? 'default' : 'outline'
                                }
                                className="h-6 rounded-full px-2 text-[10px]"
                                onClick={() => setPeriod(o.value)}
                            >
                                {o.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Headline numbers ─────────────────────────────────────── */}
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="In Stock"
                    caption="Available to print right now"
                    icon={<PackageIcon className="size-4" />}
                    value={fmt(totals.stock)}
                    valueClassName={
                        totals.stock < 0 ? 'text-red-600 dark:text-red-500' : ''
                    }
                    footer={
                        <div className="flex flex-col gap-0.5">
                            <span>
                                {fmt(totals.received)} received −{' '}
                                {fmt(totals.printed)} printed (all time)
                            </span>
                            <span>All campuses combined</span>
                        </div>
                    }
                />

                <StatCard
                    title={`Sent to Campuses (${period}d)`}
                    caption="Cards shipped, whether or not confirmed yet"
                    icon={<TruckIcon className="size-4" />}
                    value={fmt(current.sent_quantity)}
                    footer={
                        <div className="flex flex-col gap-0.5">
                            <span>
                                {fmt(current.sent_count)} delivery(ies) in the
                                last {period} days
                            </span>
                            <DeltaLine
                                current={current.sent_quantity}
                                previous={current.previous_quantity}
                            />
                        </div>
                    }
                />

                <StatCard
                    title={`IDs Printed (${period}d)`}
                    caption="Cards used, taken from the print logs"
                    icon={<PrinterIcon className="size-4" />}
                    value={fmt(current.used_quantity)}
                    footer={
                        <div className="flex flex-col gap-0.5">
                            <span>About {fmt(avgPerDay)} per day</span>
                            <DeltaLine
                                current={current.used_quantity}
                                previous={current.previous_used}
                            />
                        </div>
                    }
                />

                <StatCard
                    title="Awaiting Confirmation"
                    caption="Sent but not counted in stock yet"
                    icon={<ClockIcon className="size-4" />}
                    value={fmt(pending.quantity)}
                    valueClassName={
                        pending.count > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : ''
                    }
                    footer={
                        <div className="flex flex-col gap-0.5">
                            {pending.count > 0 ? (
                                <span>
                                    {fmt(pending.count)} receipt(s)
                                    {pending.oldest_days !== null
                                        ? ` · oldest ${pending.oldest_days} day(s)`
                                        : ''}
                                </span>
                            ) : (
                                <span>Everything has been confirmed.</span>
                            )}
                            {pending.overdue_count > 0 && (
                                <span className="flex items-center gap-1 font-medium text-red-600 dark:text-red-500">
                                    <AlertTriangleIcon className="size-3" />
                                    {fmt(pending.overdue_count)} overdue (
                                    {pending.overdue_days}+ days)
                                </span>
                            )}
                            <span>
                                {summary.avg_confirm_days !== null
                                    ? `Campuses confirm in ~${summary.avg_confirm_days} day(s) on average`
                                    : 'No confirmations yet'}
                            </span>
                        </div>
                    }
                />
            </div>

            {/* ─── Trend + per campus ───────────────────────────────────── */}
            <div className="grid gap-5 lg:grid-cols-5">
                <div className="flex flex-col gap-3 rounded-xl border border-sidebar-border/70 p-4 lg:col-span-2 dark:border-sidebar-border">
                    <div>
                        <h3 className="text-sm font-medium">Last 6 Months</h3>
                        <p className="text-xs text-muted-foreground">
                            Hover a month to see the exact numbers.
                        </p>
                    </div>

                    <div className="flex h-40 items-end gap-3">
                        {summary.monthly.map((m) => (
                            <div
                                key={m.month}
                                className="flex h-full flex-1 cursor-pointer flex-col items-center gap-1 rounded transition hover:bg-muted/50"
                                onMouseEnter={(e) =>
                                    setMonthTip({
                                        x: e.clientX,
                                        y: e.clientY,
                                        m,
                                    })
                                }
                                onMouseMove={(e) =>
                                    setMonthTip({
                                        x: e.clientX,
                                        y: e.clientY,
                                        m,
                                    })
                                }
                                onMouseLeave={() => setMonthTip(null)}
                            >
                                <div className="flex w-full flex-1 items-end justify-center gap-0.5">
                                    {(
                                        [
                                            ['sent', 'bg-primary'],
                                            ['received', 'bg-chart-2'],
                                            ['used', 'bg-chart-4'],
                                        ] as const
                                    ).map(([key, color]) => (
                                        <div
                                            key={key}
                                            className={`w-full max-w-3 rounded-t ${color}`}
                                            style={{
                                                height: `${(m[key] / chartMax) * 100}%`,
                                                minHeight: m[key] > 0 ? 2 : 0,
                                            }}
                                        />
                                    ))}
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                    {m.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-sm bg-primary" />
                            <b className="text-foreground">
                                Sent {fmt(sixMonth.sent)}
                            </b>
                            · delivery recorded
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-sm bg-chart-2" />
                            <b className="text-foreground">
                                Received {fmt(sixMonth.received)}
                            </b>
                            · confirmed by the campus
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-sm bg-chart-4" />
                            <b className="text-foreground">
                                Printed {fmt(sixMonth.used)}
                            </b>
                            · cards used
                        </span>
                    </div>

                    {/* Tooltip */}
                    {monthTip && (
                        <div
                            className="pointer-events-none fixed z-50 min-w-[150px] -translate-x-1/2 -translate-y-full rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
                            style={{ left: monthTip.x, top: monthTip.y - 12 }}
                        >
                            <div className="mb-1 font-semibold">
                                {monthTip.m.month}
                            </div>
                            {[
                                {
                                    label: 'Sent',
                                    value: monthTip.m.sent,
                                    color: 'bg-primary',
                                },
                                {
                                    label: 'Received',
                                    value: monthTip.m.received,
                                    color: 'bg-chart-2',
                                },
                                {
                                    label: 'Printed',
                                    value: monthTip.m.used,
                                    color: 'bg-chart-4',
                                },
                            ].map((row) => (
                                <div
                                    key={row.label}
                                    className="flex items-center justify-between gap-4"
                                >
                                    <span className="flex items-center gap-1.5">
                                        <span
                                            className={`size-2 rounded-sm ${row.color}`}
                                        />
                                        {row.label}
                                    </span>
                                    <span className="tabular-nums">
                                        {fmt(row.value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-sidebar-border/70 p-4 lg:col-span-3 dark:border-sidebar-border">
                    <div>
                        <h3 className="text-sm font-medium">By Campus</h3>
                        <p className="text-xs text-muted-foreground">
                            Stock health, how many cards were used, and what is
                            still on the way. Low means less than{' '}
                            {LOW_STOCK_DAYS} days of stock left. Run an audit to
                            reconcile a campus in detail.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="table w-full text-left text-xs text-foreground">
                            <thead className="border-b">
                                <tr>
                                    {[
                                        'Campus',
                                        'In Stock',
                                        'Received vs Printed',
                                        'Awaiting',
                                        'Last Sent',
                                        'Audit',
                                    ].map((h) => (
                                        <th
                                            key={h}
                                            scope="col"
                                            className="p-2 whitespace-nowrap"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {summary.campuses.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="p-3 text-center"
                                        >
                                            No campuses yet.
                                        </td>
                                    </tr>
                                ) : (
                                    summary.campuses.map((c) => {
                                        const status = getStockStatus(c);
                                        const usedPct =
                                            c.received_total > 0
                                                ? Math.min(
                                                      100,
                                                      Math.round(
                                                          (c.printed_total /
                                                              c.received_total) *
                                                              100,
                                                      ),
                                                  )
                                                : 0;

                                        return (
                                            <tr
                                                key={c.stock_id}
                                                className="align-top hover:bg-muted/50"
                                            >
                                                <td className="p-2 font-medium whitespace-nowrap">
                                                    {c.campus}
                                                </td>

                                                <td className="p-2">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-semibold tabular-nums">
                                                                {fmt(c.stock)}
                                                            </span>
                                                            <Badge
                                                                variant="outline"
                                                                className={
                                                                    status.className
                                                                }
                                                            >
                                                                {status.label}
                                                            </Badge>
                                                        </div>
                                                        <span className="text-[11px] text-muted-foreground">
                                                            {status.note}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="min-w-40 p-2">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                            <div
                                                                className="h-full rounded-full bg-chart-4"
                                                                style={{
                                                                    width: `${usedPct}%`,
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-[11px] text-muted-foreground tabular-nums">
                                                            {fmt(
                                                                c.printed_total,
                                                            )}{' '}
                                                            of{' '}
                                                            {fmt(
                                                                c.received_total,
                                                            )}{' '}
                                                            used ({usedPct}%)
                                                        </span>
                                                        <span className="text-[11px] text-muted-foreground tabular-nums">
                                                            {fmt(c.printed_30)}{' '}
                                                            printed ·{' '}
                                                            {fmt(c.sent_30)}{' '}
                                                            sent (30d)
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="p-2 whitespace-nowrap tabular-nums">
                                                    {c.pending_count > 0 ? (
                                                        <span className="font-medium text-amber-600 dark:text-amber-400">
                                                            {fmt(
                                                                c.pending_quantity,
                                                            )}{' '}
                                                            <span className="text-muted-foreground">
                                                                (
                                                                {
                                                                    c.pending_count
                                                                }{' '}
                                                                receipt
                                                                {c.pending_count ===
                                                                1
                                                                    ? ''
                                                                    : 's'}
                                                                )
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            Nothing pending
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="p-2 whitespace-nowrap text-muted-foreground">
                                                    {c.last_sent_at
                                                        ? dayjs(
                                                              c.last_sent_at,
                                                          ).format(
                                                              'MMM D, YYYY',
                                                          )
                                                        : '—'}
                                                </td>

                                                <td className="p-2 whitespace-nowrap">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant={
                                                            status.label ===
                                                            'Check records'
                                                                ? 'destructive'
                                                                : 'outline'
                                                        }
                                                        className="h-7 rounded-full px-3 text-[11px]"
                                                        onClick={() =>
                                                            setAuditStock({
                                                                id: c.stock_id,
                                                                campus: c.campus,
                                                            })
                                                        }
                                                    >
                                                        <ClipboardCheckIcon className="size-3" />
                                                        Audit
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
