import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { FormDataProps } from '@/lib/form-type';
import {
    applyWhiteBackground,
    resizeWithFaceCentering,
} from '@/lib/image-remover';
import { cleanMask } from '@/lib/mask-utils';
import { cn } from '@/lib/utils';
import * as hf from '@huggingface/transformers';
import { usePage } from '@inertiajs/react';
import * as imageConversion from 'image-conversion';
import {
    Ban,
    Camera,
    CheckCircle2,
    ImageUpIcon,
    InfoIcon,
    PenLine,
    RefreshCw,
    ScanFace,
    Shirt,
    Smile,
    Square,
    Trash2,
    UserPlus,
} from 'lucide-react';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import SignatureModal from '../Modal/SignatureModal';

interface StepTwoProps {
    data: FormDataProps;
    setData: (key: string, value: any) => void;
    setError: (key: string, value: any) => void;
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

const MODEL_ID = 'briaai/RMBG-1.4';
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];
const GUIDELINES_DISMISSED_KEY = 'student-photo-guidelines-dismissed';

type LoadedModel = {
    model: any;
    processor: any;
};

// Each `min` matches a setProgress(...) value in handleFileChange, and the
// label describes the work that runs AFTER that value is set.
const PROGRESS_STAGES = [
    { min: 0, label: 'Validating your photo...' },
    // getModel(): downloads/initializes RMBG-1.4 (instant if preloaded)
    { min: 10, label: 'Loading the AI model...' },
    // createObjectURL + RawImage.fromURL + processor(image)
    { min: 50, label: 'Decoding and resizing your photo...' },
    // await model({ input: pixel_values })
    { min: 60, label: 'Running the AI to find the person...' },
    // normalize tensor -> mask pixels -> cleanMask()
    { min: 65, label: 'Cleaning up the mask edges...' },
    // draw image + mask with 'destination-in'
    { min: 70, label: 'Cutting out the background...' },
    // canvas.toBlob(..., 'image/png')
    { min: 80, label: 'Exporting the transparent image...' },
    // applyWhiteBackground()
    { min: 85, label: 'Adding a white background...' },
    // resizeWithFaceCentering(320x378)
    { min: 90, label: 'Resizing and centering the face...' },
    // imageConversion.compress() to JPEG
    { min: 99, label: 'Compressing to JPG...' },
    { min: 100, label: 'Done!' },
];

const getStageLabel = (progress: number) =>
    [...PROGRESS_STAGES].reverse().find((s) => progress >= s.min)?.label ??
    PROGRESS_STAGES[0].label;

const GUIDELINES = [
    {
        Icon: Camera,
        text: 'The photo must show a frontal pose looking directly at the camera, with your full face, both ears, and shoulders clearly visible.',
    },
    {
        Icon: Smile,
        text: 'Maintain a neutral expression with both eyes open and mouth closed.',
    },
    {
        Icon: Ban,
        text: 'Remove accessories such as caps, headbands, sunglasses, or face masks before taking the photo.',
    },
    {
        Icon: Square,
        text: 'The photo must be taken in front of a plain white or off-white background.',
    },
    {
        Icon: Shirt,
        text: 'Wear appropriate attire and ensure proper grooming.',
    },
];

// What to tell the student, depending on the kind of request.
const REQUEST_INFO = {
    new: {
        Icon: UserPlus,
        title: 'New ID request',
        description:
            'Upload your photo and e-signature to proceed with your application.',
        points: [
            'Your photo and e-signature are required. They will be printed on your ID.',
            'Not following the photo guidelines may result for your ID to be not included to printing.',
            'You can review how your ID will look in the final step.',
        ],
    },
    replacement: {
        Icon: RefreshCw,
        title: 'Replacement request',
        description:
            'A new photo and e-signature are optional for a replacement ID.',
        points: [
            'Upload a new photo or e-signature only if you want them updated.',
            'You can continue to the next step without uploading either one.',
            'If you do upload a photo, it must follow the same guidelines as a new request.',
        ],
    },
} as const;

function RequirementBadge({ required }: { required: boolean }) {
    return (
        <span
            className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                required
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted text-muted-foreground',
            )}
        >
            {required ? 'Required' : 'Optional'}
        </span>
    );
}

export default function StepTwo({
    data,
    setData,
    errors,
    setError,
}: StepTwoProps) {
    const { student } = usePage<PageProps>().props;
    const isReplacement = data.type === 'replacement';
    const info = REQUEST_INFO[isReplacement ? 'replacement' : 'new'];

    const [previewUrl, setPreviewUrl] = useState('/placeholder.jpg');
    const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
    const [isBgRemoving, setIsBgRemoving] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [guidelinesOpen, setGuidelinesOpen] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Holds the loaded model/processor once ready, so we don't re-download
    // or re-initialize them every time the user picks a file.
    const modelRef = useRef<LoadedModel | null>(null);
    // Holds the in-flight loading promise so multiple callers (preload +
    // an eager file pick) don't trigger duplicate downloads.
    const modelLoadingRef = useRef<Promise<LoadedModel> | null>(null);

    const getModel = (): Promise<LoadedModel> => {
        if (modelRef.current) {
            return Promise.resolve(modelRef.current);
        }

        if (!modelLoadingRef.current) {
            modelLoadingRef.current = (async () => {
                hf.env.allowRemoteModels = false;
                hf.env.allowLocalModels = true;
                hf.env.localModelPath = `${window.location.origin}/models/`;

                const [model, processor] = await Promise.all([
                    hf.AutoModel.from_pretrained(MODEL_ID, {
                        dtype: 'q8', // or 'fp16' / 'uint8' — test which stays accurate enough
                    }),
                    hf.AutoProcessor.from_pretrained(MODEL_ID),
                ]);

                const loaded = { model, processor };
                modelRef.current = loaded;
                return loaded;
            })();
        }

        return modelLoadingRef.current;
    };

    // Kick off the model download as soon as the step mounts, instead of
    // waiting for the user to pick a file. This overlaps the ~download
    // time with the time they spend reading guidelines / filling fields.
    useEffect(() => {
        getModel().catch((err) => {
            // Don't surface an error here — if preloading fails, we'll
            // just retry (and show the real error) inside handleFileChange.
            console.error('Model preload failed:', err);
        });
    }, []);

    // Show guidelines automatically on entering this step,
    // unless the user previously opted out.
    useEffect(() => {
        const dismissed = localStorage.getItem(GUIDELINES_DISMISSED_KEY);
        if (dismissed !== 'true') {
            setGuidelinesOpen(true);
        }
    }, []);

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

    // Signature blob URL: created once per file and revoked on change,
    // instead of creating a new one on every render.
    useEffect(() => {
        if (!data.e_signature) {
            setSignatureUrl(null);
            return;
        }

        const url = URL.createObjectURL(data.e_signature);
        setSignatureUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [data.e_signature]);

    useEffect(() => {
        if (isBgRemoving) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }

        return () => document.body.classList.remove('overflow-hidden');
    }, [isBgRemoving]);

    const handleGuidelinesOpenChange = (open: boolean) => {
        if (!open && dontShowAgain) {
            localStorage.setItem(GUIDELINES_DISMISSED_KEY, 'true');
        }
        setGuidelinesOpen(open);
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            toast.error('Invalid file type. Please upload a JPG or PNG image.');
            setError(
                'picture',
                'Invalid file type. Please upload a JPG or PNG image.',
            );
            e.target.value = '';
            return;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            toast.error('Image is too large. Please upload a photo under 2MB.');
            setError(
                'picture',
                'Image is too large. Please upload a photo under 2MB.',
            );
            e.target.value = ''; // reset so re-picking the same file still fires onChange
            return;
        }

        setIsBgRemoving(true);
        setProgress(0);
        setError('picture', null);

        await new Promise((resolve) => setTimeout(resolve, 0));

        let imageSrc = '';

        try {
            // If preloading already finished, this resolves instantly.
            // If not, we wait here instead of downloading a second time.
            setProgress(10);

            const { model, processor } = await getModel();

            setProgress(50);

            imageSrc = URL.createObjectURL(file);

            const image = await hf.RawImage.fromURL(imageSrc);

            const inputs = await processor(image);

            setProgress(60);

            const outputs = await model({
                input: inputs.pixel_values,
            });

            // Inference is done; the next block is synchronous mask work.
            // Yield once so React can paint the new stage label first.
            setProgress(65);
            await new Promise((resolve) => setTimeout(resolve, 0));

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

            // Clean the mask: threshold speckles, erode fringe, feather edges
            const cleanedMask = cleanMask(rawMaskData, width, height, {
                threshold: 100,
                closeRadius: 4, // fills interior dots
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

            setProgress(99);

            const finalBlob: Blob = await (imageConversion.compress as any)(
                centeredBlob,
                {
                    type: 'image/jpeg',
                    quality: 0.7,
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

            // Reset so picking the same file again still fires onChange.
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            setIsBgRemoving(false);
            setProgress(0);
        }
    };

    const handleSaveSignature = (file: File) => {
        setData('e_signature', file);
    };

    const handleRemovePicture = () => {
        setData('picture', null);
        setError('picture', null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveSignature = () => {
        setData('e_signature', null);
        setError('e_signature', null);
    };

    return (
        <div className="space-y-6">
            {/* Processing overlay */}
            {isBgRemoving && (
                <div
                    role="status"
                    className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
                >
                    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-xl">
                        <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
                            <div className="absolute inset-0 animate-spin rounded-full border-4 border-muted border-t-primary" />
                            <ScanFace
                                className="animate-float relative z-10 h-12 w-12 text-primary"
                                strokeWidth={1.5}
                            />
                        </div>

                        <div className="mt-6 text-center">
                            <h2 className="text-lg font-semibold">
                                Processing your photo
                            </h2>
                            <p
                                className="mt-1 text-sm text-muted-foreground"
                                aria-live="polite"
                            >
                                {getStageLabel(progress)}
                            </p>
                        </div>

                        <div className="mt-6">
                            <Progress value={progress} className="h-2.5" />
                            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                                <span>This runs on your device</span>
                                <span className="font-medium text-foreground">
                                    {progress}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <Heading
                    title="Photo & E-Signature Upload"
                    description={info.description}
                />

                <Dialog
                    open={guidelinesOpen}
                    onOpenChange={handleGuidelinesOpenChange}
                >
                    <DialogTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2"
                        >
                            <InfoIcon className="h-4 w-4" />
                            Photo guidelines
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <InfoIcon className="h-5 w-5 text-primary" />
                                Picture guidelines
                            </DialogTitle>
                        </DialogHeader>

                        <ul className="space-y-3 text-sm">
                            {GUIDELINES.map(({ Icon, text }, i) => (
                                <li
                                    key={i}
                                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground"
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <p className="pt-1.5 leading-relaxed">
                                        {text}
                                    </p>
                                </li>
                            ))}
                        </ul>

                        <DialogFooter className="mt-2 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="dont-show-guidelines"
                                    checked={dontShowAgain}
                                    onCheckedChange={(checked) =>
                                        setDontShowAgain(checked === true)
                                    }
                                />
                                <Label
                                    htmlFor="dont-show-guidelines"
                                    className="cursor-pointer text-sm font-normal text-muted-foreground"
                                >
                                    Don't show this again
                                </Label>
                            </div>
                            <Button
                                type="button"
                                className="sm:ml-auto"
                                onClick={() =>
                                    handleGuidelinesOpenChange(false)
                                }
                            >
                                Got it
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Request-type notice */}
            <Alert className="border-primary/30 bg-primary/5 *:[svg]:text-primary">
                <info.Icon />
                <AlertTitle>{info.title}</AlertTitle>
                <AlertDescription>
                    <ul className="list-disc space-y-1 ps-4">
                        {info.points.map((point) => (
                            <li key={point}>{point}</li>
                        ))}
                    </ul>
                </AlertDescription>
            </Alert>

            <div className="grid items-start gap-6 md:grid-cols-2">
                {/* Photo */}
                <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground">
                    <div className="mb-4 flex items-center justify-between gap-2">
                        <h2 className="text-base font-semibold">ID photo</h2>
                        <RequirementBadge required={!isReplacement} />
                    </div>

                    {/* Same aspect ratio as the processed output (320x378) */}
                    <div className="relative mx-auto aspect-[320/378] w-full max-w-xs overflow-hidden rounded-xl border border-dashed border-border bg-muted">
                        <img
                            src={previewUrl}
                            alt="ID photo preview"
                            className="h-full w-full object-cover"
                        />
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-1.5 text-sm">
                        {data.picture ? (
                            <>
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                <span className="font-medium">Photo ready</span>
                            </>
                        ) : (
                            <span className="text-muted-foreground">
                                No photo uploaded yet
                            </span>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        name="picture"
                        id="picture"
                        accept=".jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="sr-only"
                        tabIndex={-1}
                    />

                    <div className="mt-4 flex gap-2">
                        <Button
                            type="button"
                            className="h-11 flex-1 gap-2"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <ImageUpIcon className="h-4 w-4" />
                            {data.picture ? 'Replace photo' : 'Upload ID photo'}
                        </Button>
                        {data.picture && (
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-11 w-11 shrink-0"
                                onClick={handleRemovePicture}
                                aria-label="Remove photo"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    <p className="mt-3 text-center text-xs text-muted-foreground">
                        JPG, JPEG or PNG, max 2MB.
                    </p>

                    <InputError message={errors.picture} className="mt-3" />
                </section>

                {/* Signature */}
                <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground">
                    <div className="mb-4 flex items-center justify-between gap-2">
                        <h2 className="text-base font-semibold">E-signature</h2>
                        <RequirementBadge required={!isReplacement} />
                    </div>

                    {/* Stays white on purpose: signature ink is dark and
                        would disappear on a dark card background. */}
                    <div className="flex h-56 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-white">
                        {signatureUrl ? (
                            <img
                                src={signatureUrl}
                                alt="Signature preview"
                                className="max-h-full w-auto p-4"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-center text-neutral-400">
                                <PenLine className="h-8 w-8" />
                                <p className="text-sm">
                                    No signature added yet
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-1.5 text-sm">
                        {data.e_signature ? (
                            <>
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                <span className="font-medium">
                                    Signature ready
                                </span>
                            </>
                        ) : (
                            <span className="text-muted-foreground">
                                Draw or upload your signature
                            </span>
                        )}
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                        <div className="flex-1 [&>*]:w-full">
                            <SignatureModal
                                idNumber={student.id_number}
                                onSave={handleSaveSignature}
                            />
                        </div>
                        {data.e_signature && (
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="shrink-0"
                                onClick={handleRemoveSignature}
                                aria-label="Remove signature"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    <InputError message={errors.e_signature} className="mt-3" />
                </section>
            </div>
        </div>
    );
}
