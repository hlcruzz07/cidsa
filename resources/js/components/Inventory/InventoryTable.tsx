import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { InventoryReceiptProps } from '@/lib/custom-types';
import dayjs from 'dayjs';
import { BookSearchIcon } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { InventoryReceiptDetailsDialog } from './InventoryReceiptDetailsDialog';

// Used only until the table has rendered real rows at least once.
const DEFAULT_SKELETON_ROWS = 10;
const DEFAULT_ROW_HEIGHT = 48;

const SKELETON_WIDTHS: Record<string, string> = {
    'Reference No.': 'w-28',
    Campus: 'w-24',
    Quantity: 'w-12',
    'Delivered By': 'w-32',
    Remarks: 'w-48',
    Status: 'w-16',
    'Received By': 'w-28',
    'Received At': 'w-36',
    Action: 'w-8',
};

interface InventoryTableProps {
    receipts: InventoryReceiptProps[];
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
}

export function InventoryTable({
    receipts,
    total = 0,
    from = 0,
    to = 0,
    links = [],
    onPageChange,
    isLoading = false,
}: InventoryTableProps) {
    const headers = [
        'Reference No.',
        'Campus',
        'Quantity',
        'Delivered By',
        'Remarks',
        'Status',
        'Received By',
        'Received At',
        'Action',
    ];

    // Details modal state.
    const [viewReceipt, setViewReceipt] =
        useState<InventoryReceiptProps | null>(null);
    const [viewOpen, setViewOpen] = useState(false);

    const openView = (row: InventoryReceiptProps) => {
        setViewReceipt(row);
        setViewOpen(true);
    };

    // ─── Loading skeleton sizing ──────────────────────────────────────────────
    // Measure the real tbody after each successful render and reuse that
    // row count / row height for the skeleton.
    const tbodyRef = useRef<HTMLTableSectionElement>(null);
    const lastLayout = useRef({
        rows: DEFAULT_SKELETON_ROWS,
        rowHeight: DEFAULT_ROW_HEIGHT,
        hadFooter: false,
    });

    useLayoutEffect(() => {
        if (isLoading || receipts.length === 0 || !tbodyRef.current) return;
        lastLayout.current = {
            rows: receipts.length,
            rowHeight: tbodyRef.current.offsetHeight / receipts.length,
            hadFooter: links.length > 0,
        };
    }, [isLoading, receipts, links]);

    const showFooter =
        links.length > 0 || (isLoading && lastLayout.current.hadFooter);

    return (
        <>
            <InventoryReceiptDetailsDialog
                receipt={viewReceipt}
                open={viewOpen}
                onOpenChange={setViewOpen}
            />

            <div className="relative mt-3 overflow-x-auto md:shadow-md lg:border">
                <table
                    className="table w-full text-left text-xs text-foreground"
                    aria-busy={isLoading}
                >
                    <thead className="lg:border-b">
                        <tr>
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
                                        {headers.map((h) => (
                                            <td key={h} className="p-2">
                                                <Skeleton
                                                    className={`h-3 ${SKELETON_WIDTHS[h] ?? 'w-20'}`}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ),
                            )
                        ) : receipts.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={headers.length}
                                    className="border p-3 text-center"
                                >
                                    No records found.
                                </td>
                            </tr>
                        ) : (
                            receipts.map((row) => {
                                const isReceived = !!row.received_at;

                                return (
                                    <tr
                                        key={row.id}
                                        className="hover:bg-muted/50"
                                    >
                                        <td
                                            className="p-2 font-medium whitespace-nowrap"
                                            data-label="Reference No."
                                        >
                                            {row.ref_no}
                                        </td>
                                        <td
                                            className="p-2 whitespace-nowrap"
                                            data-label="Campus"
                                        >
                                            {row.stock?.campus ?? '--'}
                                        </td>
                                        <td
                                            className="p-2 font-medium whitespace-nowrap tabular-nums"
                                            data-label="Quantity"
                                        >
                                            {row.quantity.toLocaleString()}
                                        </td>
                                        <td
                                            className="p-2 whitespace-nowrap"
                                            data-label="Delivered By"
                                        >
                                            {row.delivered_by ?? '--'}
                                        </td>
                                        <td
                                            className="max-w-[300px] p-2"
                                            data-label="Remarks"
                                        >
                                            <span
                                                className="block truncate text-muted-foreground"
                                                title={row.remarks ?? undefined}
                                            >
                                                {row.remarks ?? '--'}
                                            </span>
                                        </td>
                                        <td
                                            className="p-2 whitespace-nowrap"
                                            data-label="Status"
                                        >
                                            <span
                                                className={`font-bold ${
                                                    isReceived
                                                        ? 'text-green-600 dark:text-green-500'
                                                        : 'text-amber-600 dark:text-amber-400'
                                                }`}
                                            >
                                                {isReceived
                                                    ? 'Received'
                                                    : 'Pending'}
                                            </span>
                                        </td>
                                        <td
                                            className="p-2 whitespace-nowrap"
                                            data-label="Received By"
                                        >
                                            {row.receiver?.name ?? '--'}
                                        </td>
                                        <td
                                            className="p-2 whitespace-nowrap"
                                            data-label="Received At"
                                        >
                                            {row.received_at
                                                ? dayjs(row.received_at).format(
                                                      'MMM D, YYYY · h:mm A',
                                                  )
                                                : '—'}
                                        </td>
                                        <td className="flex flex-wrap gap-3 p-2 whitespace-nowrap">
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                aria-label="Actions"
                                                onClick={() => openView(row)}
                                            >
                                                <BookSearchIcon />
                                            </Button>
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
                                    colSpan={headers.length}
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
