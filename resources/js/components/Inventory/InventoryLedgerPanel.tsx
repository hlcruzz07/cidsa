import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import apiService from '@/services/apiService';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';

export interface LedgerEntry {
    type: 'received' | 'printed';
    at: string;
    quantity: number;
    title: string;
    detail: string | null;
    actor: string | null;
    balance: number;
    student_no: string | null;
    print_type: string | null;
    charged_via: 'user' | 'student' | null;
}

interface LedgerResponse {
    campus: string;
    balance: number;
    received: number;
    printed: number;
    total: number;
    page: number;
    last_page: number;
    data: LedgerEntry[];
}

export function InventoryLedgerPanel({
    stocks,
    refreshKey = 0,
}: {
    stocks: { id: number; campus: string }[];
    refreshKey?: number;
}) {
    const [stockId, setStockId] = useState<number | null>(
        stocks[0]?.id ?? null,
    );
    const [page, setPage] = useState(1);
    const [data, setData] = useState<LedgerResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (stockId === null) return;
        let cancelled = false;
        setLoading(true);
        setError(null);

        apiService
            .get(route('inventory.ledger', { stock: stockId }), {
                params: { page, per_page: 15 },
            })
            .then(({ data }) => !cancelled && setData(data))
            .catch((e) => {
                if (cancelled) return;
                setData(null);
                setError(
                    e?.response?.status === 403
                        ? 'You can only view your own campus.'
                        : 'Could not load the stock log.',
                );
            })
            .finally(() => !cancelled && setLoading(false));

        return () => {
            cancelled = true;
        };
    }, [stockId, page, refreshKey]);

    const pickCampus = (id: number) => {
        setStockId(id);
        setPage(1);
    };

    return (
        <div className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="text-base font-semibold">Stock Log</h3>
                    <p className="text-sm text-muted-foreground">
                        Every card that came in (confirmed deliveries) and went
                        out (one per printed ID), with the stock left after each
                        movement.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {stocks.map((s) => (
                        <Button
                            key={s.id}
                            type="button"
                            size="sm"
                            variant={s.id === stockId ? 'default' : 'outline'}
                            onClick={() => pickCampus(s.id)}
                        >
                            {s.campus}
                        </Button>
                    ))}
                </div>
            </div>

            {data && (
                <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                    <span className="font-semibold tabular-nums">
                        {data.balance.toLocaleString()}
                    </span>{' '}
                    in stock at {data.campus} ={' '}
                    <span className="tabular-nums">
                        {data.received.toLocaleString()}
                    </span>{' '}
                    received −{' '}
                    <span className="tabular-nums">
                        {data.printed.toLocaleString()}
                    </span>{' '}
                    printed
                </div>
            )}

            {error && (
                <p className="text-sm text-red-600 dark:text-red-500">
                    {error}
                </p>
            )}

            <div className="overflow-auto rounded-md border">
                <table className="w-full text-left text-xs">
                    <thead className="border-b bg-muted/40">
                        <tr>
                            {[
                                'Date',
                                'Movement',
                                'Details',
                                'By',
                                'Qty',
                                'Stock after',
                            ].map((h) => (
                                <th key={h} className="p-2 whitespace-nowrap">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading &&
                            [0, 1, 2].map((i) => (
                                <tr key={i}>
                                    <td colSpan={6} className="p-2">
                                        <Skeleton className="h-6 w-full" />
                                    </td>
                                </tr>
                            ))}

                        {!loading && data?.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="p-4 text-center text-muted-foreground"
                                >
                                    No movements yet for this campus.
                                </td>
                            </tr>
                        )}

                        {!loading &&
                            data?.data.map((e, i) => (
                                <tr key={i} className="border-b last:border-0">
                                    <td className="p-2 whitespace-nowrap">
                                        {dayjs(e.at).format(
                                            'MMM D, YYYY h:mm A',
                                        )}
                                    </td>
                                    <td className="p-2">
                                        <Badge
                                            variant="outline"
                                            className={
                                                e.type === 'received'
                                                    ? 'border-green-600/40 text-green-700 dark:text-green-400'
                                                    : 'border-red-500/40 text-red-700 dark:text-red-400'
                                            }
                                        >
                                            {e.type === 'received'
                                                ? 'Received'
                                                : 'Printed'}
                                        </Badge>
                                    </td>
                                    <td className="p-2">
                                        <div className="font-medium">
                                            {e.title}
                                        </div>
                                        {e.detail && (
                                            <div className="text-muted-foreground">
                                                {e.detail}
                                            </div>
                                        )}
                                        {e.charged_via === 'student' && (
                                            <div className="text-[11px] text-muted-foreground">
                                                Charged by student&apos;s campus
                                                (printed by super admin)
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-2 whitespace-nowrap">
                                        {e.actor ?? '—'}
                                    </td>
                                    <td
                                        className={`p-2 font-medium tabular-nums ${
                                            e.quantity > 0
                                                ? 'text-green-600 dark:text-green-500'
                                                : 'text-red-600 dark:text-red-500'
                                        }`}
                                    >
                                        {e.quantity > 0 ? '+' : '−'}
                                        {Math.abs(e.quantity).toLocaleString()}
                                    </td>
                                    <td
                                        className={`p-2 font-semibold tabular-nums ${
                                            e.balance < 0
                                                ? 'text-red-600 dark:text-red-500'
                                                : ''
                                        }`}
                                    >
                                        {e.balance.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {data && data.last_page > 1 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                        Page {data.page} of {data.last_page} ·{' '}
                        {data.total.toLocaleString()} movements
                    </span>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={page >= data.last_page || loading}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
