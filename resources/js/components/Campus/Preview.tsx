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
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import { StudentIdCard } from './StudentIdCard';

const DEBUG_PREVIEW_IN_NEW_TAB = false;

interface IdPreviewDialogProps {
    id: number | null;
    open: boolean;
    setOpen: (open: boolean) => void;
}

export function IdPreviewDialog({ id, open, setOpen }: IdPreviewDialogProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cardData, setCardData] = useState<StudentProps | null>(null);
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

    const handlePrint = async () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const dialogContent = document.querySelector(
                '.id-preview-dialog-content',
            );
            if (dialogContent) {
                const cards = dialogContent.querySelectorAll(
                    'div[data-slot="card"]',
                );
                if (cards.length >= 2) {
                    const frontHtml = cards[0].outerHTML;
                    const backHtml = cards[1].outerHTML;

                    let stylesHtml = '';

                    // Copy all link elements (stylesheets, fonts, next/font imports)
                    document.head.querySelectorAll('link').forEach((link) => {
                        stylesHtml += link.outerHTML;
                    });

                    // Copy stylesheets
                    for (let i = 0; i < document.styleSheets.length; i++) {
                        try {
                            const stylesheet = document.styleSheets[i];
                            if (stylesheet.href) {
                                stylesHtml += `<link rel="stylesheet" href="${stylesheet.href}">`;
                            } else {
                                const rules = Array.from(stylesheet.cssRules)
                                    .map((rule) => rule.cssText)
                                    .join('\n');
                                stylesHtml += `<style>${rules}</style>`;
                            }
                        } catch (e) {}
                    }

                    // Copy inline styles
                    document.querySelectorAll('style').forEach((style) => {
                        stylesHtml += style.outerHTML;
                    });

                    const CARD_W = 448;
                    const CARD_H = 282;
                    const SCALE = 0.72;
                    const scaledW = Math.round(CARD_W * SCALE);
                    const scaledH = Math.round(CARD_H * SCALE);

                    printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <base href="${window.location.origin}">
                <title>ID Print Preview - ${cardData?.first_name}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
                ${stylesHtml}
                <style>
                  body {
                    margin: 0;
                    font-family: 'Inter', sans-serif !important;
                  }
                  .print-page {
                    width: ${scaledW}px;
                    height: ${scaledH}px;
                    overflow: hidden;
                    page-break-after: always;
                    break-after: page;
                    position: relative;
                  }
                  .print-page > div[data-slot="card"] {
                    width: ${CARD_W}px !important;
                    height: ${CARD_H}px !important;
                    max-width: ${CARD_W}px !important;
                    min-width: ${CARD_W}px !important;
                    border-radius: 0 !important;
                    transform: scale(${SCALE}) !important;
                    transform-origin: top left !important;
                    font-family: 'Inter', sans-serif !important;
                    box-shadow: none !important;
                    border: none !important;
                    position: relative !important;
                    left: 0 !important;
                    top: 0 !important;
                  }
                </style>
              </head>
              <body>
                <div class="print-page">
                  ${frontHtml}
                </div>
                <div class="print-page print-page-break">
                  ${backHtml}
                </div>
                <script>
                  window.onload = function() {
                    if (!${DEBUG_PREVIEW_IN_NEW_TAB}) {
                      window.print();
                      setTimeout(function() {
                        window.close();
                      }, 500);
                    }
                  };
                </script>
              </body>
            </html>
          `);
                    printWindow.document.close();
                }
            }
        }
    };

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(value) => {
                    if (!value) {
                        setCardData(null);
                        setIsFlipped(false);
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
                            ) : error ? (
                                <div className="flex flex-col items-center gap-2 py-12 text-sm text-destructive">
                                    <p className="font-semibold">
                                        Failed to load
                                    </p>
                                    <p className="text-muted-foreground">
                                        {error}
                                    </p>
                                </div>
                            ) : cardData ? (
                                <>
                                    <div
                                        className="no-print"
                                        style={{
                                            width: 448,
                                            height: 282,
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
                                </>
                            ) : null}
                        </div>

                        {/* Controls */}
                        {!isLoading && !error && cardData && (
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
                                    onClick={handlePrint}
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
        </>
    );
}
