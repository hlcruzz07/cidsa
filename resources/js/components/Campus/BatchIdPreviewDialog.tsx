import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    type CarouselApi,
} from '@/components/ui/carousel';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { StudentProps } from '@/lib/custom-types';
import apiService from '@/services/apiService';
import {
    ChevronLeft,
    ChevronRight,
    IdCard,
    Printer,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { usePrintCountdown } from './PrintCountdown';
import { IdCardBack, IdCardFront, StudentIdCard } from './StudentIdCard';

const DEBUG_PREVIEW_IN_NEW_TAB = false;

const CARD_W = 448;
const CARD_H = 282;
const SCALE = 0.72;
const FETCH_CHUNK = 50;
const COUNTDOWN_SECONDS = 5;

const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

async function fetchCardData(idNumbers: string[]): Promise<StudentProps[]> {
    const chunks: string[][] = [];
    for (let i = 0; i < idNumbers.length; i += FETCH_CHUNK) {
        chunks.push(idNumbers.slice(i, i + FETCH_CHUNK));
    }
    const responses = await Promise.all(
        chunks.map((chunk) =>
            apiService.get(route('get.students'), {
                params: { ids: chunk },
            }),
        ),
    );
    return responses.flatMap((res) => (res.data ?? []) as StudentProps[]);
}

function collectStylesHtml(): string {
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

    return stylesHtml;
}

const fullName = (s: StudentProps) =>
    [s.first_name, s.middle_init, s.last_name, s.suffix]
        .filter(Boolean)
        .join(' ');

interface BatchIdPreviewDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    /** Selected students, as id_number. */
    idNumbers: string[];
    /** Lets the modal remove a student from the selection. */
    onSelectionChange: (idNumbers: string[]) => void;
}

export function BatchIdPreviewDialog({
    open,
    setOpen,
    idNumbers,
    onSelectionChange,
}: BatchIdPreviewDialogProps) {
    const [cache, setCache] = useState<Record<string, StudentProps>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);

    const [printDialogOpen, setPrintDialogOpen] = useState(false);

    // True only while WE are closing the dialog to kick off a print
    // countdown — lets onOpenChange tell that apart from the user closing
    // it manually, which should cancel the print instead.
    const selfClosingRef = useRef(false);

    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);

    // Load only the students we don't have yet.
    useEffect(() => {
        if (!open) return;

        const missing = idNumbers.filter((id) => !cache[id]);
        if (missing.length === 0) {
            setIsLoading(false);
            return;
        }

        let cancelled = false;
        setIsLoading(true);
        setError(null);

        fetchCardData(missing)
            .then((rows) => {
                if (cancelled) return;
                setCache((prev) => {
                    const next = { ...prev };
                    rows.forEach((r) => {
                        next[r.id_number] = r;
                    });
                    return next;
                });
            })
            .catch((err: any) => {
                if (cancelled) return;
                setError(
                    err?.response?.data?.error ||
                        'Failed to load student ID card data.',
                );
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [open, idNumbers]);

    useEffect(() => {
        if (!open) {
            setCache({});
            setIsFlipped(false);
            setError(null);
            setCurrent(0);
            setPrintDialogOpen(false);
        }
    }, [open]);

    const students = useMemo(
        () =>
            idNumbers
                .map((id) => cache[id])
                .filter((s): s is StudentProps => !!s),
        [idNumbers, cache],
    );

    const notLoadedCount = isLoading ? 0 : idNumbers.length - students.length;

    useEffect(() => {
        if (!api) return;
        const onSelect = () => setCurrent(api.selectedScrollSnap());
        onSelect();
        api.on('select', onSelect);
        api.on('reInit', onSelect);
        return () => {
            api.off('select', onSelect);
            api.off('reInit', onSelect);
        };
    }, [api]);

    const currentStudent = students[current] ?? null;

    const removeCurrent = () => {
        if (!currentStudent) return;
        const next = idNumbers.filter((id) => id !== currentStudent.id_number);
        onSelectionChange(next);
        if (next.length === 0) setOpen(false);
    };

    const countdown = usePrintCountdown({ seconds: COUNTDOWN_SECONDS });

    // Renders every student off-screen, waits for fonts + AutoFitText to
    // settle, then writes the final print layout into `printWindow`.
    const doPrint = async (printWindow: Window, list: StudentProps[]) => {
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${CARD_W}px;opacity:0;pointer-events:none;`;
        document.body.appendChild(tempContainer);
        const root = createRoot(tempContainer);

        try {
            flushSync(() => {
                root.render(
                    <>
                        {list.map((data) => (
                            <div
                                key={`${data.id_number}-front`}
                                style={{ width: CARD_W, height: CARD_H }}
                            >
                                <IdCardFront data={data} />
                            </div>
                        ))}
                        {list.map((data) => (
                            <div
                                key={`${data.id_number}-back`}
                                style={{ width: CARD_W, height: CARD_H }}
                            >
                                <IdCardBack data={data} />
                            </div>
                        ))}
                    </>,
                );
            });

            await Promise.race([
                Promise.resolve(document.fonts?.ready).catch(() => {}),
                sleep(2000),
            ]);
            await sleep(800 + Math.min(list.length * 15, 3000));

            const n = list.length;
            const cards =
                tempContainer.querySelectorAll<HTMLElement>(
                    '[data-slot="card"]',
                );

            let pagesHtml = '';
            for (let i = 0; i < n; i++) {
                const front = cards[i]?.outerHTML ?? '';
                const back = cards[n + i]?.outerHTML ?? '';
                pagesHtml += `<div class="print-page">${front}</div><div class="print-page">${back}</div>`;
            }

            const stylesHtml = collectStylesHtml();
            const scaledW = Math.round(CARD_W * SCALE);
            const scaledH = Math.round(CARD_H * SCALE);

            printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <base href="${window.location.origin}">
    <title>Batch ID Print — ${n} student(s)</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${stylesHtml}
    <style>
      body { margin: 0; }
      .print-page {
        width: ${scaledW}px; height: ${scaledH}px;
        overflow: hidden; page-break-after: always; break-after: page; position: relative;
      }
      .print-page > div[data-slot="card"] {
        width: ${CARD_W}px !important; height: ${CARD_H}px !important;
        max-width: ${CARD_W}px !important; min-width: ${CARD_W}px !important;
        border-radius: 0 !important; transform: scale(${SCALE}) !important;
        transform-origin: top left !important;
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
        var printed = false;
        function doPrint() {
          if (printed) return;
          printed = true;
          window.focus();
          setTimeout(function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }, 150);
        }
        if (images.length === 0) { doPrint(); return; }
        var loaded = 0;
        function onSettle() {
          loaded++;
          if (loaded >= images.length) doPrint();
        }
        images.forEach(function(img) {
          if (img.complete) { onSettle(); }
          else { img.addEventListener('load', onSettle); img.addEventListener('error', onSettle); }
        });
        setTimeout(doPrint, 30000);
      };
    </script>
  </body>
</html>`);
            printWindow.document.close();
            printWindow.focus();
        } catch {
            printWindow.close();
            toast.error('Failed to prepare the print layout.');
        } finally {
            root.unmount();
            tempContainer.remove();
        }
    };

    const confirmPrint = () => {
        if (students.length === 0) return;
        const list = students;

        // Close both the confirm alert and the preview dialog before the
        // countdown starts — nothing stays open while waiting.
        setPrintDialogOpen(false);
        selfClosingRef.current = true;
        setOpen(false);

        countdown.start(
            (secondsLeft) =>
                `Printing ${list.length} ID${list.length !== 1 ? 's' : ''} in ${secondsLeft}s…`,
            async () => {
                // Only opened now, once the countdown finishes — most
                // browsers' popup blockers will block this unless popups are
                // allowed for this site, since it's no longer a direct
                // result of the click.
                const printWindow = window.open('', '_blank');
                if (!printWindow) {
                    toast.error(
                        'Popup blocked. Please allow popups for this site, then try printing again.',
                    );
                    return;
                }
                await doPrint(printWindow, list);
            },
        );
    };

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(value) => {
                    if (!value) {
                        if (selfClosingRef.current) {
                            selfClosingRef.current = false;
                        } else {
                            countdown.cancel();
                        }
                    }
                    setOpen(value);
                }}
            >
                <DialogContent className="max-w-xl!">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Printer className="h-5 w-5" />
                            Batch Print Preview
                        </DialogTitle>
                        <DialogDescription>
                            {idNumbers.length} student
                            {idNumbers.length !== 1 ? 's' : ''} selected. Review
                            the IDs, then print them all.
                        </DialogDescription>
                    </DialogHeader>

                    {/* min-w-0: DialogContent is a grid, and a grid item won't
                        shrink below its content's min width. The carousel's
                        row of fixed 448px slides adds up, so without this the
                        wrapper grows past the dialog once there is more than
                        one slide. */}
                    <div className="flex w-full min-w-0 flex-col items-center gap-4">
                        {isLoading && students.length === 0 ? (
                            <Skeleton
                                className="rounded-lg"
                                style={{ width: CARD_W, height: CARD_H }}
                            />
                        ) : error && students.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-12 text-sm text-destructive">
                                <p className="font-semibold">Failed to load</p>
                                <p className="text-muted-foreground">{error}</p>
                            </div>
                        ) : students.length === 0 ? (
                            <div
                                className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground"
                                style={{ height: CARD_H }}
                            >
                                <IdCard className="h-8 w-8 opacity-40" />
                                <p>No students to preview.</p>
                            </div>
                        ) : (
                            <>
                                <Carousel
                                    setApi={setApi}
                                    opts={{ align: 'start' }}
                                    className="w-full min-w-0"
                                >
                                    <CarouselContent>
                                        {students.map((student, index) => {
                                            const isNear =
                                                Math.abs(index - current) <= 1;
                                            return (
                                                <CarouselItem
                                                    key={student.id_number}
                                                    className="flex justify-center"
                                                >
                                                    {isNear ? (
                                                        <div
                                                            style={{
                                                                width: CARD_W,
                                                                height: CARD_H,
                                                                flexShrink: 0,
                                                                perspective:
                                                                    '1000px',
                                                            }}
                                                        >
                                                            <StudentIdCard
                                                                data={student}
                                                                isFlipped={
                                                                    isFlipped
                                                                }
                                                            />
                                                        </div>
                                                    ) : (
                                                        <Skeleton
                                                            className="rounded-lg"
                                                            style={{
                                                                width: CARD_W,
                                                                height: CARD_H,
                                                            }}
                                                        />
                                                    )}
                                                </CarouselItem>
                                            );
                                        })}
                                    </CarouselContent>
                                </Carousel>

                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="icon-sm"
                                        aria-label="Previous ID"
                                        onClick={() => api?.scrollPrev()}
                                        disabled={!api?.canScrollPrev()}
                                    >
                                        <ChevronLeft />
                                    </Button>
                                    <span className="min-w-16 text-center text-sm text-muted-foreground tabular-nums">
                                        {current + 1} / {students.length}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon-sm"
                                        aria-label="Next ID"
                                        onClick={() => api?.scrollNext()}
                                        disabled={!api?.canScrollNext()}
                                    >
                                        <ChevronRight />
                                    </Button>
                                </div>

                                {currentStudent && (
                                    <div className="text-center">
                                        <p className="text-sm font-medium uppercase">
                                            {fullName(currentStudent)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {currentStudent.id_number}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {notLoadedCount > 0 && (
                            <p className="text-xs text-destructive">
                                {notLoadedCount} selected student
                                {notLoadedCount !== 1 ? 's' : ''} couldn't be
                                loaded and won't be printed.
                            </p>
                        )}
                        {error && students.length > 0 && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}

                        <div className="flex w-full flex-wrap items-center justify-between gap-2">
                            <Button
                                variant="destructive"
                                onClick={removeCurrent}
                                disabled={!currentStudent}
                            >
                                <Trash2 className="h-4 w-4" />
                                Remove
                            </Button>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsFlipped((f) => !f)}
                                    disabled={students.length === 0}
                                    className="min-w-[120px]"
                                >
                                    <IdCard
                                        className={`transition-all duration-500 ${isFlipped ? 'scale-x-100' : '-scale-x-100'}`}
                                    />
                                    {isFlipped ? 'Show Front' : 'Show Back'}
                                </Button>
                                <Button
                                    onClick={() => setPrintDialogOpen(true)}
                                    disabled={
                                        students.length === 0 || isLoading
                                    }
                                    className="min-w-[140px]"
                                >
                                    <Printer className="h-4 w-4" />
                                    Print {students.length} ID
                                    {students.length !== 1 ? 's' : ''}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirm. Confirming closes this and the preview dialog, then
                hands off to a sonner toast countdown — no tab is opened
                until the countdown actually finishes. */}
            <AlertDialog
                open={printDialogOpen}
                onOpenChange={setPrintDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Print {students.length} ID
                            {students.length !== 1 ? 's' : ''}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            After a {COUNTDOWN_SECONDS}-second countdown, this
                            will print the front and back of each ID (
                            {students.length * 2} pages in total). Make sure
                            popups are allowed for this site.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button onClick={confirmPrint}>
                            <Printer className="h-4 w-4" />
                            Print
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
