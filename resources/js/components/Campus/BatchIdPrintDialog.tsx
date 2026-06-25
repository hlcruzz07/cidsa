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
import { StudentProps } from '@/lib/custom-types';
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
    FilterXIcon,
    IdCard,
    Loader2,
    Printer,
    Search,
    Square,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { route } from 'ziggy-js';
import { IdCardBack, IdCardFront } from './StudentIdCard';

const DEBUG_PREVIEW_IN_NEW_TAB = false;

const CARD_W = 448;
const CARD_H = 282;
const SCALE = 0.72;
const PAGE_SIZE = 30;

interface BatchIdPrintDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    /** Campus code used to derive college/program options */
    campus?: string;
}

type PrintStep =
    | { type: 'idle' }
    | { type: 'fetching' }
    | { type: 'rendering' }
    | { type: 'done'; count: number }
    | { type: 'error'; message: string };

interface ListFilters {
    search: string;
    college: string | null;
    program: string | null;
    year: string | null;
    isCompleted: boolean | null;
    isExported: boolean | null;
}

const YEAR_OPTIONS = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
    '5th Year',
];

export function BatchIdPrintDialog({
    open,
    setOpen,
    campus = '',
}: BatchIdPrintDialogProps) {
    // ─── List state ───────────────────────────────────────────────────────────
    const [students, setStudents] = useState<StudentProps[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [listError, setListError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    // ─── Filters ──────────────────────────────────────────────────────────────
    const [filters, setFilters] = useState<ListFilters>({
        search: '',
        college: null,
        program: null,
        year: null,
        isCompleted: null,
        isExported: null,
    });

    // ─── Selection ────────────────────────────────────────────────────────────
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [printStep, setPrintStep] = useState<PrintStep>({ type: 'idle' });

    // ─── Infinite scroll sentinel ─────────────────────────────────────────────
    const sentinelRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // ─── College / program options from campusDirectoryArr ───────────────────
    const collegeOptions =
        campusDirectoryArr.find((c) => c.campus.includes(campus))?.colleges ??
        [];
    const programOptions =
        collegeOptions.find((c) => c.value === filters.college)?.programs ?? [];

    // ─── Build query params ───────────────────────────────────────────────────
    const buildParams = (page: number) => ({
        search: filters.search || null,
        college: filters.college,
        program: filters.program,
        year: filters.year,
        is_completed: filters.isCompleted,
        campus: campus || null,
        perPage: PAGE_SIZE,
        page,
    });

    // ─── Fetch first page (reset) ─────────────────────────────────────────────
    const fetchFirstPage = useCallback(async () => {
        if (!open) return;
        setIsLoadingList(true);
        setListError(null);
        setStudents([]);
        setCurrentPage(1);
        setHasMore(false);

        try {
            const res = await apiService.get(route('filter.paginate'), {
                params: buildParams(1),
            });
            const paginated = res.data;
            setStudents(paginated.data ?? []);
            setTotalCount(paginated.total ?? 0);
            setHasMore(
                (paginated.current_page ?? 1) < (paginated.last_page ?? 1),
            );
            setCurrentPage(paginated.current_page ?? 1);
        } catch (err: any) {
            setListError(
                err?.response?.data?.error || 'Failed to load students.',
            );
        } finally {
            setIsLoadingList(false);
        }
    }, [open, filters, campus]);

    // ─── Fetch next page (append) ─────────────────────────────────────────────
    const fetchNextPage = useCallback(async () => {
        if (isFetchingMore || !hasMore) return;
        setIsFetchingMore(true);
        const nextPage = currentPage + 1;

        try {
            const res = await apiService.get(route('filter.paginate'), {
                params: buildParams(nextPage),
            });
            const paginated = res.data;
            setStudents((prev) => [...prev, ...(paginated.data ?? [])]);
            setHasMore(
                (paginated.current_page ?? 1) < (paginated.last_page ?? 1),
            );
            setCurrentPage(paginated.current_page ?? 1);
        } catch {
            // silently ignore pagination errors
        } finally {
            setIsFetchingMore(false);
        }
    }, [isFetchingMore, hasMore, currentPage, filters, campus]);

    // Re-fetch when filters change (debounced for search)
    useEffect(() => {
        if (!open) return;
        const timer = setTimeout(fetchFirstPage, filters.search ? 400 : 0);
        return () => clearTimeout(timer);
    }, [open, filters]);

    // Reset everything when dialog opens/closes
    useEffect(() => {
        if (open) {
            setSelectedIds(new Set());
            setPrintStep({ type: 'idle' });
            setFilters({
                search: '',
                college: null,
                program: null,
                year: null,
                isCompleted: null,
                isExported: null,
            });
        } else {
            setStudents([]);
        }
    }, [open]);

    // ─── IntersectionObserver for infinite scroll ─────────────────────────────
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isFetchingMore) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 },
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, isFetchingMore, fetchNextPage]);

    // ─── Selection helpers ────────────────────────────────────────────────────
    const allVisibleSelected =
        students.length > 0 && students.every((s) => selectedIds.has(s.id));
    const someVisibleSelected =
        !allVisibleSelected && students.some((s) => selectedIds.has(s.id));

    const toggleStudent = (id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAllVisible = () => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (allVisibleSelected) {
                students.forEach((s) => next.delete(s.id));
            } else {
                students.forEach((s) => next.add(s.id));
            }
            return next;
        });
    };

    const clearSelection = () => setSelectedIds(new Set());
    const selectedCount = selectedIds.size;

    // ─── Filter helpers ───────────────────────────────────────────────────────
    const setFilter = <K extends keyof ListFilters>(
        key: K,
        value: ListFilters[K],
    ) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const hasActiveFilters =
        filters.search ||
        filters.college ||
        filters.program ||
        filters.year ||
        filters.isCompleted !== null ||
        filters.isExported !== null;

    const resetFilters = () =>
        setFilters({
            search: '',
            college: null,
            program: null,
            year: null,
            isCompleted: null,
            isExported: null,
        });

    // ─── Print ────────────────────────────────────────────────────────────────
    const handleBatchPrint = async () => {
        if (selectedCount === 0) return;

        setPrintStep({ type: 'fetching' });

        let cardDataList: StudentProps[];
        try {
            const res = await apiService.get(route('get.students'), {
                params: { ids: Array.from(selectedIds) },
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

        openPrintWindow(cardDataList, tempContainer);

        setTimeout(() => document.body.removeChild(tempContainer), 1000);

        setPrintStep({ type: 'done', count: cardDataList.length });
    };

    const openPrintWindow = (
        cardDataList: StudentProps[],
        container: HTMLElement,
    ) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

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
    var printed = false; // Flag to prevent multiple prints
    
    function printAndClose() {
      if (printed) return;
      printed = true;
      window.print();
      setTimeout(function() { window.close(); }, 500);
    }
    
    if (images.length === 0) { 
      printAndClose();
      return; 
    }
    
    var loaded = 0, total = images.length;
    function onSettle() {
      loaded++;
      if (loaded >= total) {
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            printAndClose();
          });
        });
      }
    }
    
    images.forEach(function(img) {
      if (img.complete) { onSettle(); }
      else { img.addEventListener('load', onSettle); img.addEventListener('error', onSettle); }
    });
    
    // Fallback timeout - only call if not printed yet
    setTimeout(function() { 
      printAndClose();
    }, 10000);
  };
</script>
  </body>
</html>`);
        printWindow.document.close();
    };

    const isPrinting =
        printStep.type === 'fetching' || printStep.type === 'rendering';

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                if (!value) {
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
                className="batch-id-print-dialog flex max-h-[90vh] w-full max-w-2xl flex-col gap-0 p-0"
            >
                <DialogHeader className="px-6 pt-6 pb-4">
                    <DialogTitle className="flex items-center gap-2">
                        <Printer className="h-5 w-5" />
                        Batch Print ID Cards
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-1 flex-col gap-3 overflow-hidden px-6 pb-6">
                    {/* ── Search + Filter row ── */}
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
                                            onSelect={() => {
                                                setFilters((prev) => ({
                                                    ...prev,
                                                    college:
                                                        prev.college ===
                                                        item.value
                                                            ? null
                                                            : item.value,
                                                    program: null,
                                                }));
                                            }}
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

                        {/* Year Level */}
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

                        {/* Status */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <ChartLineIcon className="h-3.5 w-3.5" />
                                    Status
                                    <div className="flex gap-1">
                                        {filters.isCompleted === true && (
                                            <Badge className="text-[10px]">
                                                <CheckIcon className="h-2.5 w-2.5" />{' '}
                                                Done
                                            </Badge>
                                        )}
                                        {filters.isCompleted === false && (
                                            <Badge
                                                variant="destructive"
                                                className="text-[10px]"
                                            >
                                                <AlertCircleIcon className="h-2.5 w-2.5" />{' '}
                                                Done
                                            </Badge>
                                        )}
                                        {filters.isExported === true && (
                                            <Badge className="text-[10px]">
                                                <CheckIcon className="h-2.5 w-2.5" />{' '}
                                                Exported
                                            </Badge>
                                        )}
                                        {filters.isExported === false && (
                                            <Badge
                                                variant="destructive"
                                                className="text-[10px]"
                                            >
                                                <AlertCircleIcon className="h-2.5 w-2.5" />{' '}
                                                Exported
                                            </Badge>
                                        )}
                                    </div>
                                    <ChevronDownIcon className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        Completed
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        {[
                                            { label: 'Yes', value: true },
                                            { label: 'No', value: false },
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
                                <DropdownMenuSeparator />
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        Exported
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        {[
                                            { label: 'Yes', value: true },
                                            { label: 'No', value: false },
                                        ].map((item) => (
                                            <DropdownMenuCheckboxItem
                                                key={item.label}
                                                checked={
                                                    filters.isExported ===
                                                    item.value
                                                }
                                                onSelect={(e) => {
                                                    e.preventDefault();
                                                    setFilter(
                                                        'isExported',
                                                        filters.isExported ===
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
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Reset filters */}
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

                    {/* ── Selection summary bar ── */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <button
                            className="flex items-center gap-1.5 transition-colors hover:text-foreground disabled:opacity-40"
                            onClick={toggleAllVisible}
                            disabled={students.length === 0}
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

                    {/* ── Student list ── */}
                    <div
                        ref={listRef}
                        className="min-h-0 flex-1 overflow-y-auto rounded-md border"
                    >
                        {isLoadingList ? (
                            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <p className="text-sm">Loading students…</p>
                            </div>
                        ) : listError ? (
                            <div className="flex flex-col items-center gap-2 py-12 text-sm text-destructive">
                                <p className="font-semibold">Failed to load</p>
                                <p className="text-muted-foreground">
                                    {listError}
                                </p>
                            </div>
                        ) : students.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-12 text-sm text-muted-foreground">
                                <IdCard className="h-8 w-8 opacity-40" />
                                <p>
                                    {hasActiveFilters
                                        ? 'No students match your filters.'
                                        : 'No students found.'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <ul className="divide-y">
                                    {students.map((student) => {
                                        const isSelected = selectedIds.has(
                                            student.id,
                                        );
                                        const fullName = [
                                            student.first_name,
                                            student.middle_init
                                                ? `${student.middle_init}.`
                                                : null,
                                            student.last_name,
                                            student.suffix,
                                        ]
                                            .filter(Boolean)
                                            .join(' ');

                                        return (
                                            <li
                                                key={student.id}
                                                className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${isSelected ? 'bg-muted/30' : ''}`}
                                                onClick={() =>
                                                    toggleStudent(student.id)
                                                }
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() =>
                                                        toggleStudent(
                                                            student.id,
                                                        )
                                                    }
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                    aria-label={`Select ${fullName}`}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium uppercase">
                                                        {fullName}
                                                    </p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {student.id_number}
                                                        {student.program
                                                            ? ` · ${student.program}`
                                                            : ''}
                                                        {student.year
                                                            ? ` · ${student.year}`
                                                            : ''}
                                                    </p>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>

                                {/* Infinite scroll sentinel */}
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
                                        student(s)…
                                    </span>
                                </div>
                            )}
                            {printStep.type === 'rendering' && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Preparing print layout…</span>
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

                    {/* ── Action buttons ── */}
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isPrinting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBatchPrint}
                            disabled={selectedCount === 0 || isPrinting}
                            className="min-w-[140px]"
                        >
                            {isPrinting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {printStep.type === 'fetching'
                                        ? 'Fetching…'
                                        : 'Rendering…'}
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
            </DialogContent>
        </Dialog>
    );
}
