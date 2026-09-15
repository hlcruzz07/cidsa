import InputError from '@/components/input-error';
import ThemeButton from '@/components/ThemeButton';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useForm, usePage } from '@inertiajs/react';
import { CheckCheckIcon, ChevronLeft, ChevronRight, XIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

import StaffSuccessModal from './Form/Modal/StaffSuccessModal';
import StepFourPreview from './Form/Steps/StepFourPreview';
import StepOne from './Form/Steps/StepOne';
import StepThree from './Form/Steps/StepThree';
import StepTwo from './Form/Steps/StepTwo';
import { PageProps, StaffFormData } from './Form/types';

type FlashMessages = {
    success?: string | null;
    error?: string | null;
    info?: string | null;
    warning?: string | null;
};

const STEP_META = [
    {
        number: 1,
        title: 'Personal Info',
        description: 'Your personal and employment details.',
    },
    {
        number: 2,
        title: 'Photo & Signature',
        description: 'Upload your ID picture and provide your e-signature.',
    },
    {
        number: 3,
        title: 'Emergency Contact',
        description: 'Someone we can reach in case of emergency.',
    },
    {
        number: 4,
        title: 'Final Confirmation',
        description: 'Review and confirm before submitting.',
    },
] as const;

const TOTAL_STEPS = STEP_META.length;

// Maps validation error keys returned by the backend to the wizard step
// that owns them, so a failed submission jumps the user back to the right
// step instead of leaving them stranded on Step 4.
const STEP_FIELDS: Record<number, (keyof StaffFormData)[]> = {
    1: ['digital_id', 'designation', 'department'],
    2: ['picture', 'e_signature'],
    3: [
        'emergency_fname',
        'emergency_mname',
        'emergency_lname',
        'emergency_suffix',
        'emergency_phone',
        'emergency_address',
        'blood_type',
    ],
    4: ['confirm_info', 'data_privacy'],
};

function StepIndicator({ currentStep }: { currentStep: number }) {
    const meta = STEP_META[currentStep - 1];
    const percent = (currentStep / TOTAL_STEPS) * 100;

    return (
        <div className="mb-6">
            <div className="mb-2 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-foreground">
                    Step {currentStep} of {TOTAL_STEPS}: {meta.title}
                </span>
                <span className="text-xs text-muted-foreground">
                    {Math.round(percent)}%
                </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${percent}%` }}
                />
            </div>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                {meta.description}
            </p>
        </div>
    );
}

function StepSection({ children }: { children: React.ReactNode }) {
    return (
        <section className="w-full rounded-2xl border border-border bg-background p-4 sm:p-6">
            {children}
        </section>
    );
}

export default function StaffFormIndex() {
    const page = usePage<PageProps>();
    const { staff, success, departments } = page.props;
    const flash: FlashMessages = (page.props as any).flash || {};

    const [currentStep, setCurrentStep] = useState(1);
    const [openSubmittingModal, setOpenSubmittingModal] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isFirstStep = currentStep === 1;
    const isLastStep = currentStep === TOTAL_STEPS;

    useEffect(() => {
        if (!flash) return;
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
        if (flash.info) toast.info(flash.info);
        if (flash.warning) toast.warning(flash.warning);
    }, [flash]);

    const { data, setData, processing, errors, post, clearErrors, reset } =
        useForm<StaffFormData>({
            picture: '',
            e_signature: '',
            digital_id: staff.digital_id,
            name: staff.name,
            campus: staff.campus,
            designation: staff.designation,
            department: staff.department,
            emergency_fname: '',
            emergency_mname: '',
            emergency_lname: '',
            emergency_suffix: '',
            emergency_phone: '',
            emergency_address: '',
            blood_type: '',
            confirm_info: false,
            data_privacy: false,
        });

    const setFieldData = (key: keyof StaffFormData, value: any) =>
        setData(key, value);
    const goNext = () => {
        setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const goBack = () => {
        setCurrentStep((s) => Math.max(s - 1, 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const cleanupProgress = () => {
        if (processingIntervalRef.current) {
            clearInterval(processingIntervalRef.current);
            processingIntervalRef.current = null;
        }
    };

    const handleErrors = (errs: Record<string, string | string[]>) => {
        cleanupProgress();
        setOpenSubmittingModal(false);
        const errorKeys = Object.keys(errs);
        const errorStep = Object.entries(STEP_FIELDS).find(([, fields]) =>
            errorKeys.some((k) => (fields as string[]).includes(k)),
        )?.[0];
        if (errorStep) setCurrentStep(Number(errorStep));
        [...errorKeys].reverse().forEach((key) => {
            const messages = errs[key];
            if (Array.isArray(messages))
                messages.forEach((m) => toast.error(m));
            else toast.error(messages);
        });
    };

    const submitForm = () => {
        if (processing) return;
        setUploadProgress(0);
        setOpenSubmittingModal(true);
        post(route('store.staff'), {
            preserveScroll: true,
            onProgress: (event) => {
                if (!event?.percentage) return;
                const up = Math.min(Math.round(event.percentage * 0.9), 90);
                setUploadProgress(up);
                if (up === 90 && !processingIntervalRef.current) {
                    processingIntervalRef.current = setInterval(() => {
                        setUploadProgress((prev) =>
                            prev < 99 ? prev + 1 : prev,
                        );
                    }, 500);
                }
            },
            onSuccess: () => {
                cleanupProgress();
                setUploadProgress(100);
                setOpenSubmittingModal(false);
                clearErrors();
                reset();
                setCurrentStep(1);
            },
            onError: handleErrors,
        });
    };

    console.log(data);

    return (
        <div className="min-h-dvh bg-background">
            <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5">
                        <img
                            src="/logo.webp"
                            alt="CHMSU"
                            className="h-8 w-8 shrink-0"
                        />
                        <div className="flex flex-col leading-tight">
                            <span className="text-sm font-bold text-primary">
                                CHMSU
                            </span>
                            <span className="text-xs text-muted-foreground">
                                Employee ID Request
                            </span>
                        </div>
                    </div>
                </div>
            </header>{' '}
            <ThemeButton />
            <StaffSuccessModal open={success ?? false} />
            {openSubmittingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8">
                        <div className="relative flex h-20 w-20 items-center justify-center">
                            <div className="absolute inset-0 animate-spin rounded-full border-4 border-muted border-t-primary" />
                            <img
                                src="/logo.webp"
                                alt="CHMSU"
                                className="h-12 w-12"
                            />
                        </div>
                        <p className="text-sm font-semibold text-foreground sm:text-base">
                            {uploadProgress < 90
                                ? 'Uploading files…'
                                : 'Finalizing submission…'}
                        </p>
                        <div className="w-full">
                            <Progress value={uploadProgress} className="h-2" />
                            <p className="mt-1 text-center text-xs text-muted-foreground">
                                {uploadProgress}%
                            </p>
                        </div>
                    </div>
                </div>
            )}
            <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
                <StepIndicator currentStep={currentStep} />

                <div className="space-y-4">
                    {currentStep === 1 && (
                        <StepSection>
                            <StepOne
                                data={data}
                                setData={setFieldData}
                                errors={errors}
                                staff={staff}
                                departments={departments}
                            />
                        </StepSection>
                    )}
                    {currentStep === 2 && (
                        <StepSection>
                            <StepTwo
                                data={data}
                                setData={setFieldData}
                                errors={errors}
                                staff={staff}
                            />
                        </StepSection>
                    )}
                    {currentStep === 3 && (
                        <StepSection>
                            <StepThree
                                data={data}
                                setData={setFieldData}
                                errors={errors}
                            />
                        </StepSection>
                    )}
                    {currentStep === 4 && (
                        <StepSection>
                            <StepFourPreview data={data} staff={staff} />
                            <div className="mt-6 space-y-4">
                                <div className="flex items-start gap-2 rounded-xl border border-border p-3">
                                    <Checkbox
                                        id="confirm_info"
                                        checked={data.confirm_info}
                                        onCheckedChange={(checked) =>
                                            setData(
                                                'confirm_info',
                                                checked === true,
                                            )
                                        }
                                        className="mt-1"
                                    />
                                    <Label
                                        htmlFor="confirm_info"
                                        className="inline-block text-sm leading-normal"
                                    >
                                        I hereby confirm that all the
                                        information I have provided is{' '}
                                        <span className="font-semibold">
                                            true, correct, and complete
                                        </span>{' '}
                                        to the best of my knowledge.
                                    </Label>
                                </div>
                                <InputError message={errors.confirm_info} />
                                <div className="flex items-start gap-2 rounded-xl border border-border p-3">
                                    <Checkbox
                                        id="data_privacy"
                                        checked={data.data_privacy}
                                        onCheckedChange={(checked) =>
                                            setData(
                                                'data_privacy',
                                                checked === true,
                                            )
                                        }
                                        className="mt-1"
                                    />
                                    <Label
                                        htmlFor="data_privacy"
                                        className="inline-block text-sm leading-normal"
                                    >
                                        I agree to the processing of my personal
                                        information in accordance with{' '}
                                        <a
                                            href="https://privacy.gov.ph/data-privacy-act/"
                                            className="font-semibold text-primary underline"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Data Privacy Act of 2012 (RA 10173)
                                        </a>{' '}
                                        and authorize CHMSU to store and use my
                                        data for ID issuance and security access
                                        purposes.
                                    </Label>
                                </div>
                                <InputError message={errors.data_privacy} />
                            </div>
                        </StepSection>
                    )}

                    <div className="flex w-full flex-col gap-3 sm:w-max sm:flex-row">
                        {!isFirstStep && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={goBack}
                                disabled={processing}
                            >
                                <ChevronLeft /> Back
                            </Button>
                        )}
                        <div className="flex w-full flex-col gap-3 sm:w-max sm:flex-row">
                            {isFirstStep && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={processing}
                                    onClick={() => (window.location.href = '/')}
                                >
                                    Cancel <XIcon />
                                </Button>
                            )}
                            {!isLastStep ? (
                                <Button type="button" onClick={goNext}>
                                    Next <ChevronRight />
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={submitForm}
                                    disabled={processing}
                                >
                                    Submit <CheckCheckIcon />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
