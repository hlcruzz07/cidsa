import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
    applyWhiteBackground,
    resizeWithFaceCentering,
} from '@/lib/image-remover';
import { cleanMask } from '@/lib/mask-utils';
import * as hf from '@huggingface/transformers';
import { usePage } from '@inertiajs/react';
import * as imageConversion from 'image-conversion';
import {
    AlertTriangle,
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
import { ChangeEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import SignatureModal from '../Modal/SignatureModal';
interface StepTwoProps {
    data: {
        picture: File | null;
        e_signature: File | null;
    };
    setData: (key: string, value: any) => void;
    errors: Record<string, string>;
}
type PageProps = {
    student: StudentProps;
};
type StudentProps = {
    id_number: string;
    first_name: string;
    middle_init: string | null;
    last_name: string;
};

export default function StepTwo({ data, setData, errors }: StepTwoProps) {
    const { student } = usePage<PageProps>().props;
    const [previewUrl, setPreviewUrl] = useState('/placeholder.jpg');
    const [isBgRemoving, setIsBgRemoving] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);

    useEffect(() => {
        if (!data.picture) {
            setPreviewUrl('/placeholder.jpg');
            return;
        }

        const url = URL.createObjectURL(data.picture);
        setPreviewUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [data.picture]);

    useEffect(() => {
        if (isBgRemoving) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }

        return () => document.body.classList.remove('overflow-hidden');
    }, [isBgRemoving]);

    // --- CONFIGURATION FOR LOCAL-ONLY EXECUTION ---
    hf.env.allowRemoteModels = false;
    hf.env.allowLocalModels = true;
    hf.env.localModelPath = `${window.location.origin}/models/`;

    // (Keep your React component wrapper shell layout here)

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsBgRemoving(true);
        setProgress(0);

        await new Promise((resolve) => setTimeout(resolve, 0));

        let imageSrc = '';

        try {
            hf.env.allowRemoteModels = false;
            hf.env.allowLocalModels = true;
            hf.env.localModelPath = `${window.location.origin}/models/`;

            setProgress(10);

            const modelId = 'briaai/RMBG-1.4';

            const model = await hf.AutoModel.from_pretrained(modelId);

            setProgress(30);

            const processor = await hf.AutoProcessor.from_pretrained(modelId);

            setProgress(45);

            imageSrc = URL.createObjectURL(file);

            const image = await hf.RawImage.fromURL(imageSrc);

            const inputs = await processor(image);

            setProgress(60);

            const outputs = await model({
                input: inputs.pixel_values,
            });

            const outputTensor =
                (outputs as any).output ??
                (outputs as any).logits ??
                (outputs as any).pred_masks ??
                Object.values(outputs)[0];

            if (!outputTensor) {
                throw new Error('No output tensor found');
            }

            const dims = outputTensor.dims;

            if (!dims || dims.length !== 4) {
                throw new Error(
                    `Unexpected tensor shape: ${JSON.stringify(dims)}`,
                );
            }

            const [, , height, width] = dims;

            const tensorData = Array.from(outputTensor.data as Float32Array);

            let min = Infinity;
            let max = -Infinity;

            for (const value of tensorData) {
                if (value < min) min = value;
                if (value > max) max = value;
            }

            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = width;
            maskCanvas.height = height;

            const maskCtx = maskCanvas.getContext('2d');

            if (!maskCtx) {
                throw new Error('Failed to create mask canvas');
            }

            const rawMaskData = maskCtx.createImageData(width, height);

            for (let i = 0; i < tensorData.length; i++) {
                const normalized = ((tensorData[i] - min) / (max - min)) * 255;
                const alpha = Math.max(
                    0,
                    Math.min(255, Math.round(normalized)),
                );
                rawMaskData.data[i * 4] = 255;
                rawMaskData.data[i * 4 + 1] = 255;
                rawMaskData.data[i * 4 + 2] = 255;
                rawMaskData.data[i * 4 + 3] = alpha;
            }

            // ✅ Clean the mask: threshold speckles, erode fringe, feather edges
            const cleanedMask = cleanMask(rawMaskData, width, height, {
                threshold: 100,
                closeRadius: 4, // ← new param, fills interior dots
                erodeRadius: 1,
                blurRadius: 2,
            });
            maskCtx.putImageData(cleanedMask, 0, 0);

            setProgress(70);

            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;

            const ctx = canvas.getContext('2d');

            if (!ctx) {
                throw new Error('Failed to create output canvas');
            }

            ctx.drawImage(image.toCanvas(), 0, 0);

            ctx.globalCompositeOperation = 'destination-in';

            ctx.drawImage(
                maskCanvas,
                0,
                0,
                width,
                height,
                0,
                0,
                image.width,
                image.height,
            );

            setProgress(80);

            const removedBlob: Blob = await new Promise((resolve, reject) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to export transparent image'));
                    }
                }, 'image/png');
            });

            setProgress(85);

            const whiteBgBlob = await applyWhiteBackground(removedBlob);

            setProgress(90);

            const centeredBlob = await resizeWithFaceCentering(
                whiteBgBlob,
                320,
                378,
            );

            setProgress(95);

            const finalBlob: Blob = await (imageConversion.compress as any)(
                centeredBlob,
                {
                    type: 'image/jpeg',
                    quality: centeredBlob.size > 2 * 1024 * 1024 ? 0.7 : 0.95,
                },
            );

            const filename = `${student.id_number}.jpg`;

            setData(
                'picture',
                new File([finalBlob], filename, {
                    type: 'image/jpeg',
                }),
            );

            setProgress(100);

            toast.success('Image processed successfully');
        } catch (err) {
            console.error('Background removal failed:', err);

            toast.error('Failed to process image. Please try again.');

            setData('picture', null);
        } finally {
            if (imageSrc) {
                URL.revokeObjectURL(imageSrc);
            }

            setIsBgRemoving(false);
            setProgress(0);
        }
    };
    const handleSaveSignature = (file: File) => {
        setData('e_signature', file);
    };

    return (
        <>
            {isBgRemoving && (
                <div className="fixed inset-0 z-100 flex h-screen w-screen items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="relative flex flex-col items-center rounded-3xl border border-white/10 bg-white/5 px-10 py-8 shadow-2xl backdrop-blur-md">
                        <div className="relative flex h-32 w-32 items-center justify-center">
                            {/* Animated Ring */}
                            <div className="absolute inset-0">
                                <div className="h-full w-full animate-spin rounded-full border-4 border-white/20 border-t-green-500" />
                            </div>

                            {/* Logo */}
                            <img
                                src="/logo.webp"
                                alt="CHMSU Logo"
                                className="animate-float relative z-10 h-20 w-20"
                                loading="eager"
                            />
                        </div>

                        {/* Text */}
                        <div className="mt-6 text-center">
                            <h1 className="text-lg font-semibold text-white">
                                Processing Picture
                                <span className="ms-2 inline-flex">
                                    <span className="animate-bounce">.</span>
                                    <span
                                        className="animate-bounce"
                                        style={{ animationDelay: '0.2s' }}
                                    >
                                        .
                                    </span>
                                    <span
                                        className="animate-bounce"
                                        style={{ animationDelay: '0.4s' }}
                                    >
                                        .
                                    </span>
                                </span>
                            </h1>

                            <p className="mt-2 text-sm text-gray-300">
                                Please wait while we prepare your image
                            </p>
                        </div>

                        {/* Progress */}
                        <div className="mt-6 w-72">
                            <Progress value={progress} className="h-3" />

                            <div className="mt-2 flex justify-between text-sm text-white">
                                <span>Uploading</span>
                                <span>{progress}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <Heading
                title="Photo & E-Signature Upload"
                description="Upload your picture and provide your e-signature to proceed with your application."
            />
            <div className="space-y-8">
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Guidelines */}
                    <div className="rounded-3xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-6 shadow-lg dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
                        <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-700">
                            <InfoIcon className="h-6 w-6 text-[var(--main-color)]" />
                            <h1 className="text-2xl font-bold text-[var(--main-color)]">
                                Picture Guidelines
                            </h1>
                        </div>

                        <div className="space-y-4 text-sm">
                            {/* 1 */}
                            <div className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:border-gray-600 dark:bg-gray-700">
                                <div className="flex gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--main-color)]/10">
                                        <Camera className="h-5 w-5 text-[var(--main-color)]" />
                                    </div>
                                    <p className="leading-relaxed dark:text-gray-100">
                                        The photo must show a frontal pose
                                        looking directly at the camera, with
                                        your full face, both ears, and shoulders
                                        clearly visible.
                                    </p>
                                </div>
                            </div>

                            {/* 2 */}
                            <div className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:border-gray-600 dark:bg-gray-700">
                                <div className="flex gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--main-color)]/10">
                                        <Smile className="h-5 w-5 text-[var(--main-color)]" />
                                    </div>
                                    <p className="leading-relaxed dark:text-gray-100">
                                        Maintain a neutral expression with both
                                        eyes open and mouth closed.
                                    </p>
                                </div>
                            </div>

                            {/* 3 */}
                            <div className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:border-gray-600 dark:bg-gray-700">
                                <div className="flex gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--main-color)]/10">
                                        <Ban className="h-5 w-5 text-[var(--main-color)]" />
                                    </div>
                                    <p className="leading-relaxed dark:text-gray-100">
                                        Remove accessories such as caps,
                                        headbands, sunglasses, or face masks
                                        before taking the photo.
                                    </p>
                                </div>
                            </div>

                            {/* 4 */}
                            <div className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:border-gray-600 dark:bg-gray-700">
                                <div className="flex gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--main-color)]/10">
                                        <Square className="h-5 w-5 text-[var(--main-color)]" />
                                    </div>
                                    <p className="leading-relaxed dark:text-gray-100">
                                        The photo must be taken in front of a
                                        plain white or off-white background.
                                    </p>
                                </div>
                            </div>

                            {/* 5 */}
                            <div className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:border-gray-600 dark:bg-gray-700">
                                <div className="flex gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--main-color)]/10">
                                        <Shirt className="h-5 w-5 text-[var(--main-color)]" />
                                    </div>
                                    <p className="leading-relaxed dark:text-gray-100">
                                        Wear appropriate attire and ensure
                                        proper grooming.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Upload Section */}
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                        <div className="mb-4 flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-[var(--main-color)]" />
                            <h2 className="text-lg font-semibold">
                                Photo Preview
                            </h2>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900">
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="h-auto max-h-[500px] w-full object-contain"
                            />
                        </div>

                        <Input
                            type="file"
                            name="picture"
                            id="picture"
                            accept=".jpg, .jpeg, .png"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        <Button
                            type="button"
                            className="mt-5 h-12 w-full rounded-xl text-base font-medium"
                        >
                            <Label
                                htmlFor="picture"
                                className="flex h-full w-full cursor-pointer items-center justify-center gap-2"
                            >
                                <ImageUpIcon className="h-5 w-5" />
                                Upload ID Picture
                            </Label>
                        </Button>

                        <InputError message={errors.picture} className="mt-3" />
                    </div>
                </div>

                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
                    <div className="flex gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                        <div>
                            <h3 className="font-semibold text-amber-800 dark:text-amber-300">
                                Important Notice
                            </h3>
                            <p className="mt-1 text-sm leading-relaxed text-amber-700 dark:text-amber-200">
                                Uploaded photos are automatically processed to
                                remove the background, apply a white background,
                                center the subject, and resize the image for ID
                                printing. Because of this process, image
                                quality, cropping, alignment, and facial
                                proportions may be affected depending on the
                                original photo.
                            </p>
                            <p className="mt-2 text-sm font-medium text-amber-800 dark:text-amber-300">
                                If the preview does not look clear, properly
                                centered, or suitable for an ID picture, please
                                upload a different photo before proceeding.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Signature Section */}
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-base font-semibold">
                                E - Signature{' '}
                                <AsteriskIcon size={12} color="red" />
                            </Label>
                            <p className="mt-1 text-sm text-gray-500">
                                Draw or upload your signature.
                            </p>
                        </div>

                        <SignatureModal
                            idNumber={student.id_number}
                            onSave={handleSaveSignature}
                        />
                    </div>

                    <div className="mt-5 flex h-64 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-white">
                        {data.e_signature ? (
                            <img
                                src={URL.createObjectURL(data.e_signature)}
                                alt="Signature Preview"
                                className="max-h-full w-auto p-4"
                            />
                        ) : (
                            <div className="text-center">
                                <h1 className="text-xl font-semibold tracking-widest text-gray-400 italic">
                                    Signature Preview
                                </h1>
                                <p className="mt-2 text-sm text-gray-400">
                                    No signature uploaded yet
                                </p>
                            </div>
                        )}
                    </div>

                    <InputError message={errors.e_signature} className="mt-3" />
                </div>
            </div>
        </>
    );
}
