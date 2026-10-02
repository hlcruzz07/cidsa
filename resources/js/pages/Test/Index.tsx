import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';

export default function Index() {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, []);

    const startScanner = async () => {
        setError(null);
        setResult(null);

        try {
            const scanner = new Html5Qrcode('barcode-reader');

            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: {
                        width: 400,
                        height: 150,
                    },
                    formatsToSupport: [
                        Html5QrcodeSupportedFormats.CODE_128,
                        Html5QrcodeSupportedFormats.CODE_39,
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.EAN_8,
                        Html5QrcodeSupportedFormats.UPC_A,
                        Html5QrcodeSupportedFormats.UPC_E,
                    ],
                },
                (decodedText) => {
                    console.log('Barcode detected:', decodedText);

                    setResult(decodedText);

                    // Stop after successful scan
                    stopScanner();
                },
                () => {
                    // Ignore scan failures.
                    // This is called repeatedly while the scanner
                    // is looking for a barcode.
                },
            );

            setScanning(true);
        } catch (err) {
            console.error(err);

            setError(
                'Unable to access the camera. Please allow camera permission and try again.',
            );
        }
    };

    const stopScanner = async () => {
        const scanner = scannerRef.current;

        if (!scanner) {
            return;
        }

        try {
            if (scanner.isScanning) {
                await scanner.stop();
            }

            scanner.clear();
        } catch (err) {
            console.error('Failed to stop scanner:', err);
        } finally {
            scannerRef.current = null;
            setScanning(false);
        }
    };

    const scanAgain = () => {
        setResult(null);
        startScanner();
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="mx-auto max-w-2xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Library Entrance</h1>

                    <p className="text-muted-foreground">
                        Scan your student ID barcode using the camera.
                    </p>
                </div>

                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="p-4">
                        <div
                            id="barcode-reader"
                            className="w-full overflow-hidden rounded-lg"
                        />
                    </div>

                    {!scanning && !result && (
                        <div className="border-t p-4">
                            <button
                                type="button"
                                onClick={startScanner}
                                className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:opacity-90"
                            >
                                Open Camera
                            </button>
                        </div>
                    )}

                    {scanning && (
                        <div className="border-t p-4 text-center">
                            <p className="text-sm text-muted-foreground">
                                Point the camera at the barcode on your student
                                ID.
                            </p>

                            <button
                                type="button"
                                onClick={stopScanner}
                                className="mt-3 rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                            >
                                Stop Camera
                            </button>
                        </div>
                    )}

                    {result && (
                        <div className="border-t p-6">
                            <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-950">
                                <p className="text-sm text-muted-foreground">
                                    Barcode detected
                                </p>

                                <p className="mt-2 text-3xl font-bold tracking-wider">
                                    {result}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={scanAgain}
                                className="mt-4 w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:opacity-90"
                            >
                                Scan Again
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="border-t p-4">
                            <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                                {error}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
