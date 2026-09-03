import StudentFormLayout from '@/layouts/student-form-layout';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CheckCheckIcon, ChevronLeft, ChevronRight, XIcon } from 'lucide-react';
import { CancelModal } from './Modal/CancelModal';
import { ConfirmModal } from './Modal/Confirm';
import { SubmittingModal } from './Modal/SubmittingModal';
import StepOne from './Steps/StepOne';
import StepThree, { StepThreePreview } from './Steps/StepThree';
import StepTwo from './Steps/StepTwo';

// Adjust title/description if a step's actual contents don't match.
const STEP_META = [
    {
        number: 1,
        title: 'Personal Info',
        description: 'Your personal and academic details.',
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

function StepIndicator({ currentStep }: { currentStep: number }) {
    return (
        <div className="mt-6 flex items-center">
            {STEP_META.map((step, idx) => {
                const isCompleted = step.number < currentStep;
                const isActive = step.number === currentStep;

                return (
                    <div
                        key={step.number}
                        className="flex flex-1 items-center last:flex-none"
                    >
                        <div className="flex flex-col items-center gap-1.5">
                            <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                                    isActive
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : isCompleted
                                          ? 'border-primary bg-primary/10 text-primary'
                                          : 'border-border bg-muted text-muted-foreground'
                                }`}
                            >
                                {step.number}
                            </div>
                            <span
                                className={`hidden text-center text-xs sm:block ${
                                    isActive
                                        ? 'font-medium text-foreground'
                                        : 'text-muted-foreground'
                                }`}
                            >
                                {step.title}
                            </span>
                        </div>

                        {idx < STEP_META.length - 1 && (
                            <div
                                className={`mx-2 h-0.5 flex-1 ${
                                    isCompleted ? 'bg-primary' : 'bg-border'
                                }`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function StepSection({
    number,
    title,
    description,
    children,
}: {
    number: number;
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-2xl border bg-background shadow-sm">
            <div className="flex items-start gap-3 border-b px-5 py-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {number}
                </div>
                <div>
                    <h2 className="text-base font-semibold text-foreground">
                        Step {number}: {title}
                    </h2>
                    {description && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            <div className="space-y-6 p-5">{children}</div>
        </section>
    );
}

export default function Index() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isOpen, setIsOpen] = useState(false);
    const [openCancelModal, setOpenCancelModal] = useState(false);
    const [openSubmittingModal, setOpenSubmittingModal] = useState(false);
    const [progress, setProgress] = useState(0);

    const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const { data, setData, processing, errors, post, clearErrors, reset } =
        useForm({
            type: '' as 'new' | 'replacement',
            receipt: null as File | null,
            reason: null as string | null,
            emergency_first_name: '',
            emergency_middle_init: null as string | null,
            emergency_last_name: '',
            emergency_suffix: null as string | null,
            relationship: '',
            contact_number: null as number | null,
            province: '',
            city: '',
            barangay: '',
            zip_code: '',
            campus: '',
            college: '',
            college_name: '',
            program: '',
            hasMajor: false,
            major: null as string | null,
            year: '',
            picture: null as File | null,
            e_signature: null as File | null,
            confirm_info: false,
            data_privacy: false,
        });

    const isFirstStep = currentStep === 1;
    const isLastStep = currentStep === TOTAL_STEPS;

    const goNext = () => {
        setCurrentStep((step) => Math.min(step + 1, TOTAL_STEPS));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goBack = () => {
        setCurrentStep((step) => Math.max(step - 1, 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // The actual submission logic. This is called ONLY from the Submit
    // button's own onClick — never from the form's native "submit" event —
    // so navigating between steps can never accidentally trigger a real
    // submission, regardless of button positioning/timing quirks.
    const submitForm = () => {
        if (processing) return;

        setIsOpen(false);
        setProgress(0);
        setOpenSubmittingModal(true);

        post(route('student.update'), {
            preserveScroll: true,

            onProgress: (event) => {
                if (!event?.percentage) return;

                // Upload phase: 0 → 90
                const uploadProgress = Math.min(
                    Math.round(event.percentage * 0.9),
                    90,
                );

                setProgress(uploadProgress);

                // Start fake server-side progress (90 → 99)
                if (uploadProgress === 90 && !processingIntervalRef.current) {
                    processingIntervalRef.current = setInterval(() => {
                        setProgress((prev) => (prev < 99 ? prev + 1 : prev));
                    }, 500);
                }
            },

            onSuccess: () => {
                cleanupProgress();
                setProgress(100);
                setOpenSubmittingModal(false);
                clearErrors();
                reset();
                setCurrentStep(1);
            },

            onError: (err) => {
                handleErrors(err);
            },
        });
    };

    const cleanupProgress = () => {
        if (processingIntervalRef.current) {
            clearInterval(processingIntervalRef.current);
            processingIntervalRef.current = null;
        }
    };

    const handleErrors = (errors: Record<string, string | string[]>) => {
        cleanupProgress();
        setOpenSubmittingModal(false);
        setIsOpen(false);

        const errorKeys = Object.keys(errors);
        const stepFields: Record<number, string[]> = {
            1: [
                'type',
                'receipt',
                'reason',
                'id_number',
                'campus',
                'college',
                'college_name',
                'program',
                'major',
                'year',
            ],
            2: ['picture', 'e_signature'],
            3: [
                'emergency_first_name',
                'emergency_middle_init',
                'emergency_last_name',
                'emergency_suffix',
                'relationship',
                'contact_number',
                'province',
                'city',
                'barangay',
                'zip_code',
            ],
            4: ['confirm_info', 'data_privacy'],
        };

        const errorStep = Object.entries(stepFields).find(([, fields]) =>
            errorKeys.some((key) => fields.includes(key)),
        )?.[0];

        if (errorStep) {
            setCurrentStep(Number(errorStep));
        }

        // Show all toasts
        [...errorKeys].reverse().forEach((key) => {
            const messages = errors[key];
            if (Array.isArray(messages)) {
                messages.forEach((message) => toast.error(message));
            } else {
                toast.error(messages);
            }
        });

        if (errorKeys.length > 0) {
            const firstErrorKey =
                errorKeys.find((key) =>
                    errorStep
                        ? stepFields[Number(errorStep)].includes(key)
                        : true,
                ) ?? errorKeys[0];
            const scrollToError = () => {
                let element: Element | null =
                    document.getElementsByName(firstErrorKey)[0] ||
                    document.getElementById(firstErrorKey);

                if (!element) {
                    document
                        .querySelectorAll('[data-error-for]')
                        .forEach((el) => {
                            if (
                                el.getAttribute('data-error-for') ===
                                firstErrorKey
                            ) {
                                element = el;
                            }
                        });
                }

                if (!element) {
                    const errorMessages = document.querySelectorAll(
                        '.text-destructive, [class*="text-red"]',
                    );
                    element = errorMessages[0] ?? null;
                }

                element?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            };

            window.setTimeout(scrollToError, 0);
        }
    };

    return (
        <StudentFormLayout>
            <CancelModal
                open={openCancelModal}
                onClose={() => setOpenCancelModal(false)}
            />
            {isOpen && (
                <ConfirmModal
                    open={isOpen}
                    processing={processing}
                    onClose={() => setIsOpen(false)}
                    onConfirm={submitForm}
                />
            )}

            <SubmittingModal
                open={openSubmittingModal}
                progress={progress}
                status={
                    progress < 90
                        ? 'Uploading files…'
                        : progress < 100
                          ? 'Uploading files…'
                          : 'Finalizing submission…'
                }
            />

            <StepIndicator currentStep={currentStep} />

            {/*
                Not a native <form onSubmit>: navigation and submission are
                both fully controlled by button onClick handlers below, so
                there's no native "submit" event that could ever fire on its
                own while moving between steps.
            */}
            <div className="mt-6 space-y-6">
                {currentStep === 1 && (
                    <StepSection {...STEP_META[0]}>
                        <StepOne
                            data={data}
                            setData={setData}
                            errors={errors}
                        />
                    </StepSection>
                )}

                {currentStep === 2 && (
                    <StepSection {...STEP_META[1]}>
                        <StepTwo
                            data={data}
                            setData={setData}
                            errors={errors}
                        />
                    </StepSection>
                )}

                {currentStep === 3 && (
                    <StepSection {...STEP_META[2]}>
                        <StepThree
                            data={data}
                            setData={setData}
                            errors={errors}
                        />
                    </StepSection>
                )}

                {currentStep === 4 && (
                    <StepSection {...STEP_META[3]}>
                        <StepThreePreview data={data} />

                        <div className="space-y-4">
                            <div className="flex items-start gap-2">
                                <Checkbox
                                    id="confirm_info"
                                    checked={data.confirm_info || false}
                                    onCheckedChange={(checked) => {
                                        const value = checked === true;
                                        setData('confirm_info', value);
                                    }}
                                    className="mt-1"
                                />
                                <Label
                                    htmlFor="confirm_info"
                                    className="inline-block text-sm leading-normal"
                                >
                                    I hereby confirm that all the information I
                                    have provided is
                                    <span className="font-semibold">
                                        true, correct, and complete
                                    </span>
                                    to the best of my knowledge.
                                </Label>
                            </div>
                            <InputError message={errors.confirm_info} />

                            <div className="flex items-start gap-2">
                                <Checkbox
                                    id="data_privacy"
                                    checked={data.data_privacy || false}
                                    onCheckedChange={(checked) => {
                                        const value = checked === true;
                                        setData('data_privacy', value);
                                    }}
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
                                        className="font-semibold underline"
                                        target="_blank"
                                    >
                                        Data Privacy Act of 2012 (RA 10173)
                                    </a>{' '}
                                    and authorize CHMSU to store and use my data
                                    for ID issuance and security access
                                    purposes.
                                </Label>
                            </div>

                            <InputError message={errors.data_privacy} />
                        </div>
                    </StepSection>
                )}

                <div className="flex items-center justify-between">
                    <div>
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
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:w-max sm:flex-row">
                        {isFirstStep && (
                            <Button
                                type="button"
                                onClick={() => setOpenCancelModal(true)}
                                variant="outline"
                                disabled={processing}
                                className="grow"
                            >
                                Cancel <XIcon />
                            </Button>
                        )}

                        {!isLastStep ? (
                            <Button
                                type="button"
                                onClick={goNext}
                                className="grow"
                            >
                                Next <ChevronRight />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={submitForm}
                                disabled={processing}
                                className="grow"
                            >
                                Submit <CheckCheckIcon />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </StudentFormLayout>
    );
}
