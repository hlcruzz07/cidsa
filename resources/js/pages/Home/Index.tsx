import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import RegisterLayout from '@/layouts/register-layout';
import { SharedData } from '@/types';
import { useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { ReplacementModal } from './ReplacementModal';
import StepOne from './StepOne';
import StepThree from './StepThree';
import StepTwo from './StepTwo';
import Success from './Success';

export default function Index() {
    const { auth } = usePage<SharedData>().props;
    const [step, setStep] = useState(1);
    const [isShow, setIsShow] = useState(false);

    const { data, setData, processing, errors, post, clearErrors, reset } =
        useForm({
            id_type: '',
            id_number: '',
            affidavit_img: null as File | null,
            receipt_img: null as File | null,
            first_name: '',
            middle_init: null as string | null,
            last_name: '',
            suffix: null as string | null,
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
            year_level: null as number | null,
            section: '',
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
                },
            });
            return;
        }

        post(route('register.student'), {
            preserveScroll: true,
            onSuccess: () => {
                clearErrors();
                reset();
                setStep((prev) => prev + 1);
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
            },
        });
    };

    const downloadExcel = async () => {
        const response = await fetch('/download-excel');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'students.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    return (
        <>
            <ReplacementModal
                isOpen={isShow}
                onClose={() => setIsShow(false)}
            />

            {step <= 3 && (
                <RegisterLayout>
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
                        onSubmit={handleFormSubmit}
                        className="mt-10 space-y-5"
                    >
                        <Button type="button" onClick={downloadExcel}>
                            Download
                        </Button>
                        {step === 1 && (
                            <StepOne
                                data={data}
                                setData={setData}
                                processing={processing}
                                errors={errors}
                                onShowReplacementModal={() =>
                                    setIsShow(
                                        localStorage.getItem(
                                            'skipReplacementModal',
                                        ) !== 'true',
                                    )
                                }
                            />
                        )}

                        {step === 2 && (
                            <StepTwo
                                data={data}
                                setData={setData}
                                processing={processing}
                                errors={errors}
                                onBackStep={() => setStep(1)}
                            />
                        )}

                        {step === 3 && (
                            <>
                                <StepThree
                                    data={data}
                                    setData={setData}
                                    processing={processing}
                                    errors={errors}
                                    onBackStep={() =>
                                        setStep((prev) => prev - 1)
                                    }
                                />
                            </>
                        )}
                    </form>
                </RegisterLayout>
            )}
            {step > 3 && (
                <>
                    <Success />
                </>
            )}
        </>
    );
}
