import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { QRCodeCanvas } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';

export default function Index() {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const qrRef = useRef<HTMLDivElement | null>(null);

    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [idNumber, setIdNumber] = useState('2026-123456');

    /**
     * Start QR scanner
     */
    const startScanner = async () => {
        try {
            setError(null);
            setResult(null);

            // Prevent multiple scanner instances
            if (scannerRef.current) {
                return;
            }

            const scanner = new Html5Qrcode('barcode-reader');

            scannerRef.current = scanner;

            await scanner.start(
                {
                    facingMode: 'environment',
                },
                {
                    fps: 10,
                    qrbox: {
                        width: 300,
                        height: 300,
                    },
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                },
                async (decodedText) => {
                    setResult(decodedText);
                    setScanning(false);

                    await stopScanner();
                },
                () => {
                    // Ignore normal scanning failures.
                    // html5-qrcode calls this repeatedly when
                    // there is no QR code in the camera frame.
                },
            );

            setScanning(true);
        } catch (err) {
            console.error('Unable to start scanner:', err);

            setScanning(false);
            scannerRef.current = null;

            setError(
                'Unable to access the camera. Please allow camera permission and try again.',
            );
        }
    };

    /**
     * Stop QR scanner
     */
    const stopScanner = async () => {
        const scanner = scannerRef.current;

        if (!scanner) {
            setScanning(false);
            return;
        }

        try {
            await scanner.stop();
        } catch (err) {
            console.error('Error stopping scanner:', err);
        }

        try {
            scanner.clear();
        } catch (err) {
            console.error('Error clearing scanner:', err);
        }

        scannerRef.current = null;
        setScanning(false);
    };

    /**
     * Scan another QR code
     */
    const scanAgain = async () => {
        setResult(null);
        setError(null);

        await stopScanner();

        // Give the DOM a moment to reset before starting
        setTimeout(() => {
            startScanner();
        }, 100);
    };

    /**
     * Download generated QR code as PNG
     */
    const downloadQrCode = () => {
        if (!idNumber.trim()) {
            return;
        }

        const canvas = qrRef.current?.querySelector(
            'canvas',
        ) as HTMLCanvasElement | null;

        if (!canvas) {
            return;
        }

        const link = document.createElement('a');

        link.download = `library-qr-${idNumber.trim()}.png`;
        link.href = canvas.toDataURL('image/png');

        link.click();
    };

    /**
     * Cleanup scanner when component unmounts
     */
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current
                    .stop()
                    .catch(() => {})
                    .finally(() => {
                        try {
                            scannerRef.current?.clear();
                        } catch {
                            // Ignore cleanup errors
                        }

                        scannerRef.current = null;
                    });
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-6xl px-6 py-10">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Library QR Attendance
                    </h1>

                    <p className="mt-2 text-muted-foreground">
                        Generate a student QR code or scan a QR code to record
                        library attendance.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* ================================================== */}
                    {/* QR GENERATOR */}
                    {/* ================================================== */}
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold">
                                Student QR Code
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Enter the student ID number to generate a QR
                                code.
                            </p>
                        </div>

                        {/* ID Number */}
                        <div className="mb-6">
                            <label
                                htmlFor="id-number"
                                className="mb-2 block text-sm font-medium"
                            >
                                Student ID Number
                            </label>

                            <input
                                id="id-number"
                                type="text"
                                value={idNumber}
                                onChange={(event) =>
                                    setIdNumber(event.target.value)
                                }
                                placeholder="e.g. 2026-123456"
                                className="w-full rounded-lg border bg-background px-4 py-3 transition outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        {/* QR Code */}
                        <div
                            ref={qrRef}
                            className="flex min-h-[300px] items-center justify-center rounded-xl border bg-white p-6"
                        >
                            {idNumber.trim() ? (
                                <QRCodeCanvas
                                    value={idNumber.trim()}
                                    size={260}
                                    level="H"
                                    includeMargin
                                />
                            ) : (
                                <div className="flex h-[260px] w-[260px] items-center justify-center text-center text-sm text-muted-foreground">
                                    Enter a student ID number
                                    <br />
                                    to generate the QR code.
                                </div>
                            )}
                        </div>

                        {/* Download */}
                        {idNumber.trim() && (
                            <button
                                type="button"
                                onClick={downloadQrCode}
                                className="mt-4 w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90"
                            >
                                Download QR Code
                            </button>
                        )}

                        <p className="mt-3 text-center text-xs text-muted-foreground">
                            Save the QR code to your phone for faster library
                            entry and exit.
                        </p>
                    </div>

                    {/* ================================================== */}
                    {/* QR SCANNER */}
                    {/* ================================================== */}
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold">
                                Scan QR Code
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Use the computer camera to scan a student's QR
                                code.
                            </p>
                        </div>

                        {/* Scanner */}
                        <div
                            id="barcode-reader"
                            className="min-h-[360px] overflow-hidden rounded-xl border bg-black"
                        />

                        {/* Controls */}
                        <div className="mt-4 flex gap-3">
                            {!scanning && !result && (
                                <button
                                    type="button"
                                    onClick={startScanner}
                                    className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90"
                                >
                                    Open Camera
                                </button>
                            )}

                            {scanning && (
                                <button
                                    type="button"
                                    onClick={stopScanner}
                                    className="w-full rounded-lg border bg-background px-4 py-3 font-medium transition hover:bg-muted"
                                >
                                    Stop Camera
                                </button>
                            )}

                            {result && (
                                <button
                                    type="button"
                                    onClick={scanAgain}
                                    className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90"
                                >
                                    Scan Again
                                </button>
                            )}
                        </div>

                        {/* Scanning status */}
                        {scanning && (
                            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
                                <p className="text-sm font-medium">
                                    Scanning...
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                    Point the camera at the student's QR code.
                                </p>
                            </div>
                        )}

                        {/* Result */}
                        {result && (
                            <div className="mt-4 rounded-lg border bg-muted/30 p-4">
                                <p className="text-sm font-medium">
                                    QR Code Detected
                                </p>

                                <div className="mt-2 rounded-md bg-background p-3">
                                    <p className="font-mono text-sm break-all">
                                        {result}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                                <p className="text-sm font-medium text-destructive">
                                    Camera Error
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    {error}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Information */}
                <div className="mt-6 rounded-xl border bg-muted/30 p-5">
                    <h3 className="font-semibold">How it works</h3>

                    <div className="mt-3 grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                        <div>
                            <span className="font-medium text-foreground">
                                1. Generate
                            </span>
                            <p className="mt-1">
                                Enter the student's ID number and generate their
                                QR code.
                            </p>
                        </div>

                        <div>
                            <span className="font-medium text-foreground">
                                2. Save
                            </span>
                            <p className="mt-1">
                                Download the QR code as a PNG image and save it
                                on the student's phone.
                            </p>
                        </div>

                        <div>
                            <span className="font-medium text-foreground">
                                3. Scan
                            </span>
                            <p className="mt-1">
                                Scan the QR code at the library entrance to
                                record attendance.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
