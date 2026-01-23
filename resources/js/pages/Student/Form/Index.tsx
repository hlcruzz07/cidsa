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
import StepOne from './Steps/StepOne';
import StepThree from './Steps/StepThree';
import StepTwo from './Steps/StepTwo';

export default function Index() {
    const [step, setStep] = useState(1);
    const [isOpen, setIsOpen] = useState(false);
    const formRef = useRef<HTMLFormElement | null>(null);

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
            college: '',
            college_name: '',
            program: '',
            hasMajor: false,
            major: null as string | null,
            picture: null as File | null,
            e_signature: null as File | null,
            confirm_info: false,
            data_privacy: false,
        });

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (processing) return;

        if (step === 1) {
            post(route('validateStepOne'), {
                preserveScroll: true,
                onSuccess: () => setStep((prev) => prev + 1),
                onError: (errors) => {
                    Object.values(errors).forEach((messages) => {
                        if (Array.isArray(messages)) {
                            messages.forEach((message) => {
                                toast.error(message);
                            });
                        } else {
                            toast.error(messages);
                        }
                        setIsOpen(false);
                    });
                },
            });
            return;
        }

        if (step === 2) {
            post(route('validateStepTwo'), {
                preserveScroll: true,
                onSuccess: () => setStep((prev) => prev + 1),
                onError: (errors) => {
                    Object.values(errors).forEach((messages) => {
                        if (Array.isArray(messages)) {
                            messages.forEach((message) => {
                                toast.error(message);
                            });
                        } else {
                            toast.error(messages);
                        }
                    });
                    setIsOpen(false);
                },
            });
            return;
        }

        post(route('student.update'), {
            preserveScroll: true,
            onSuccess: () => {
                clearErrors();
                reset();
            },
            onError: (errors) => {
                Object.values(errors).forEach((messages) => {
                    if (Array.isArray(messages)) {
                        messages.forEach((message) => {
                            toast.error(message);
                        });
                    } else {
                        toast.error(messages);
                    }
                });
                setIsOpen(false);
            },
        });
    };

    const [openCancelModal, setOpenCancelModal] = useState(false);

    return (
        <>
            <StudentFormLayout>
                <CancelModal
                    open={openCancelModal}
                    onClose={() => setOpenCancelModal(false)}
                />

                <div className="relative my-5">
                    <div className="relative border">
                        <Progress
                            value={step === 1 ? 0 : step === 2 ? 50 : 100}
                        />
                    </div>
                    <div className="absolute top-[-12px] left-0 flex w-full justify-between">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge
                                    variant="secondary"
                                    className="bg-green-600 text-sm text-white hover:cursor-default md:text-lg"
                                >
                                    1
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Student Information</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge
                                    variant="secondary"
                                    className={` ${step >= 2 ? 'bg-green-600 text-white' : 'bg-green-200 text-gray-400 dark:bg-green-950'} text-sm hover:cursor-default md:text-lg`}
                                >
                                    2
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Photo & E-Signature Upload</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge
                                    variant="secondary"
                                    className={` ${step === 3 ? 'bg-green-600 text-white' : 'bg-green-200 text-gray-400 dark:bg-green-950'} text-sm hover:cursor-default md:text-lg`}
                                >
                                    3
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>ID Preview & Confirmation</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

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
                        <>
                            <StepThree
                                data={data}
                                setData={setData}
                                errors={errors}
                                setModalOpen={() => setIsOpen(true)}
                                onCancel={() => setOpenCancelModal(true)}
                            />
                        </>
                    )}
                </form>

                <ConfirmModal
                    open={isOpen || processing}
                    onClose={() => setIsOpen(false)}
                    processing={processing}
                    onConfirm={() => {
                        formRef.current?.requestSubmit();
                    }}
                />
            </StudentFormLayout>
        </>
    );
}
