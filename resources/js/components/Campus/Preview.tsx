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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { StudentProps } from '@/lib/custom-types';
import apiService from '@/services/apiService';
import { IdCard, Loader2, Printer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
const COUNTDOWN_SECONDS = 5;

interface IdPreviewDialogProps {
    id: number | null;
    open: boolean;
    setOpen: (open: boolean) => void;
}

// setTimeout-based on purpose: once the print tab is focused, this page can
// be backgrounded and browsers pause requestAnimationFrame for hidden tabs.
const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

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

export function IdPreviewDialog({ id, open, setOpen }: IdPreviewDialogProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cardData, setCardData] = useState<StudentProps | null>(null);

    const [printDialogOpen, setPrintDialogOpen] = useState(false);

    // True only while WE are closing the dialog to kick off a print
    // countdown — lets onOpenChange tell that apart from the user closing
    // it manually (X, Escape, outside click), which should cancel the print.
    const selfClosingRef = useRef(false);

    useEffect(() => {
        if (!open || !id) return;

        const fetchStudent = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const res = await apiService.get(route('get.student', id));
                setCardData(res.data);
            } catch (err: any) {
                setError(
                    err?.response?.data?.error ||
                        'Failed to load student ID card data.',
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudent();
    }, [id, open]);

    const countdown = usePrintCountdown({ seconds: COUNTDOWN_SECONDS });

    // Renders the ID off-screen, waits for fonts + AutoFitText to settle,
    // then writes the final print layout into `printWindow` and prints.
    const doPrint = async (printWindow: Window, data: StudentProps) => {
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${CARD_W}px;opacity:0;pointer-events:none;`;
        document.body.appendChild(tempContainer);
        const root = createRoot(tempContainer);

        try {
            // Commit synchronously so we don't depend on scheduler timing.
            flushSync(() => {
                root.render(
                    <>
                        <div style={{ width: CARD_W, height: CARD_H }}>
                            <IdCardFront data={data} />
                        </div>
                        <div style={{ width: CARD_W, height: CARD_H }}>
                            <IdCardBack data={data} />
                        </div>
                    </>,
                );
            });

            await Promise.race([
                Promise.resolve(document.fonts?.ready).catch(() => {}),
                sleep(2000),
            ]);
            await sleep(800);

            const cards =
                tempContainer.querySelectorAll<HTMLElement>(
                    '[data-slot="card"]',
                );
            const frontHtml = cards[0]?.outerHTML ?? '';
            const backHtml = cards[1]?.outerHTML ?? '';

            const stylesHtml = collectStylesHtml();
            const scaledW = Math.round(CARD_W * SCALE);
            const scaledH = Math.round(CARD_H * SCALE);

            printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <base href="${window.location.origin}">
    <title>ID Print Preview - ${data.first_name ?? ''}</title>
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
    <div class="print-page">${frontHtml}</div>
    <div class="print-page">${backHtml}</div>
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
        setTimeout(doPrint, 15000);
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
        if (!cardData) return;
        const data = cardData;

        // Close both the confirm alert and the preview dialog before the
        // countdown starts, as requested — nothing stays open while waiting.
        setPrintDialogOpen(false);
        selfClosingRef.current = true;
        setOpen(false);

        countdown.start(
            (secondsLeft) => `Printing ID in ${secondsLeft}s…`,
            async () => {
                // Only opened now, once the countdown actually finishes — this
                // is not a direct result of the click anymore, so most browsers'
                // popup blockers will block it unless popups are allowed for
                // this site.
                const printWindow = window.open('', '_blank');
                if (!printWindow) {
                    toast.error(
                        'Popup blocked. Please allow popups for this site, then try printing again.',
                    );
                    return;
                }
                await doPrint(printWindow, data);
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
                            // We closed this ourselves to start the print
                            // countdown — don't cancel the pending print.
                            selfClosingRef.current = false;
                        } else {
                            // Closed manually — cancel any pending print.
                            countdown.cancel();
                        }
                        setCardData(null);
                        setIsFlipped(false);
                        setPrintDialogOpen(false);
                    }
                    setOpen(value);
                }}
            >
                <DialogContent className="id-preview-dialog-content w-full min-w-fit">
                    <DialogHeader className="no-print">
                        <DialogTitle className="flex items-center gap-2">
                            <IdCard className="h-5 w-5" />
                            ID Preview — {cardData?.first_name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col items-center gap-6">
                        <div
                            className="flex w-full items-center justify-center"
                            style={{ minHeight: 282 }}
                        >
                            {isLoading ? (
                                <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <p className="text-sm">
                                        Loading ID card data…
                                    </p>
                                </div>
                            ) : error && !cardData ? (
                                <div className="flex flex-col items-center gap-2 py-12 text-sm text-destructive">
                                    <p className="font-semibold">
                                        Failed to load
                                    </p>
                                    <p className="text-muted-foreground">
                                        {error}
                                    </p>
                                </div>
                            ) : cardData ? (
                                <div
                                    className="no-print"
                                    style={{
                                        width: CARD_W,
                                        height: CARD_H,
                                        flexShrink: 0,
                                    }}
                                >
                                    <div
                                        className="h-[282px] w-[448px]"
                                        style={{ perspective: '1000px' }}
                                    >
                                        <StudentIdCard
                                            data={cardData}
                                            isFlipped={isFlipped}
                                        />
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {error && cardData && (
                            <p className="no-print text-sm text-destructive">
                                {error}
                            </p>
                        )}

                        {!isLoading && cardData && (
                            <div className="no-print flex flex-wrap justify-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsFlipped((f) => !f)}
                                    className="min-w-[120px]"
                                >
                                    <IdCard
                                        className={`transition-all duration-500 ${isFlipped ? 'scale-x-100' : '-scale-x-100'}`}
                                    />
                                    {isFlipped ? 'Show Front' : 'Show Back'}
                                </Button>

                                <Button
                                    onClick={() => setPrintDialogOpen(true)}
                                    className="min-w-[120px]"
                                >
                                    <Printer className="h-4 w-4" />
                                    Print ID
                                </Button>
                            </div>
                        )}
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
                        <AlertDialogTitle>Print this ID?</AlertDialogTitle>
                        <AlertDialogDescription>
                            After a {COUNTDOWN_SECONDS}-second countdown, this
                            will print the front and back of the ID (2 pages)
                            for{' '}
                            <span className="font-medium text-foreground">
                                {[
                                    cardData?.first_name,
                                    cardData?.middle_init,
                                    cardData?.last_name,
                                    cardData?.suffix,
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                            </span>
                            . Make sure popups are allowed for this site.
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
