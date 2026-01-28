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
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
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
    const previewUrl = useMemo(() => {
        if (!data.picture) return '/placeholder.jpg';
        return URL.createObjectURL(data.picture);
    }, [data.picture]);

    const [isBgRemoving, setIsBgRemoving] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);

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

        try {
            // 1. Remove background → transparent PNG
            setProgress(10);
            const removedBlob: Blob = await removeBackground(file);

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
            toast.error('Failed to process image. Please try again.');
            setData('picure', null);
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
                <div className="fixed top-0 left-0 z-20 flex h-full w-full items-center justify-center overflow-hidden bg-black/70">
                    <div className="relative flex h-80 w-80 items-center justify-center">
                        <div className="z-10 flex flex-col items-center gap-5">
                            <img
                                src="/logo.webp"
                                className="h-18 w-18 md:h-20 md:w-20"
                                alt="CHMSU Logo"
                                loading="eager"
                            />
                            <h1 className="text-center text-white">
                                Processing Picture...
                            </h1>
                            <div className="w-full max-w-xs">
                                <Progress value={progress} className="w-full" />
                                <p className="mt-2 text-center text-sm text-white">
                                    {progress}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <Heading
                title="Photo & E-Signature Upload"
                description="Upload your 1×1 ID photo and provide your electronic signature to proceed with your application."
            />
            <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border bg-gray-50 p-6 dark:border-gray-600 dark:bg-gray-800">
                    <h1 className="flex items-center gap-3 text-2xl font-bold text-[var(--main-color)] dark:text-[var(--main-color)]">
                        Picture Guidelines
                        <InfoIcon />
                    </h1>

                    <div className="mt-3 space-y-4 text-sm">
                        {/* 1 */}
                        <div className="flex items-start gap-4 rounded-xl border bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-700">
                            <div className="flex gap-3">
                                <Camera className="mt-1 h-6 w-6 flex-shrink-0 text-[var(--main-color)]" />
                                <p className="m-0 p-0 dark:text-gray-100">
                                    The photo must show a frontal pose looking
                                    directly at the camera, with your full face,
                                    both ears, and shoulders clearly visible.
                                </p>
                            </div>
                        </div>

                        {/* 2 */}
                        <div className="flex items-start gap-4 rounded-xl border bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-700">
                            <div className="flex gap-3">
                                <Smile className="mt-1 h-6 w-6 flex-shrink-0 text-[var(--main-color)]" />
                                <p className="m-0 p-0 dark:text-gray-100">
                                    Maintain a neutral expression with both eyes
                                    open and mouth closed.
                                </p>
                            </div>
                        </div>

                        {/* 3 */}
                        <div className="flex items-start gap-4 rounded-xl border bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-700">
                            <div className="flex gap-3">
                                <Ban className="mt-1 h-6 w-6 flex-shrink-0 text-[var(--main-color)]" />
                                <p className="m-0 p-0 dark:text-gray-100">
                                    Remove accessories such as caps, headbands,
                                    sunglasses, or face masks before taking the
                                    photo.
                                </p>
                            </div>
                        </div>

                        {/* 4 */}
                        <div className="flex items-start gap-4 rounded-xl border bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-700">
                            <div className="flex gap-3">
                                <Square className="mt-1 h-6 w-6 flex-shrink-0 text-[var(--main-color)]" />
                                <p className="m-0 p-0 dark:text-gray-100">
                                    The photo must be taken in front of a plain
                                    white or off-white background.
                                </p>
                            </div>
                        </div>

                        {/* 5 */}
                        <div className="flex items-start gap-4 rounded-xl border bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-700">
                            <div className="flex gap-3">
                                <Shirt className="mt-1 h-6 w-6 flex-shrink-0 text-[var(--main-color)]" />
                                <p className="m-0 p-0 dark:text-gray-100">
                                    Wear appropriate attire and ensure proper
                                    grooming.
                                </p>
                            </div>
                        </div>

                        {/* 6 */}
                        <div className="flex items-start gap-4 rounded-xl border bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-700">
                            <div className="flex gap-3">
                                <ImageIcon className="mt-1 h-6 w-6 flex-shrink-0 text-[var(--main-color)]" />
                                <p className="m-0 p-0 dark:text-gray-100">
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
                        className="h-auto w-full border object-contain dark:border-gray-600"
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
                        idNumber={student.id_number}
                        onSave={handleSaveSignature}
                    />
                </div>

                <div className="mt-3 flex h-56 items-center justify-center border dark:bg-white">
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
                <div className="space-x-3">
                    <Button
                        type="button"
                        onClick={onCancel}
                        className="ml-auto text-center"
                        size="lg"
                        variant="outline"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={setModalOpen}
                        className="ml-auto text-center"
                        size="lg"
                    >
                        Next
                        <ArrowBigRight />
                    </Button>
                </div>
            </div>{' '}
        </>
    );
}
