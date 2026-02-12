import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import StudentFormLayout from '@/layouts/student-form-layout';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

import { CancelModal } from './Modal/CancelModal';
import { ConfirmModal } from './Modal/Confirm';
import { SubmittingModal } from './Modal/SubmittingModal';
import StepOne from './Steps/StepOne';
import StepThree from './Steps/StepThree';
import StepTwo from './Steps/StepTwo';

export default function Index() {
    const [step, setStep] = useState(1);
    const [isOpen, setIsOpen] = useState(false);
    const [openCancelModal, setOpenCancelModal] = useState(false);
    const [openSubmittingModal, setOpenSubmittingModal] = useState(false);
    const [progress, setProgress] = useState(0);

    const formRef = useRef<HTMLFormElement | null>(null);
    const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const { data, setData, processing, errors, post, clearErrors, reset } =
        useForm({
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
            section: '',
            picture: null as File | null,
            e_signature: null as File | null,
            confirm_info: false,
            data_privacy: false,
        });

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (processing) return;

        /* ---------------- STEP 1 ---------------- */
        if (step === 1) {
            post(route('validateStepOne'), {
                preserveScroll: true,
                onSuccess: () => setStep(2),
                onError: handleErrors,
            });
            return;
        }

        /* ---------------- STEP 2 ---------------- */
        if (step === 2) {
            post(route('validateStepTwo'), {
                preserveScroll: true,
                onSuccess: () => setStep(3),
                onError: handleErrors,
            });
            return;
        }

        /* ---------------- FINAL SUBMIT ---------------- */
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
            },

            onError: handleErrors,
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

        Object.values(errors).forEach((messages) => {
            if (Array.isArray(messages)) {
                messages.forEach((message) => toast.error(message));
            } else {
                toast.error(messages);
            }
        });
    };

    return (
        <StudentFormLayout>
            <CancelModal
                open={openCancelModal}
                onClose={() => setOpenCancelModal(false)}
            />

            {/* STEP PROGRESS BAR */}
            <div className="relative my-5">
                <Progress value={step === 1 ? 0 : step === 2 ? 50 : 100} />
                <div className="absolute top-[-12px] left-0 flex w-full justify-between">
                    {[
                        'Student Information',
                        'Photo & E-Signature Upload',
                        'ID Preview & Confirmation',
                    ].map((label, index) => {
                        const stepIndex = index + 1;
                        const active = step >= stepIndex;

                        return (
                            <Tooltip key={label}>
                                <TooltipTrigger asChild>
                                    <Badge
                                        variant="secondary"
                                        className={`text-sm hover:cursor-default md:text-lg ${
                                            active
                                                ? 'bg-green-600 text-white'
                                                : 'bg-green-200 text-gray-400 dark:bg-green-950'
                                        }`}
                                    >
                                        {stepIndex}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{label}</p>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </div>
            </div>

            {/* FORM */}
            <form
                ref={formRef}
                onSubmit={handleFormSubmit}
                className="mt-10 space-y-5"
            >
                {step === 1 && (
                    <StepOne
                        data={data}
                        setData={setData}
                        errors={errors}
                        setModalOpen={() => setIsOpen(true)}
                        onCancel={() => setOpenCancelModal(true)}
                    />
                )}

                {step === 2 && (
                    <StepTwo
                        data={data}
                        setData={setData}
                        errors={errors}
                        setModalOpen={() => setIsOpen(true)}
                        onCancel={() => setOpenCancelModal(true)}
                    />
                )}

                {step === 3 && (
                    <StepThree
                        data={data}
                        setData={setData}
                        errors={errors}
                        setModalOpen={() => setIsOpen(true)}
                        onCancel={() => setOpenCancelModal(true)}
                    />
                )}
            </form>

            {isOpen && (
                <ConfirmModal
                    open={isOpen}
                    processing={processing}
                    onClose={() => setIsOpen(false)}
                    onConfirm={() => formRef.current?.requestSubmit()}
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
        </StudentFormLayout>
    );
}
