import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ClipboardPenIcon, EraserIcon, SaveIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { toast } from 'sonner';

interface SignatureModalProps {
    onSave: (file: File) => void;
    idNumber: string | null;
}

export default function SignatureModal({
    onSave,
    idNumber,
}: SignatureModalProps) {
    const [open, setOpen] = useState(false);
    const sigCanvas = useRef<SignatureCanvas>(null);

    const clear = () => sigCanvas.current?.clear();

    const applyWhiteBackground = (blob: Blob): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext('2d');
                if (!ctx) return reject('Canvas context error');

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);

                canvas.toBlob(
                    (jpgBlob) => {
                        if (!jpgBlob) reject('Failed to convert to JPEG');
                        else resolve(jpgBlob);
                    },
                    'image/jpeg',
                    0.95,
                );
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
        });
    };

    const resizeSignature = (
        blob: Blob,
        width: number,
        height: number,
    ): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) return reject('Canvas error');

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);

                const ratio = Math.min(width / img.width, height / img.height);
                const newWidth = img.width * ratio;
                const newHeight = img.height * ratio;
                const offsetX = (width - newWidth) / 2;
                const offsetY = (height - newHeight) / 2;

                ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);

                canvas.toBlob(
                    (outBlob) => {
                        if (!outBlob) reject('Resize failed');
                        else resolve(outBlob);
                    },
                    'image/jpeg',
                    0.95,
                );
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
        });
    };

    const save = async () => {
        if (!sigCanvas.current) return;
        if (!idNumber) {
            toast.error('No Student ID Number found');
            return;
        }

        const dataURL = sigCanvas.current.toDataURL('image/png');
        const res = await fetch(dataURL);
        const blob = await res.blob();

        const blobWhite = await applyWhiteBackground(blob);
        const resizedBlob = await resizeSignature(blobWhite, 370, 120);

        const filename = `${idNumber}.bmp`;
        const file = new File([resizedBlob], filename, { type: 'image/bmp' });

        // Send file to parent
        onSave(file);

        // Optionally download
        // const url = URL.createObjectURL(resizedBlob);
        // const a = document.createElement('a');
        // a.href = url;
        // a.download = filename;
        // a.click();
        // URL.revokeObjectURL(url);

        // ✅ Close modal
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="default">
                    Create
                    <ClipboardPenIcon />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add E-Signature</DialogTitle>
                    <DialogDescription>
                        Please draw your signature in the box below, making sure
                        it stays centered within the drawing area.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                    <div className="flex justify-center overflow-hidden border">
                        <SignatureCanvas
                            ref={sigCanvas}
                            penColor="black"
                            minWidth={2}
                            maxWidth={4}
                            canvasProps={{
                                className: 'sigCanvas',
                                width: 370,
                                height: 120,
                            }}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" onClick={clear} variant="outline">
                        Clear <EraserIcon />
                    </Button>
                    <Button type="button" onClick={save}>
                        Save <SaveIcon />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
