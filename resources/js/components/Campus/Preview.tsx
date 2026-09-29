import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { PRINT_TYPE_LABEL, PrintType, StudentProps } from '@/lib/custom-types';
import apiService from '@/services/apiService';
import { IdCard, Printer } from 'lucide-react';
import { useRef, useState } from 'react';
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
    student: StudentProps | null;
    /** Whether this is a new student ID or a replacement. */
    printType: PrintType;
    open: boolean;
    setOpen: (open: boolean) => void;
    /** Called after the print has been recorded on the server. */
    onPrinted?: () => void;
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

export function IdPreviewDialog({
    student,
    printType,
    open,
    setOpen,
    onPrinted,
}: IdPreviewDialogProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    const [printDialogOpen, setPrintDialogOpen] = useState(false);

    // True only while WE are closing the dialog to kick off a print
    // countdown — lets onOpenChange tell that apart from the user closing
    // it manually (X, Escape, outside click), which should cancel the print.
    const selfClosingRef = useRef(false);

    const countdown = usePrintCountdown({ seconds: COUNTDOWN_SECONDS });

    // Records the print on the server, renders the ID off-screen, waits for
    // fonts + AutoFitText to settle, then writes the final print layout into
    // `printWindow` and prints.
    const doPrint = async (printWindow: Window, data: StudentProps) => {
        // Record the print first. The activity log rows are the stock
        // deduction, so if this fails we don't print at all.
        try {
            await apiService.post(route('student.print'), {
                id: data.id,
                type: printType,
            });
        } catch (e) {
            console.error('Error recording print:', e);
            printWindow.close();
            toast.error('Failed to record the print. The ID was not printed.');
            return;
        }

        // Let the parent refresh its lists (Printed status, counts, etc.).
        onPrinted?.();

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
        if (!student) return;
        // Capture now: the parent may clear `student` after the dialog closes,
        // but the countdown callback still needs it.
        const data = student;

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
                            ID Preview — {student?.first_name}
                            <Badge variant="secondary">
                                {PRINT_TYPE_LABEL[printType]}
                            </Badge>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col items-center gap-6">
                        <div
                            className="flex w-full items-center justify-center"
                            style={{ minHeight: 282 }}
                        >
                            {student ? (
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
                                            data={student}
                                            isFlipped={isFlipped}
                                        />
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {student && (
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
                        <AlertDialogTitle>
                            Print this{' '}
                            {PRINT_TYPE_LABEL[printType].toLowerCase()} ID?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            After a {COUNTDOWN_SECONDS}-second countdown, this
                            will print the front and back of the ID (2 pages)
                            for{' '}
                            <span className="font-medium text-foreground">
                                {[
                                    student?.first_name,
                                    student?.middle_init,
                                    student?.last_name,
                                    student?.suffix,
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
