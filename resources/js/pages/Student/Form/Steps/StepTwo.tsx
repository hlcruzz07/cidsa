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
import { removeBackground } from '@imgly/background-removal';
import { usePage } from '@inertiajs/react';
import * as imageConversion from 'image-conversion';
import {
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
    setModalOpen: () => void;
    onCancel: () => void;
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

export default function StepTwo({
    data,
    setData,
    errors,
    setModalOpen,
    onCancel,
}: StepTwoProps) {
    const { student } = usePage<PageProps>().props;
    const [previewUrl, setPreviewUrl] = useState('/placeholder.jpg');
    const [isBgRemoving, setIsBgRemoving] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);

    const imglyConfig = {
        publicPath: import.meta.env.VITE_IMGLY_PUBLIC_PATH || '/imgly/',
        fetchArgs: {
            cache: 'force-cache' as RequestCache,
        },
    };

    const withTimeout = async <T,>(
        promise: Promise<T>,
        timeoutMs: number,
        errorMessage: string,
    ) => {
        const timeout = new Promise<T>((_, reject) => {
            const timer = window.setTimeout(() => {
                reject(new Error(errorMessage));
            }, timeoutMs);

            promise.finally(() => window.clearTimeout(timer));
        });

        return Promise.race([promise, timeout]);
    };

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

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsBgRemoving(true);
        setProgress(0);

        // Allow React to render the overlay before processing begins
        await new Promise((resolve) => setTimeout(resolve, 0));

        try {
            // 1. Remove background → transparent PNG
            setProgress(10);
            const removedBlob: Blob = await withTimeout(
                removeBackground(file, imglyConfig),
                30000,
                'Image processing timed out.',
            );

            // 2. Convert transparent → white background
            setProgress(30);
            const whiteBgBlob: Blob = await applyWhiteBackground(removedBlob);

            // 3. Resize + auto-center on face
            setProgress(60);
            const centeredBlob: Blob = await resizeWithFaceCentering(
                whiteBgBlob,
                320,
                378,
            );

            // 4. Compress final image
            setProgress(90);
            const finalBlob: Blob = await (imageConversion.compress as any)(
                centeredBlob,
                {
                    type: 'image/jpg',
                    quality: centeredBlob.size > 2 * 1024 * 1024 ? 0.7 : 0.95,
                },
            );

            setProgress(100);
            const filename = `${student.id_number}.jpg`;

            setData(
                'picture',
                new File([finalBlob], filename, { type: 'image/jpg' }),
            );
        } catch (err) {
            console.error('Background removal failed', err);
            toast.warning(
                'Image cleanup could not complete. The original image will be used instead.',
            );
            setData('picture', file);
        } finally {
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

                        <InputError message={errors.picture} />
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

                    <InputError message={errors.e_signature} />
                </div>

                {/* Actions */}
                <div className="flex justify-end border-t border-gray-200 pt-6 dark:border-gray-700">
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            onClick={onCancel}
                            size="lg"
                            variant="outline"
                            className="min-w-[120px]"
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            onClick={setModalOpen}
                            size="lg"
                            className="min-w-[140px]"
                        >
                            Next
                            <ArrowBigRight />
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
