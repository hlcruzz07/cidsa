import StudentFormLayout from '@/layouts/student-form-layout';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CheckCheckIcon, XIcon } from 'lucide-react';
import { CancelModal } from './Modal/CancelModal';
import { ConfirmModal } from './Modal/Confirm';
import { SubmittingModal } from './Modal/SubmittingModal';
import StepOne from './Steps/StepOne';
import StepThree from './Steps/StepThree';
import StepTwo from './Steps/StepTwo';

export default function Index() {
    const [isOpen, setIsOpen] = useState(false);
    const [openCancelModal, setOpenCancelModal] = useState(false);
    const [openSubmittingModal, setOpenSubmittingModal] = useState(false);
    const [progress, setProgress] = useState(0);

    const formRef = useRef<HTMLFormElement | null>(null);
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

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
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

        // Show all toasts
        [...errorKeys].reverse().forEach((key) => {
            const messages = errors[key];
            if (Array.isArray(messages)) {
                messages.forEach((message) => toast.error(message));
            } else {
                toast.error(messages);
            }
        });

        // Scroll to the first error field
        if (errorKeys.length > 0) {
            const firstErrorKey = errorKeys[0]; // ✅ use original order, not reversed

            // Try name/id first (works for Input fields)
            let element: Element | null =
                document.getElementsByName(firstErrorKey)[0] ||
                document.getElementById(firstErrorKey);

            // Fallback: find the InputError message element rendered near the field
            // This catches Select/Popover/Button-based fields that have no real input
            if (!element) {
                const allInputErrors =
                    document.querySelectorAll('[data-error-for]');
                allInputErrors.forEach((el) => {
                    if (el.getAttribute('data-error-for') === firstErrorKey) {
                        element = el;
                    }
                });
            }

            // Last resort: scroll to the first visible error message text
            if (!element) {
                const errorMessages = document.querySelectorAll(
                    '.text-destructive, [class*="text-red"]',
                );
                if (errorMessages.length > 0) {
                    element = errorMessages[0];
                }
            }

            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
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
            {/* FORM */}
            <form
                ref={formRef}
                onSubmit={handleFormSubmit}
                className="mt-10 space-y-5"
            >
                <StepOne data={data} setData={setData} errors={errors} />

                <StepTwo data={data} setData={setData} errors={errors} />

                <StepThree data={data} setData={setData} errors={errors} />

                <div className="mt-6 space-y-4 rounded-lg border p-4">
                    <h2 className="text-lg font-semibold">
                        Final Confirmation
                    </h2>
                    <div className="mt-4 flex items-start gap-2">
                        <Checkbox
                            id="confirm_info"
                            checked={data.confirm_info || false}
                            onCheckedChange={(checked) => {
                                const value = checked === true;
                                setData('confirm_info', value);
                            }}
                            className="mt-1 accent-green-600"
                        />
                        <Label
                            htmlFor="confirm_info"
                            className="inline-block text-sm leading-normal"
                        >
                            I hereby confirm that all the information I have
                            provided is
                            <span className="font-semibold">
                                true, correct, and complete
                            </span>
                            to the best of my knowledge.
                        </Label>
                    </div>
                    <InputError message={errors.confirm_info} />

                    <div className="mt-4 flex items-start gap-2">
                        <Checkbox
                            id="data_privacy"
                            checked={data.data_privacy || false}
                            onCheckedChange={(checked) => {
                                const value = checked === true;
                                setData('data_privacy', value);
                            }}
                            className="mt-1 accent-green-600"
                        />
                        <Label
                            htmlFor="data_privacy"
                            className="inline-block text-sm leading-normal"
                        >
                            I agree to the processing of my personal information
                            in accordance with{' '}
                            <a
                                href="https://privacy.gov.ph/data-privacy-act/"
                                className="font-semibold underline"
                                target="_blank"
                            >
                                Data Privacy Act of 2012 (RA 10173)
                            </a>{' '}
                            and authorize CHMSU to store and use my data for ID
                            issuance and security access purposes.
                        </Label>
                    </div>

                    <InputError message={errors.data_privacy} />
                </div>

                <div className="flex items-center justify-end">
                    <div className="flex w-full flex-col gap-3 md:w-max md:flex-row">
                        <Button
                            type="button"
                            onClick={() => setOpenCancelModal(true)}
                            variant={'outline'}
                            disabled={processing}
                            className="grow"
                        >
                            Cancel <XIcon />
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="grow"
                        >
                            Submit <CheckCheckIcon />
                        </Button>
                    </div>
                </div>
            </form>
        </StudentFormLayout>
    );
}
