import Widget from '@/components/Campus/Widget';
import Heading from '@/components/heading';
import { AddReceiptDialog } from '@/components/Inventory/AddReceiptDialog';
import { InventoryAuditDialog } from '@/components/Inventory/InventoryAuditDialog';
import { InventoryFilterBar } from '@/components/Inventory/InventoryFilterBar';
import { InventoryLedgerPanel } from '@/components/Inventory/InventoryLedgerPanel';
import {
    InventorySummary,
    InventorySummaryData,
} from '@/components/Inventory/InventorySummary';
import { InventoryTable } from '@/components/Inventory/InventoryTable';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { PaginateInventoryReceipts } from '@/lib/custom-types';
import apiService from '@/services/apiService';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { PackageIcon, PackageSearch, PlusIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

const WIDGET_COLORS = ['chart-1', 'chart-2', 'chart-3', 'chart-4'];
type Stock = {
    id: number;
    campus: string;
    quantity: number;
    received_total: number;
    printed_total: number;
};

type PageProps = {
    stocks: Stock[];
    totalStock: number;
    summary: InventorySummaryData;
    unassignedPrints: number;
};
export default function Index() {
    const { stocks, totalStock, summary, unassignedPrints } =
        usePage<PageProps>().props;
    const [ledgerKey, setLedgerKey] = useState(0);
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: `Inventory`,
            href: `/inventory`,
        },
    ];

    const [receipts, setReceipts] = useState<PaginateInventoryReceipts | null>(
        null,
    );
    const [receiptsLoading, setReceiptsLoading] = useState(false);
    const [addOpen, setAddOpen] = useState(false);

    // Which campus's audit is currently open in the modal.
    const [auditStock, setAuditStock] = useState<Stock | null>(null);

    const [campus, setCampus] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [search, setSearch] = useState<string | null>(null);
    const [dateFrom, setDateFrom] = useState<string | null>(null);
    const [dateTo, setDateTo] = useState<string | null>(null);
    const [minQuantity, setMinQuantity] = useState<string | null>(null);
    const [maxQuantity, setMaxQuantity] = useState<string | null>(null);
    const [perPage, setPerPage] = useState(10);
    const [sort, setSort] = useState('created_at');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');

    const filterParams = () => ({
        campus: campus || null,
        status: status || null,
        search: search || null,
        from: dateFrom ? `${dateFrom} 00:00:00` : null,
        to: dateTo ? `${dateTo} 23:59:59` : null,
        min_quantity: minQuantity || null,
        max_quantity: maxQuantity || null,
        perPage,
        sort,
        order,
    });

    const hasActiveFilters = useMemo(
        () =>
            !!(
                campus ||
                status ||
                search ||
                dateFrom ||
                dateTo ||
                minQuantity ||
                maxQuantity ||
                perPage !== 10 ||
                sort !== 'created_at' ||
                order !== 'desc'
            ),
        [
            campus,
            status,
            search,
            dateFrom,
            dateTo,
            minQuantity,
            maxQuantity,
            perPage,
            sort,
            order,
        ],
    );

    const fetchReceipts = async (page?: string) => {
        setReceiptsLoading(true);
        try {
            const { data } = await apiService.get(
                route('inventory.receipts.paginate'),
                { params: { ...filterParams(), ...(page ? { page } : {}) } },
            );
            setReceipts(data);
        } catch (e) {
            console.error('Error fetching inventory receipts:', e);
        } finally {
            setReceiptsLoading(false);
        }
    };

    const resetFilters = () => {
        setCampus(null);
        setStatus(null);
        setSearch(null);
        setDateFrom(null);
        setDateTo(null);
        setMinQuantity(null);
        setMaxQuantity(null);
        setSort('created_at');
        setOrder('desc');
        setPerPage(10);
    };

    // After a receipt is added: refresh the table, the stock widgets and
    // the summary.
    const handleReceiptChanged = () => {
        fetchReceipts();
        setLedgerKey((k) => k + 1);
        router.reload({
            only: ['stocks', 'totalStock', 'summary', 'unassignedPrints'],
        });
    };

    // "Audit" in the toolbar: if a campus is already selected in the filter
    // bar, jump straight to its audit. Otherwise show a picker.
    const openAudit = (stock: Stock) => setAuditStock(stock);

    const handleAuditClick = () => {
        if (campus) {
            const match = stocks.find((s) => s.campus === campus);
            if (match) {
                openAudit(match);
                return;
            }
        }
        if (stocks.length === 1) {
            openAudit(stocks[0]);
        }
        // Otherwise the dropdown (below) lets them pick a campus.
    };

    useEffect(() => {
        const t = setTimeout(() => fetchReceipts(), 500);
        return () => clearTimeout(t);
    }, [
        campus,
        status,
        search,
        dateFrom,
        dateTo,
        minQuantity,
        maxQuantity,
        perPage,
        sort,
        order,
    ]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory" />

            <AddReceiptDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                stocks={stocks}
                onSuccess={handleReceiptChanged}
            />

            <InventoryAuditDialog
                stockId={auditStock?.id ?? null}
                campus={auditStock?.campus ?? ''}
                open={auditStock !== null}
                onOpenChange={(open) => !open && setAuditStock(null)}
            />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {stocks.map((s, i) => (
                        <Widget
                            key={s.id}
                            count={s.quantity}
                            title={s.campus}
                            description={`${s.received_total.toLocaleString()} received · ${s.printed_total.toLocaleString()} printed`}
                            icon={PackageIcon}
                            color={
                                WIDGET_COLORS[(i + 1) % WIDGET_COLORS.length]
                            }
                        />
                    ))}
                </div>

                <InventorySummary summary={summary} />

                {unassignedPrints > 0 && (
                    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                        {unassignedPrints.toLocaleString()} print(s) could not
                        be matched to any campus (the printing user has no
                        campus and the student has none either), so they are not
                        deducted from any stock.
                    </div>
                )}

                <InventoryLedgerPanel stocks={stocks} refreshKey={ledgerKey} />

                <div className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <Heading
                            title="Inventory Receipts"
                            description="Deliveries sent to each campus. A delivery only adds to stock once the campus confirms it."
                        />
                        <div className="flex gap-2">
                            {campus || stocks.length <= 1 ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAuditClick}
                                >
                                    <PackageSearch /> Audit
                                </Button>
                            ) : (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                        >
                                            <PackageSearch /> Audit
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>
                                            Audit which campus?
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {stocks.map((s) => (
                                            <DropdownMenuItem
                                                key={s.id}
                                                onClick={() => openAudit(s)}
                                            >
                                                {s.campus}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => setAddOpen(true)}
                            >
                                <PlusIcon /> Add
                            </Button>
                        </div>
                    </div>
                    <InventoryFilterBar
                        campusOptions={stocks.map((s) => s.campus)}
                        selectedCampus={campus}
                        onCampusChange={setCampus}
                        status={status}
                        onStatusChange={setStatus}
                        searchValue={search}
                        onSearchChange={setSearch}
                        perPage={perPage}
                        onPerPageChange={setPerPage}
                        sort={sort}
                        onSortChange={setSort}
                        order={order}
                        onOrderChange={setOrder}
                        dateFrom={dateFrom}
                        onDateFromChange={setDateFrom}
                        dateTo={dateTo}
                        onDateToChange={setDateTo}
                        minQuantity={minQuantity}
                        onMinQuantityChange={setMinQuantity}
                        maxQuantity={maxQuantity}
                        onMaxQuantityChange={setMaxQuantity}
                        hasActiveFilters={hasActiveFilters}
                        onReset={resetFilters}
                        totalEntries={receipts?.total ?? 0}
                    />
                    <InventoryTable
                        receipts={receipts?.data ?? []}
                        total={receipts?.total}
                        from={receipts?.from ?? undefined}
                        to={receipts?.to ?? undefined}
                        links={receipts?.links}
                        onPageChange={(page) => fetchReceipts(page)}
                        isLoading={receiptsLoading}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
