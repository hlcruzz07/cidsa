import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { StudentProps, StudentReplacement } from '@/lib/custom-types';
import { campusDirectoryArr } from '@/lib/utils';
import apiService from '@/services/apiService';
import {
    AlertCircleIcon,
    BookMarkedIcon,
    BookOpenCheck,
    ChartLineIcon,
    CheckIcon,
    CheckSquare,
    ChevronDownIcon,
    ClockIcon,
    FileSpreadsheetIcon,
    FilterXIcon,
    IdCard,
    Loader2,
    Printer,
    PrinterCheck,
    Search,
    Square,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as XLSX from 'xlsx';
import { route } from 'ziggy-js';
import { IdCardBack, IdCardFront } from './StudentIdCard';

const DEBUG_PREVIEW_IN_NEW_TAB = false;

const CARD_W = 448;
const CARD_H = 282;
const SCALE = 0.72;
const PAGE_SIZE = 30;

// ─── Types ────────────────────────────────────────────────────────────────────

/** 'new' = new ID requests (Students table), 'replacement' = StudentReplacement table */
type PrintMode = 'new' | 'replacement';

interface BatchIdPrintDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    campus?: string;
    /** Controls which endpoint + filters to use. Defaults to 'new'. */
    mode?: PrintMode;
    onClose: () => void;
}

type PrintStep =
    | { type: 'idle' }
    | { type: 'fetching' }
    | { type: 'rendering' }
    | { type: 'waiting_images'; loaded: number; total: number }
    | { type: 'done'; count: number }
    | { type: 'error'; message: string };

// Single flat filter shape — isCompleted is only sent to the API when mode === 'new'
interface ListFilters {
    search: string;
    college: string | null;
    program: string | null;
    year: string | null;
    isPrinted: boolean | null;
    isCompleted: boolean | null; // only relevant for mode === 'new'
}

const YEAR_OPTIONS = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
    '5th Year',
];

// A unified "list item" that works for both modes
interface ListItem {
    id: number; // student.id for new, replacement.id for replacement
    student_id?: number;
    id_number: string;
    fullName: string;
    // Raw name parts, kept separately so the checklist export can format
    // "Last Suffix, First M.I." independently of the on-screen fullName.
    firstName: string;
    middleInit: string;
    lastName: string;
    suffix: string;
    college: string; // college code, e.g. "CCS" — resolved to a name via collegeOptions
    program: string;
    year: string;
    isPrinted: boolean;
    receiptOrExtra?: string; // receipt for replacements
    updatedAt: string | null; // raw updated_at timestamp, used as "Date Submitted"
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildFullName(s: {
    first_name?: string | null;
    middle_init?: string | null;
    last_name?: string | null;
    suffix?: string | null;
}) {
    return [
        s.first_name,
        s.middle_init ? `${s.middle_init}.` : null,
        s.last_name,
        s.suffix,
    ]
        .filter(Boolean)
        .join(' ');
}

function toListItem(
    raw: StudentProps | StudentReplacement,
    mode: PrintMode,
): ListItem {
    if (mode === 'replacement') {
        const r = raw as StudentReplacement;
        const s = r.student!;
        return {
            id: r.id,
            student_id: s.id,
            id_number: s.id_number ?? '',
            fullName: buildFullName(s),
            firstName: s.first_name ?? '',
            middleInit: s.middle_init ?? '',
            lastName: s.last_name ?? '',
            suffix: s.suffix ?? '',
            college: (s as any).college ?? '',
            program: s.program ?? '',
            year: s.year ?? '',
            isPrinted: r.is_printed,
            receiptOrExtra: r.receipt ?? undefined,
            updatedAt: (r as any).updated_at ?? null,
        };
    } else {
        const s = raw as StudentProps;
        return {
            id: s.id,
            id_number: s.id_number ?? '',
            fullName: buildFullName(s),
            firstName: s.first_name ?? '',
            middleInit: s.middle_init ?? '',
            lastName: s.last_name ?? '',
            suffix: s.suffix ?? '',
            college: (s as any).college ?? '',
            program: s.program ?? '',
            year: s.year ?? '',
            // printed = has a PrintedStudents record (backend sends printed_exists or withExists)
            isPrinted: !!(s as any).printed_exists || !!(s as any).printed,
            updatedAt: (s as any).updated_at ?? null,
        };
    }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BatchIdPrintDialog({
    open,
    setOpen,
    campus = '',
    mode = 'new',
    onClose,
}: BatchIdPrintDialogProps) {
    // ─── List state ───────────────────────────────────────────────────────────
    const [items, setItems] = useState<ListItem[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [listError, setListError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    // ─── Filters ──────────────────────────────────────────────────────────────
    const defaultFilters = (): ListFilters => ({
        search: '',
        college: null,
        program: null,
        year: null,
        isPrinted: null,
        isCompleted: null,
    });

    const [filters, setFilters] = useState<ListFilters>(defaultFilters());

    // ─── Selection / print ────────────────────────────────────────────────────
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [printStep, setPrintStep] = useState<PrintStep>({ type: 'idle' });

    // ─── Checklist export ─────────────────────────────────────────────────────
    const [isGeneratingChecklist, setIsGeneratingChecklist] = useState(false);

    const sentinelRef = useRef<HTMLDivElement>(null);

    // ─── Campus options ───────────────────────────────────────────────────────
    const collegeOptions =
        campusDirectoryArr.find((c) => c.campus.includes(campus))?.colleges ??
        [];
    const programOptions =
        collegeOptions.find((c) => c.value === filters.college)?.programs ?? [];

    // ─── Build API params ─────────────────────────────────────────────────────
    const buildParams = (page: number) => {
        const base = {
            search: filters.search || null,
            college: filters.college,
            program: filters.program,
            year: filters.year,
            campus: campus || null,
            perPage: PAGE_SIZE,
            page,
        };

        return {
            ...base,
            is_printed: filters.isPrinted,
            // is_completed only sent for new student mode
            ...(mode === 'new' ? { is_completed: filters.isCompleted } : {}),
        };
    };

    const listRoute =
        mode === 'replacement'
            ? 'filter.paginate.replacements'
            : 'filter.paginate';

    // ─── Fetch first page ─────────────────────────────────────────────────────
    const fetchFirstPage = useCallback(async () => {
        if (!open) return;
        setIsLoadingList(true);
        setListError(null);
        setItems([]);
        setCurrentPage(1);
        setHasMore(false);

        try {
            const res = await apiService.get(route(listRoute), {
                params: buildParams(1),
            });
            const paged = res.data;
            setItems((paged.data ?? []).map((r: any) => toListItem(r, mode)));
            setTotalCount(paged.total ?? 0);
            setHasMore((paged.current_page ?? 1) < (paged.last_page ?? 1));
            setCurrentPage(paged.current_page ?? 1);
        } catch (err: any) {
            setListError(err?.response?.data?.error || 'Failed to load list.');
        } finally {
            setIsLoadingList(false);
        }
    }, [open, filters, campus, mode]);

    // ─── Fetch next page ──────────────────────────────────────────────────────
    const fetchNextPage = useCallback(async () => {
        if (isFetchingMore || !hasMore) return;
        setIsFetchingMore(true);
        const nextPage = currentPage + 1;
        try {
            const res = await apiService.get(route(listRoute), {
                params: buildParams(nextPage),
            });
            const paged = res.data;
            setItems((prev) => [
                ...prev,
                ...(paged.data ?? []).map((r: any) => toListItem(r, mode)),
            ]);
            setHasMore((paged.current_page ?? 1) < (paged.last_page ?? 1));
            setCurrentPage(paged.current_page ?? 1);
        } catch {
        } finally {
            setIsFetchingMore(false);
        }
    }, [isFetchingMore, hasMore, currentPage, filters, campus, mode]);

    // Debounced re-fetch on filter change
    useEffect(() => {
        if (!open) return;
        const t = setTimeout(fetchFirstPage, filters.search ? 400 : 0);
        return () => clearTimeout(t);
    }, [open, filters]);

    // Reset on open / mode change
    useEffect(() => {
        if (open) {
            setSelectedIds(new Set());
            setPrintStep({ type: 'idle' });
            setFilters(defaultFilters());
        } else {
            setItems([]);
        }
    }, [open, mode]);

    // Infinite scroll
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasMore && !isFetchingMore)
                    fetchNextPage();
            },
            { threshold: 0.1 },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, isFetchingMore, fetchNextPage]);

    // ─── Selection helpers ────────────────────────────────────────────────────
    const allVisibleSelected =
        items.length > 0 && items.every((s) => selectedIds.has(s.id));
    const someVisibleSelected =
        !allVisibleSelected && items.some((s) => selectedIds.has(s.id));

    const toggleItem = (id: number) =>
        setSelectedIds((prev) => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });

    const toggleAllVisible = () =>
        setSelectedIds((prev) => {
            const n = new Set(prev);
            if (allVisibleSelected) items.forEach((s) => n.delete(s.id));
            else items.forEach((s) => n.add(s.id));
            return n;
        });

    const clearSelection = () => setSelectedIds(new Set());
    const selectedCount = selectedIds.size;

    // ─── Filter helpers ───────────────────────────────────────────────────────
    const setFilter = <K extends keyof ListFilters>(
        key: K,
        value: ListFilters[K],
    ) => setFilters((prev) => ({ ...prev, [key]: value }));

    const hasActiveFilters = !!(
        filters.search ||
        filters.college ||
        filters.program ||
        filters.year ||
        filters.isPrinted !== null ||
        filters.isCompleted !== null
    );

    const resetFilters = () => setFilters(defaultFilters());

    // ─── Checklist helpers ────────────────────────────────────────────────────
    const getCollegeName = (code: string) =>
        collegeOptions.find((c) => c.value === code)?.name ?? code;

    const formatDateSubmitted = (updatedAt: string | null) => {
        if (!updatedAt) return '';
        const d = new Date(updatedAt);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
        });
    };

    const formatChecklistName = (item: ListItem) => {
        const last = [item.lastName, item.suffix].filter(Boolean).join(' ');
        const first = [
            item.firstName,
            item.middleInit ? `${item.middleInit}.` : null,
        ]
            .filter(Boolean)
            .join(' ');
        return [last, first].filter(Boolean).join(', ');
    };

    // ─── Mark selected as Printed ────────────────────────────────────────────
    const [isMarkingPrinted, setIsMarkingPrinted] = useState(false);

    const markSelectedAsPrinted = async () => {
        const selectedItems = items.filter(
            (i) => selectedIds.has(i.id) && !i.isPrinted,
        );
        if (selectedItems.length === 0) return;

        setIsMarkingPrinted(true);
        try {
            await Promise.allSettled(
                selectedItems.map((item) =>
                    mode === 'replacement'
                        ? apiService.put(
                              route('update.student.rep.status', {
                                  status: 'printed',
                                  id: item.id,
                              }),
                          )
                        : apiService.put(
                              route('update.student.new.status', {
                                  status: 'printed',
                                  id_number: item.id_number,
                              }),
                          ),
                ),
            );
            // Optimistically flip all selected items to printed in-place
            const selectedSet = new Set(selectedItems.map((i) => i.id));
            setItems((prev) =>
                prev.map((i) =>
                    selectedSet.has(i.id) ? { ...i, isPrinted: true } : i,
                ),
            );
        } finally {
            setIsMarkingPrinted(false);
        }
    };

    // ─── Generate checklist Excel ────────────────────────────────────────────
    const generateChecklistExcel = async () => {
        const selectedItems = items.filter((i) => selectedIds.has(i.id));
        if (selectedItems.length === 0) return;

        setIsGeneratingChecklist(true);
        try {
            const sortedItems = [...selectedItems].sort((a, b) => {
                const collegeCompare = getCollegeName(a.college).localeCompare(
                    getCollegeName(b.college),
                );
                if (collegeCompare !== 0) return collegeCompare;

                const programCompare = a.program.localeCompare(b.program);
                if (programCompare !== 0) return programCompare;

                return a.lastName.localeCompare(b.lastName);
            });

            const rows = sortedItems.map((item) => ({
                'ID NUMBER': item.id_number,
                'FULL NAME': formatChecklistName(item),
                CAMPUS: campus,
                COLLEGE: getCollegeName(item.college),
                PROGRAM: item.program,
                'DATE SUBMITTED': formatDateSubmitted(item.updatedAt),
                DATE: '',
                SIGNATURE: '',
            }));

            const worksheet = XLSX.utils.json_to_sheet(rows);
            worksheet['!cols'] = [
                { wch: 14 },
                { wch: 32 },
                { wch: 12 },
                { wch: 28 },
                { wch: 24 },
                { wch: 16 },
                { wch: 14 },
                { wch: 20 },
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Checklist');

            const today = new Date().toISOString().slice(0, 10);
            const filename = `ID_Checklist_${mode === 'replacement' ? 'Replacement' : 'New'}_${today}.xlsx`;

            // Local download for the user
            XLSX.writeFile(workbook, filename);

            // Also upload to Google Drive, filed under Checklist/<campus>
            const wbArrayBuffer = XLSX.write(workbook, {
                bookType: 'xlsx',
                type: 'array',
            });
            const blob = new Blob([wbArrayBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });

            const formData = new FormData();
            formData.append('file', blob, filename);
            formData.append('campus', campus);

            await apiService.post(route('checklist.store'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        } catch (err) {
            console.error('Failed to upload checklist to Google Drive:', err);
            // optional: surface a toast/error state here
        } finally {
            setIsGeneratingChecklist(false);
        }
    };
    // ─── Print ────────────────────────────────────────────────────────────────
    const handleBatchPrint = async () => {
        if (selectedCount === 0) return;
        setPrintStep({ type: 'fetching' });

        // For replacements, we need the *student* IDs (not replacement IDs) to fetch card data.
        // Items in replacement mode carry student_id.
        const selectedItems = items.filter((i) => selectedIds.has(i.id));
        const studentIds =
            mode === 'replacement'
                ? selectedItems.map((i) => i.student_id!)
                : Array.from(selectedIds);

        let cardDataList: StudentProps[];
        try {
            const res = await apiService.get(route('get.students'), {
                params: { ids: studentIds },
            });
            cardDataList = res.data as StudentProps[];
            if (!cardDataList?.length) {
                setPrintStep({
                    type: 'error',
                    message: 'No card data returned from server.',
                });
                return;
            }
        } catch (err: any) {
            setPrintStep({
                type: 'error',
                message:
                    err?.response?.data?.error || 'Failed to fetch card data.',
            });
            return;
        }

        setPrintStep({ type: 'rendering' });

        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${CARD_W}px;opacity:0;pointer-events:none;`;
        document.body.appendChild(tempContainer);

        await new Promise<void>((resolve) => {
            const root = createRoot(tempContainer);
            root.render(
                <>
                    {cardDataList.map((data) => (
                        <div
                            key={`${data.id_number}-front`}
                            style={{ width: CARD_W, height: CARD_H }}
                        >
                            <IdCardFront data={data} />
                        </div>
                    ))}
                    {cardDataList.map((data) => (
                        <div
                            key={`${data.id_number}-back`}
                            style={{ width: CARD_W, height: CARD_H }}
                        >
                            <IdCardBack data={data} />
                        </div>
                    ))}
                </>,
            );
            setTimeout(resolve, 300);
        });

        await openPrintWindow(cardDataList, tempContainer);
        setTimeout(() => document.body.removeChild(tempContainer), 1000);
        setPrintStep({ type: 'done', count: cardDataList.length });
    };

    const openPrintWindow = (
        cardDataList: StudentProps[],
        container: HTMLElement,
    ): Promise<void> => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return Promise.resolve();

        let stylesHtml = '';
        document.head.querySelectorAll('link').forEach((link) => {
            stylesHtml += link.outerHTML;
        });
        for (let i = 0; i < document.styleSheets.length; i++) {
            try {
                const sheet = document.styleSheets[i];
                if (sheet.href) {
                    stylesHtml += `<link rel="stylesheet" href="${sheet.href}">`;
                } else {
                    const rules = Array.from(sheet.cssRules)
                        .map((r) => r.cssText)
                        .join('\n');
                    stylesHtml += `<style>${rules}</style>`;
                }
            } catch {}
        }
        document.querySelectorAll('style').forEach((style) => {
            stylesHtml += style.outerHTML;
        });

        const scaledW = Math.round(CARD_W * SCALE);
        const scaledH = Math.round(CARD_H * SCALE);
        const cards =
            container.querySelectorAll<HTMLElement>('[data-slot="card"]');
        const n = cardDataList.length;

        let pagesHtml = '';
        for (let i = 0; i < n; i++) {
            const front = cards[i]?.outerHTML ?? '';
            const back = cards[n + i]?.outerHTML ?? '';
            pagesHtml += `<div class="print-page">${front}</div><div class="print-page">${back}</div>`;
        }

        printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <base href="${window.location.origin}">
    <title>Batch ID Print — ${n} student(s)</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    ${stylesHtml}
    <style>
      body { margin: 0; font-family: 'Inter', sans-serif !important; }
      .print-page {
        width: ${scaledW}px; height: ${scaledH}px;
        overflow: hidden; page-break-after: always; break-after: page; position: relative;
      }
      .print-page > div[data-slot="card"] {
        width: ${CARD_W}px !important; height: ${CARD_H}px !important;
        max-width: ${CARD_W}px !important; min-width: ${CARD_W}px !important;
        border-radius: 0 !important; transform: scale(${SCALE}) !important;
        transform-origin: top left !important; font-family: 'Inter', sans-serif !important;
        box-shadow: none !important; border: none !important;
        position: relative !important; left: 0 !important; top: 0 !important;
      }
    </style>
  </head>
  <body>
    ${pagesHtml}
    <script>
      window.onload = function() {
        if (${DEBUG_PREVIEW_IN_NEW_TAB}) return;
        var images = Array.from(document.images);
        var total = images.length;
        function doPrint() {
          if (window.opener) window.opener.postMessage({ type: 'PRINT_READY' }, '*');
          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            });
          });
        }
        if (total === 0) { doPrint(); return; }
        var loaded = 0;
        function onSettle() {
          loaded++;
          if (window.opener) window.opener.postMessage({ type: 'PRINT_IMAGE_PROGRESS', loaded: loaded, total: total }, '*');
          if (loaded >= total) { doPrint(); }
        }
        images.forEach(function(img) {
          if (img.complete) { onSettle(); }
          else { img.addEventListener('load', onSettle); img.addEventListener('error', onSettle); }
        });
        setTimeout(doPrint, 15000);
      };
    </script>
  </body>
</html>`);
        printWindow.document.close();

        return new Promise<void>((resolve) => {
            const onMessage = (event: MessageEvent) => {
                if (event.source !== printWindow) return;
                const msg = event.data;
                if (msg?.type === 'PRINT_IMAGE_PROGRESS') {
                    setPrintStep({
                        type: 'waiting_images',
                        loaded: msg.loaded,
                        total: msg.total,
                    });
                }
                if (msg?.type === 'PRINT_READY') {
                    window.removeEventListener('message', onMessage);
                    resolve();
                }
            };
            window.addEventListener('message', onMessage);
            setTimeout(() => {
                window.removeEventListener('message', onMessage);
                resolve();
            }, 16000);
        });
    };

    const isPrinting = ['fetching', 'rendering', 'waiting_images'].includes(
        printStep.type,
    );

    const modeLabel =
        mode === 'replacement' ? 'Replacement IDs' : 'New Student IDs';

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                if (!value) {
                    onClose();
                    setPrintStep({ type: 'idle' });
                }

                setOpen(value);
            }}
        >
            <DialogContent
                showCloseButton={!isPrinting}
                onInteractOutside={(e) => {
                    if (isPrinting) e.preventDefault();
                }}
                className="batch-id-print-dialog flex max-h-[90vh] w-full max-w-3xl! flex-col gap-0 p-0"
            >
                <DialogHeader className="px-6 pt-6 pb-4">
                    <DialogTitle className="flex items-center gap-2">
                        <Printer className="h-5 w-5" />
                        Batch Print — {modeLabel}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-1 flex-col gap-3 overflow-hidden px-6 pb-6">
                    {/* ── Filters ── */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search */}
                        <div className="relative min-w-[200px] flex-1">
                            <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search name, ID, program…"
                                value={filters.search}
                                onChange={(e) =>
                                    setFilter('search', e.target.value)
                                }
                                className="pl-8"
                            />
                            {filters.search && (
                                <button
                                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    onClick={() => setFilter('search', '')}
                                    aria-label="Clear search"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* College */}
                        {collegeOptions.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <BookMarkedIcon className="h-3.5 w-3.5" />
                                        College
                                        {filters.college && (
                                            <Badge className="ml-1 text-[10px]">
                                                {filters.college}
                                            </Badge>
                                        )}
                                        <ChevronDownIcon className="h-3.5 w-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="max-h-64 overflow-y-auto">
                                    {collegeOptions.map((item) => (
                                        <DropdownMenuCheckboxItem
                                            key={item.value}
                                            checked={
                                                filters.college === item.value
                                            }
                                            onSelect={() =>
                                                setFilters((prev) => ({
                                                    ...prev,
                                                    college:
                                                        prev.college ===
                                                        item.value
                                                            ? null
                                                            : item.value,
                                                    program: null,
                                                }))
                                            }
                                        >
                                            {item.name}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Program */}
                        {programOptions.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <BookOpenCheck className="h-3.5 w-3.5" />
                                        Program
                                        {filters.program && (
                                            <Badge className="ml-1 text-[10px]">
                                                {filters.program}
                                            </Badge>
                                        )}
                                        <ChevronDownIcon className="h-3.5 w-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="max-h-64 overflow-y-auto">
                                    {programOptions.map((item) => (
                                        <DropdownMenuCheckboxItem
                                            key={item.name}
                                            checked={
                                                filters.program === item.name
                                            }
                                            onSelect={() =>
                                                setFilter(
                                                    'program',
                                                    filters.program ===
                                                        item.name
                                                        ? null
                                                        : item.name,
                                                )
                                            }
                                        >
                                            {item.name}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Year */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <BookOpenCheck className="h-3.5 w-3.5" />
                                    Year
                                    {filters.year && (
                                        <Badge className="ml-1 text-[10px]">
                                            {filters.year}
                                        </Badge>
                                    )}
                                    <ChevronDownIcon className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {YEAR_OPTIONS.map((y) => (
                                    <DropdownMenuCheckboxItem
                                        key={y}
                                        checked={filters.year === y}
                                        onSelect={() =>
                                            setFilter(
                                                'year',
                                                filters.year === y ? null : y,
                                            )
                                        }
                                    >
                                        {y}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Status — differs per mode */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <ChartLineIcon className="h-3.5 w-3.5" />
                                    Status
                                    <div className="flex gap-1">
                                        {/* Printed badge — both modes */}
                                        {filters.isPrinted === true && (
                                            <Badge className="text-[10px]">
                                                <CheckIcon className="h-2.5 w-2.5" />{' '}
                                                Printed
                                            </Badge>
                                        )}
                                        {filters.isPrinted === false && (
                                            <Badge
                                                variant="outline"
                                                className="text-[10px]"
                                            >
                                                <ClockIcon className="h-2.5 w-2.5" />{' '}
                                                Pending
                                            </Badge>
                                        )}
                                        {/* Completed badge — new mode only */}
                                        {mode === 'new' &&
                                            filters.isCompleted === true && (
                                                <Badge className="text-[10px]">
                                                    <CheckIcon className="h-2.5 w-2.5" />{' '}
                                                    Completed
                                                </Badge>
                                            )}
                                        {mode === 'new' &&
                                            filters.isCompleted === false && (
                                                <Badge
                                                    variant="destructive"
                                                    className="text-[10px]"
                                                >
                                                    <AlertCircleIcon className="h-2.5 w-2.5" />{' '}
                                                    Incomplete
                                                </Badge>
                                            )}
                                    </div>
                                    <ChevronDownIcon className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {/* Printed — both modes */}
                                {mode === 'new' ? (
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                            Printed
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                            {[
                                                {
                                                    label: 'Printed',
                                                    value: true,
                                                },
                                                {
                                                    label: 'Not Printed',
                                                    value: false,
                                                },
                                            ].map((item) => (
                                                <DropdownMenuCheckboxItem
                                                    key={item.label}
                                                    checked={
                                                        filters.isPrinted ===
                                                        item.value
                                                    }
                                                    onSelect={(e) => {
                                                        e.preventDefault();
                                                        setFilter(
                                                            'isPrinted',
                                                            filters.isPrinted ===
                                                                item.value
                                                                ? null
                                                                : item.value,
                                                        );
                                                    }}
                                                >
                                                    {item.label}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                ) : (
                                    // Replacement: flat list for isPrinted
                                    [
                                        { label: 'Printed', value: true },
                                        { label: 'Pending', value: false },
                                    ].map((item) => (
                                        <DropdownMenuCheckboxItem
                                            key={item.label}
                                            checked={
                                                filters.isPrinted === item.value
                                            }
                                            onSelect={(e) => {
                                                e.preventDefault();
                                                setFilter(
                                                    'isPrinted',
                                                    filters.isPrinted ===
                                                        item.value
                                                        ? null
                                                        : item.value,
                                                );
                                            }}
                                        >
                                            {item.label}
                                        </DropdownMenuCheckboxItem>
                                    ))
                                )}

                                {/* Completed — new mode only */}
                                {mode === 'new' && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                                Completed
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent>
                                                {[
                                                    {
                                                        label: 'Yes',
                                                        value: true,
                                                    },
                                                    {
                                                        label: 'No',
                                                        value: false,
                                                    },
                                                ].map((item) => (
                                                    <DropdownMenuCheckboxItem
                                                        key={item.label}
                                                        checked={
                                                            filters.isCompleted ===
                                                            item.value
                                                        }
                                                        onSelect={(e) => {
                                                            e.preventDefault();
                                                            setFilter(
                                                                'isCompleted',
                                                                filters.isCompleted ===
                                                                    item.value
                                                                    ? null
                                                                    : item.value,
                                                            );
                                                        }}
                                                    >
                                                        {item.label}
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Reset */}
                        {hasActiveFilters && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={resetFilters}
                            >
                                <FilterXIcon className="h-3.5 w-3.5" /> Reset
                            </Button>
                        )}
                    </div>

                    {/* ── Selection bar ── */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <button
                            className="flex items-center gap-1.5 transition-colors hover:text-foreground disabled:opacity-40"
                            onClick={toggleAllVisible}
                            disabled={items.length === 0}
                        >
                            {allVisibleSelected ? (
                                <CheckSquare className="h-4 w-4 text-primary" />
                            ) : someVisibleSelected ? (
                                <Square className="h-4 w-4 text-primary opacity-60" />
                            ) : (
                                <Square className="h-4 w-4" />
                            )}
                            <span>
                                {allVisibleSelected
                                    ? 'Deselect visible'
                                    : 'Select visible'}
                            </span>
                        </button>

                        <div className="flex items-center gap-3">
                            {selectedCount > 0 && (
                                <button
                                    className="flex items-center gap-1 transition-colors hover:text-destructive"
                                    onClick={clearSelection}
                                >
                                    <X className="h-3.5 w-3.5" /> Clear
                                </button>
                            )}
                            <span>
                                {selectedCount > 0 ? (
                                    <span className="font-medium text-foreground">
                                        {selectedCount} selected
                                    </span>
                                ) : (
                                    'None selected'
                                )}
                                {totalCount > 0 &&
                                    ` / ${totalCount.toLocaleString()} total`}
                            </span>
                        </div>
                    </div>

                    {/* ── List ── */}
                    <div className="min-h-0 flex-1 overflow-y-auto rounded-md border">
                        {isLoadingList ? (
                            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <p className="text-sm">Loading…</p>
                            </div>
                        ) : listError ? (
                            <div className="flex flex-col items-center gap-2 py-12 text-sm text-destructive">
                                <p className="font-semibold">Failed to load</p>
                                <p className="text-muted-foreground">
                                    {listError}
                                </p>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-12 text-sm text-muted-foreground">
                                <IdCard className="h-8 w-8 opacity-40" />
                                <p>
                                    {hasActiveFilters
                                        ? 'No records match your filters.'
                                        : 'No records found.'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <ul className="divide-y">
                                    {items.map((item) => {
                                        const isSelected = selectedIds.has(
                                            item.id,
                                        );
                                        return (
                                            <li
                                                key={item.id}
                                                className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${isSelected ? 'bg-muted/30' : ''}`}
                                                onClick={() =>
                                                    toggleItem(item.id)
                                                }
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() =>
                                                        toggleItem(item.id)
                                                    }
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium uppercase">
                                                        {item.fullName}
                                                    </p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {item.id_number}
                                                        {item.program
                                                            ? ` · ${item.program}`
                                                            : ''}
                                                        {item.year
                                                            ? ` · ${item.year}`
                                                            : ''}
                                                    </p>
                                                </div>

                                                {/* Printed status pill */}
                                                {item.isPrinted ? (
                                                    <Badge
                                                        variant="default"
                                                        className="shrink-0 text-[10px]"
                                                    >
                                                        <CheckIcon className="h-2.5 w-2.5" />{' '}
                                                        Printed
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="shrink-0 text-[10px]"
                                                    >
                                                        <ClockIcon className="h-2.5 w-2.5" />{' '}
                                                        Pending
                                                    </Badge>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                                <div
                                    ref={sentinelRef}
                                    className="flex justify-center py-2"
                                >
                                    {isFetchingMore && (
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* ── Print status ── */}
                    {printStep.type !== 'idle' && (
                        <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm">
                            {printStep.type === 'fetching' && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>
                                        Fetching card data for {selectedCount}{' '}
                                        record(s)…
                                    </span>
                                </div>
                            )}
                            {printStep.type === 'rendering' && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Preparing print layout…</span>
                                </div>
                            )}
                            {printStep.type === 'waiting_images' && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>
                                            Loading images… {printStep.loaded} /{' '}
                                            {printStep.total}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-primary transition-all duration-300"
                                            style={{
                                                width: `${printStep.total > 0 ? Math.round((printStep.loaded / printStep.total) * 100) : 0}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                            {printStep.type === 'done' && (
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-green-700">
                                        ✓ Print job sent
                                    </span>
                                    <span className="text-muted-foreground">
                                        — {printStep.count} ID
                                        {printStep.count !== 1 ? 's' : ''}{' '}
                                        queued
                                    </span>
                                </div>
                            )}
                            {printStep.type === 'error' && (
                                <div className="flex items-center gap-2 text-destructive">
                                    <span className="font-medium">Failed</span>
                                    <span className="text-muted-foreground">
                                        {printStep.message}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Actions ── */}
                    <div className="flex items-center justify-between gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setOpen(false);
                                onClose();
                            }}
                            disabled={isPrinting || isMarkingPrinted}
                        >
                            Cancel
                        </Button>
                        <div className="flex gap-2">
                            {/* Generate checklist Excel — only shown when something is selected */}
                            {selectedCount > 0 && (
                                <Button
                                    variant="secondary"
                                    onClick={generateChecklistExcel}
                                    disabled={
                                        isGeneratingChecklist ||
                                        isPrinting ||
                                        isMarkingPrinted
                                    }
                                >
                                    {isGeneratingChecklist ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <FileSpreadsheetIcon className="h-4 w-4" />
                                    )}
                                    Generate Checklist
                                </Button>
                            )}

                            {/* Mark selected as printed — only shown when there are unprinted selections */}
                            {selectedCount > 0 &&
                                items.some(
                                    (i) =>
                                        selectedIds.has(i.id) && !i.isPrinted,
                                ) && (
                                    <Button
                                        variant="secondary"
                                        onClick={markSelectedAsPrinted}
                                        disabled={
                                            isMarkingPrinted || isPrinting
                                        }
                                    >
                                        {isMarkingPrinted ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <PrinterCheck className="h-4 w-4" />
                                        )}
                                        Mark {selectedCount} as Printed
                                    </Button>
                                )}
                            <Button
                                onClick={handleBatchPrint}
                                disabled={
                                    selectedCount === 0 ||
                                    isPrinting ||
                                    isMarkingPrinted
                                }
                                className="min-w-[140px]"
                            >
                                {isPrinting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {printStep.type === 'fetching'
                                            ? 'Fetching…'
                                            : printStep.type === 'rendering'
                                              ? 'Rendering…'
                                              : 'Loading images…'}
                                    </>
                                ) : (
                                    <>
                                        <Printer className="h-4 w-4" />
                                        Print{' '}
                                        {selectedCount > 0
                                            ? `${selectedCount} ID${selectedCount > 1 ? 's' : ''}`
                                            : 'IDs'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
