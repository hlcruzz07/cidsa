import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { removeBackground } from '@imgly/background-removal';
import * as faceapi from 'face-api.js';
import * as imageConversion from 'image-conversion';
import {
    ArrowBigLeft,
    ArrowBigRight,
    AsteriskIcon,
    Ban,
    Camera,
    ImageIcon,
    ImageUpIcon,
    InfoIcon,
    Shirt,
    Smile,
    Square,
} from 'lucide-react';
import { ChangeEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';
import SignatureModal from './SignatureModal';

interface StepTwoProps {
    data: {
        picture: File | null;
        e_signature: File | null;
        id_number: string;
    };
    setData: (key: string, value: any) => void;
    processing: boolean;
    errors: Record<string, string>;
    onBackStep: () => void;
}

export default function StepTwo({
    data,
    setData,
    processing,
    errors,
    onBackStep,
}: StepTwoProps) {
    const previewUrl = useMemo(() => {
        if (!data.picture) return '/placeholder.jpg';
        return URL.createObjectURL(data.picture);
    }, [data.picture]);
    const [isBgRemoving, setIsBgRemoving] = useState<boolean>(false);

    const applyWhiteBackground = (blob: Blob): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext('2d');
                if (!ctx) return reject('Canvas context error');

                // Fill white background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw transparent image on top
                ctx.drawImage(img, 0, 0);

                // Export as JPEG with white background
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

    const resizeWithFaceCentering = async (
        blob: Blob,
        targetWidth: number,
        targetHeight: number,
    ): Promise<Blob> => {
        // Load face-api models (only once)
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');

        return new Promise(async (resolve, reject) => {
            const img = new Image();
            img.onload = async () => {
                // Detect the face
                const detection = await faceapi.detectSingleFace(
                    img,
                    new faceapi.TinyFaceDetectorOptions(),
                );

                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;

                const ctx = canvas.getContext('2d');
                if (!ctx) return reject('Canvas error');

                // White background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, targetWidth, targetHeight);

                let srcX = 0;
                let srcY = 0;
                let srcW = img.width;
                let srcH = img.height;

                if (detection) {
                    const box = detection.box;

                    // Desired framing — expand crop around face
                    const centerX = box.x + box.width / 2;
                    const centerY = box.y + box.height / 2;

                    const cropSize = Math.max(box.width, box.height) * 2.2;

                    srcX = centerX - cropSize / 2;
                    srcY = centerY - cropSize / 2;
                    srcW = cropSize;
                    srcH = cropSize;

                    if (srcX < 0) srcX = 0;
                    if (srcY < 0) srcY = 0;
                    if (srcX + srcW > img.width) srcW = img.width - srcX;
                    if (srcY + srcH > img.height) srcH = img.height - srcY;
                }

                const ratio = Math.max(targetWidth / srcW, targetHeight / srcH);

                const newWidth = srcW * ratio;
                const newHeight = srcH * ratio;

                // Center horizontally and vertically (crop may overflow to remove bottom space)
                const offsetX = (targetWidth - newWidth) / 2;
                const offsetY = (targetHeight - newHeight) / 2;

                ctx.drawImage(
                    img,
                    srcX,
                    srcY,
                    srcW,
                    srcH,
                    offsetX,
                    offsetY,
                    newWidth,
                    newHeight,
                );

                canvas.toBlob(
                    (blobOut) => {
                        if (!blobOut) reject('Resize failed');
                        else resolve(blobOut);
                    },
                    'image/jpeg',
                    0.95,
                );
            };

            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
        });
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsBgRemoving(true);

        try {
            // 1. Remove background → transparent PNG
            const removedBlob: Blob = await removeBackground(file);

            // 2. Convert transparent → white background
            const whiteBgBlob: Blob = await applyWhiteBackground(removedBlob);

            // 3. Resize + auto-center on face
            const centeredBlob: Blob = await resizeWithFaceCentering(
                whiteBgBlob,
                320,
                378,
            );

            // 4. Compress final image
            const finalBlob: Blob = await (imageConversion.compress as any)(
                centeredBlob,
                {
                    type: 'image/jpg',
                    quality: centeredBlob.size > 2 * 1024 * 1024 ? 0.7 : 0.95,
                },
            );

            const filename = `20250431.jpg`;

            setData(
                'picture',
                new File([finalBlob], filename, { type: 'image/jpg' }),
            );
        } catch (err) {
            console.error('Background removal failed', err);
            toast.error('Failed to process image. Please try again.');
        } finally {
            setIsBgRemoving(false);
        }
    };

    const handleSaveSignature = (file: File) => {
        setData('e_signature', file);
    };

    return (
        <>
            {isBgRemoving && (
                <div className="fixed top-0 left-0 z-20 flex h-full w-full items-center justify-center overflow-hidden bg-black/70">
                    <div className="relative flex h-80 w-80 items-center justify-center">
                        <div className="absolute inset-0 animate-spin rounded-full border border-t-[6px] border-transparent border-t-[var(--main-color)]"></div>

                        <div className="z-10 flex flex-col items-center gap-5">
                            <img
                                src="/logo.webp"
                                className="h-18 w-18 md:h-20 md:w-20"
                                alt="CHMSU Logo"
                                loading="lazy"
                            />
                            <h1 className="text-white">
                                Uploading Picture ...
                            </h1>
                        </div>
                    </div>
                </div>
            )}

            <Heading
                title="Photo & E-Signature Upload"
                description="Upload your 1×1 ID photo and provide your electronic signature to proceed with your application."
            />
            <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border bg-gray-50 p-6">
                    <h1 className="flex items-center gap-3 text-2xl font-bold text-[var(--main-color)]">
                        Picture Guidelines
                        <InfoIcon />
                    </h1>

                    <div className="mt-3 space-y-4">
                        {/* 1 */}
                        <div className="flex items-start gap-4 rounded-xl border bg-white p-4 shadow-sm">
                            <div className="flex gap-3">
                                <Camera className="mt-1 h-6 w-6 flex-shrink-0 text-[var(--main-color)]" />
                                <p className="m-0 p-0">
                                    The photo must show a frontal pose looking
                                    directly at the camera, with your full face,
                                    both ears, and shoulders clearly visible.
                                </p>
                            </div>
                        </div>

                        {/* 2 */}
                        <div className="flex items-start gap-4 rounded-xl border bg-white p-4 shadow-sm">
                            <div className="flex gap-3">
                                <Smile className="mt-1 h-6 w-6 flex-shrink-0 text-[var(--main-color)]" />
                                <p className="m-0 p-0">
                                    Maintain a neutral expression with both eyes
                                    open and mouth closed.
                                </p>
                            </div>
                        </div>

                        {/* 3 */}
                        <div className="flex items-start gap-4 rounded-xl border bg-white p-4 shadow-sm">
                            <div className="flex gap-3">
                                <Ban className="mt-1 h-6 w-6 flex-shrink-0 text-[var(--main-color)]" />
                                <p className="m-0 p-0">
                                    Remove accessories such as caps, headbands,
                                    sunglasses, or face masks before taking the
                                    photo.
                                </p>
                            </div>
                        </div>

                        {/* 4 */}
                        <div className="flex items-start gap-4 rounded-xl border bg-white p-4 shadow-sm">
                            <div className="flex gap-3">
                                <Square className="mt-1 h-6 w-6 flex-shrink-0 text-[var(--main-color)]" />
                                <p className="m-0 p-0">
                                    The photo must be taken in front of a plain
                                    white or off-white background.
                                </p>
                            </div>
                        </div>

                        {/* 5 */}
                        <div className="flex items-start gap-4 rounded-xl border bg-white p-4 shadow-sm">
                            <div className="flex gap-3">
                                <Shirt className="mt-1 h-6 w-6 flex-shrink-0 text-[var(--main-color)]" />
                                <p className="m-0 p-0">
                                    Wear appropriate attire and ensure proper
                                    grooming.
                                </p>
                            </div>
                        </div>

                        {/* 6 */}
                        <div className="flex items-start gap-4 rounded-xl border bg-white p-4 shadow-sm">
                            <div className="flex gap-3">
                                <ImageIcon className="mt-1 h-6 w-6 flex-shrink-0 text-[var(--main-color)]" />
                                <p className="m-0 p-0">
                                    File Requirements: The image must be in
                                    JPEG/JPG format and cropped to a 1×1 photo
                                    dimension.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="grid gap-3">
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="h-auto w-full border object-contain"
                    />
                    <Input
                        type="file"
                        name="picture"
                        id="picture"
                        accept=".jpg"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    <Button type="button" className="p-0">
                        <Label
                            htmlFor="picture"
                            className="m-0 flex h-full w-full items-center justify-center"
                        >
                            Upload ID Picture
                            <ImageUpIcon />
                        </Label>
                    </Button>

                    <InputError message={errors.picture} />
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between">
                    <Label>
                        E - Signature <AsteriskIcon size={12} color="red" />
                    </Label>
                    <SignatureModal
                        idNumber={data.id_number}
                        onSave={handleSaveSignature}
                    />
                </div>

                <div className="mt-3 flex h-56 items-center justify-center border">
                    {data.e_signature ? (
                        <>
                            <img
                                src={URL.createObjectURL(data.e_signature)}
                                alt="Signature Preview"
                                className="max-h-full w-auto"
                            />
                        </>
                    ) : (
                        <h1 className="text-xl font-semibold tracking-widest text-gray-400 italic">
                            Signature Preview
                        </h1>
                    )}
                </div>

                <InputError message={errors.e_signature} />
            </div>

            <div className="mb-10 flex justify-end">
                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        disabled={processing}
                        className="ml-auto text-center"
                        onClick={onBackStep}
                        variant="outline"
                    >
                        <ArrowBigLeft />
                        Back
                    </Button>
                    <Button
                        type="submit"
                        disabled={processing}
                        className="ml-auto text-center"
                    >
                        {processing ? (
                            <>
                                <Spinner />
                                Loading...
                            </>
                        ) : (
                            <>
                                Next
                                <ArrowBigRight />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </>
    );
}
