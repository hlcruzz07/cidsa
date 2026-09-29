import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import apiService from '@/services/apiService';
import dayjs from 'dayjs';
import {
    AlertTriangleIcon,
    CheckCircle2Icon,
    DownloadIcon,
    InfoIcon,
    OctagonAlertIcon,
} from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { route } from 'ziggy-js';

type Severity = 'critical' | 'warning' | 'info';

interface AuditReceipt {
    ref_no: string;
    quantity: number;
    delivered_by: string | null;
    sent_at: string | null;
    received_at: string | null;
    received_by: string | null;
}

interface AuditPrintedStudent {
    at: string;
    student: string;
    student_no: string | null;
    print_type: string | null;
    printed_by: string | null;
    balance_after: number;
    charged_via: 'user' | 'student' | null;
}

export interface InventoryAuditData {
    stock_id: number;
    campus: string;
    generated_at: string;
    result: 'pass' | 'warning' | 'fail';
    totals: {
        received: number;
        printed: number;
        balance: number;
        discrepancy: number;
        pending_quantity: number;
        pending_count: number;
        overdue_count: number;
        projected_balance: number;
    };
    ledger: {
        lowest_balance: number;
        first_negative_at: string | null;
        unbacked_prints: number;
    };
    findings: { severity: Severity; title: string; detail: string }[];
    receipts: { confirmed: AuditReceipt[]; pending: AuditReceipt[] };
    printed_students: AuditPrintedStudent[];
    prints_by_type: { label: string; count: number }[];
    prints_by_user: { label: string; count: number }[];
    monthly: {
        month: string;
        received: number;
        printed: number;
        balance: number;
    }[];
    period: {
        first_print: string | null;
        last_print: string | null;
        first_receipt: string | null;
        last_receipt: string | null;
    };
}

const fmt = (n: number) => n.toLocaleString();
const date = (iso: string | null, format = 'MMM D, YYYY') =>
    iso ? dayjs(iso).format(format) : '—';

const RESULT_STYLE = {
    fail: {
        icon: OctagonAlertIcon,
        title: 'Audit failed',
        text: 'Discrepancies need attention.',
        className:
            'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400',
    },
    warning: {
        icon: AlertTriangleIcon,
        title: 'Passed with warnings',
        text: 'Totals reconcile, but some records look off.',
        className:
            'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
    },
    pass: {
        icon: CheckCircle2Icon,
        title: 'Audit passed',
        text: 'Deliveries and print logs are consistent.',
        className:
            'border-green-600/40 bg-green-600/10 text-green-700 dark:text-green-400',
    },
} as const;

const FINDING_STYLE: Record<
    Severity,
    { icon: typeof InfoIcon; className: string; label: string }
> = {
    critical: {
        icon: OctagonAlertIcon,
        className: 'text-red-600 dark:text-red-500',
        label: 'Critical',
    },
    warning: {
        icon: AlertTriangleIcon,
        className: 'text-amber-600 dark:text-amber-400',
        label: 'Warning',
    },
    info: {
        icon: InfoIcon,
        className: 'text-blue-600 dark:text-blue-400',
        label: 'Info',
    },
};

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-2">
            <h4 className="text-sm font-medium">{title}</h4>
            {children}
        </div>
    );
}

function MiniTable({
    headers,
    rows,
}: {
    headers: string[];
    rows: ReactNode[][];
}) {
    return (
        <div className="max-h-56 overflow-auto rounded-md border">
            <table className="table w-full text-left text-xs">
                <thead className="sticky top-0 border-b bg-background">
                    <tr>
                        {headers.map((h) => (
                            <th key={h} className="p-2 whitespace-nowrap">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={headers.length}
                                className="p-3 text-center text-muted-foreground"
                            >
                                None
                            </td>
                        </tr>
                    ) : (
                        rows.map((r, i) => (
                            <tr key={i} className="hover:bg-muted/50">
                                {r.map((cell, j) => (
                                    <td
                                        key={j}
                                        className="p-2 whitespace-nowrap tabular-nums"
                                    >
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

function Tile({
    label,
    value,
    hint,
    className = '',
}: {
    label: string;
    value: ReactNode;
    hint?: string;
    className?: string;
}) {
    return (
        <div className="flex flex-col gap-1 rounded-lg border p-3">
            <span className="text-[11px] text-muted-foreground">{label}</span>
            <span className={`text-xl font-semibold tabular-nums ${className}`}>
                {value}
            </span>
            {hint && (
                <span className="text-[11px] text-muted-foreground">
                    {hint}
                </span>
            )}
        </div>
    );
}

export function InventoryAuditDialog({
    stockId,
    campus,
    open,
    onOpenChange,
}: {
    stockId: number | null;
    campus: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [audit, setAudit] = useState<InventoryAuditData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open || stockId === null) return;

        let cancelled = false;
        setLoading(true);
        setError(null);
        setAudit(null);

        apiService
            .get(route('inventory.audit', { stock: stockId }))
            .then(({ data }) => {
                if (!cancelled) setAudit(data);
            })
            .catch(() => {
                if (!cancelled) {
                    setError('Could not load the audit. Please try again.');
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [open, stockId]);

    const downloadDocx = () => {
        if (stockId === null) return;
        window.location.href = route('inventory.audit.docx', {
            stock: stockId,
        });
    };

    const result = audit ? RESULT_STYLE[audit.result] : null;
    const ResultIcon = result?.icon;

    const receiptRows = (list: AuditReceipt[]) =>
        list.map((r) => [
            <span key="ref" className="font-medium">
                {r.ref_no}
            </span>,
            date(r.sent_at),
            date(r.received_at),
            fmt(r.quantity),
            r.delivered_by ?? '—',
            r.received_by ?? '—',
        ]);

    const receiptHeaders = [
        'Reference No.',
        'Sent',
        'Received',
        'Qty',
        'Delivered By',
        'Received By',
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Inventory Audit · {campus}</DialogTitle>
                    <DialogDescription>
                        Compares confirmed deliveries against the print logs
                        {audit
                            ? ` · generated ${date(audit.generated_at, 'MMM D, YYYY h:mm A')}`
                            : '.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex max-h-[65vh] flex-col gap-5 overflow-y-auto pr-1">
                    {loading && (
                        <div className="flex flex-col gap-3">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-red-600 dark:text-red-500">
                            {error}
                        </p>
                    )}

                    {audit && result && ResultIcon && (
                        <>
                            <div
                                className={`flex items-start gap-3 rounded-lg border p-3 ${result.className}`}
                            >
                                <ResultIcon className="mt-0.5 size-5 shrink-0" />
                                <div className="text-sm">
                                    <p className="font-semibold">
                                        {result.title}
                                    </p>
                                    <p className="text-xs opacity-90">
                                        {result.text}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                <Tile
                                    label="Confirmed received"
                                    value={fmt(audit.totals.received)}
                                    hint="Cards the campus confirmed"
                                />
                                <Tile
                                    label="IDs printed"
                                    value={fmt(audit.totals.printed)}
                                    hint="From the activity log"
                                />
                                <Tile
                                    label="Balance"
                                    value={fmt(audit.totals.balance)}
                                    hint="Received − printed"
                                    className={
                                        audit.totals.balance < 0
                                            ? 'text-red-600 dark:text-red-500'
                                            : ''
                                    }
                                />
                                <Tile
                                    label="Over-printed"
                                    value={
                                        audit.totals.discrepancy > 0
                                            ? `+${fmt(audit.totals.discrepancy)}`
                                            : 'None'
                                    }
                                    hint="Printed beyond confirmed stock"
                                    className={
                                        audit.totals.discrepancy > 0
                                            ? 'text-red-600 dark:text-red-500'
                                            : 'text-green-600 dark:text-green-500'
                                    }
                                />
                            </div>

                            <Section title="Findings">
                                <div className="flex flex-col gap-2">
                                    {audit.findings.map((f, i) => {
                                        const s = FINDING_STYLE[f.severity];
                                        const Icon = s.icon;
                                        return (
                                            <div
                                                key={i}
                                                className="flex items-start gap-2 rounded-md border p-3"
                                            >
                                                <Icon
                                                    className={`mt-0.5 size-4 shrink-0 ${s.className}`}
                                                />
                                                <div className="flex flex-col gap-0.5 text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">
                                                            {f.title}
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                s.className
                                                            }
                                                        >
                                                            {s.label}
                                                        </Badge>
                                                    </div>
                                                    <span className="text-muted-foreground">
                                                        {f.detail}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Section>

                            <Section
                                title={`Confirmed deliveries (${audit.receipts.confirmed.length})`}
                            >
                                <MiniTable
                                    headers={receiptHeaders}
                                    rows={receiptRows(audit.receipts.confirmed)}
                                />
                            </Section>

                            <Section
                                title={`Pending deliveries (${audit.receipts.pending.length}) · not counted in stock`}
                            >
                                <MiniTable
                                    headers={receiptHeaders}
                                    rows={receiptRows(audit.receipts.pending)}
                                />
                            </Section>

                            <Section
                                title={`Printed students (${audit.printed_students.length}) · each print uses 1 card`}
                            >
                                <MiniTable
                                    headers={[
                                        'Date',
                                        'Student',
                                        'Student No.',
                                        'Type',
                                        'Printed by',
                                        'Stock after',
                                    ]}
                                    rows={audit.printed_students.map((p) => [
                                        date(p.at, 'MMM D, YYYY h:mm A'),
                                        <span key="s" className="font-medium">
                                            {p.student}
                                        </span>,
                                        p.student_no ?? '—',
                                        p.print_type ?? '—',
                                        p.printed_by ?? '—',
                                        <span
                                            key="b"
                                            className={
                                                p.balance_after < 0
                                                    ? 'font-medium text-red-600 dark:text-red-500'
                                                    : ''
                                            }
                                        >
                                            {fmt(p.balance_after)}
                                        </span>,
                                    ])}
                                />
                            </Section>

                            <div className="grid gap-5 md:grid-cols-2">
                                <Section title="Prints by type">
                                    <MiniTable
                                        headers={['Type', 'Count']}
                                        rows={audit.prints_by_type.map((r) => [
                                            r.label,
                                            fmt(r.count),
                                        ])}
                                    />
                                </Section>
                                <Section title="Prints by user (top 10)">
                                    <MiniTable
                                        headers={['User', 'Count']}
                                        rows={audit.prints_by_user.map((r) => [
                                            r.label,
                                            fmt(r.count),
                                        ])}
                                    />
                                </Section>
                            </div>

                            <Section title="Monthly movement (last 12 months)">
                                <MiniTable
                                    headers={[
                                        'Month',
                                        'Received',
                                        'Printed',
                                        'Running balance',
                                    ]}
                                    rows={audit.monthly.map((m) => [
                                        m.month,
                                        fmt(m.received),
                                        fmt(m.printed),
                                        <span
                                            key="bal"
                                            className={
                                                m.balance < 0
                                                    ? 'font-medium text-red-600 dark:text-red-500'
                                                    : ''
                                            }
                                        >
                                            {fmt(m.balance)}
                                        </span>,
                                    ])}
                                />
                            </Section>
                        </>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={!audit}
                        onClick={downloadDocx}
                    >
                        <DownloadIcon /> Download Word (.docx)
                    </Button>
                    <Button type="button" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
