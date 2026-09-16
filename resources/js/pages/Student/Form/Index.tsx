import ThemeButton from '@/components/ThemeButton';
import { useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { StudentProps } from '@/lib/custom-types';
import { campusDirectoryArr } from '@/lib/utils';
import apiService from '@/services/apiService';
import { CheckCheckIcon, ChevronLeft, ChevronRight, XIcon } from 'lucide-react';
import { CancelModal } from './Modal/CancelModal';
import { ConfirmModal } from './Modal/Confirm';
import { SubmissionStatusModal } from './Modal/SubmissionStatusModal';
import { SubmittingModal } from './Modal/SubmittingModal';
import StepOne from './Steps/StepOne';
import StepThree, { StepThreePreview } from './Steps/StepThree';
import StepTwo from './Steps/StepTwo';

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

// The PHP payload only gives us `campus` and `program` (a program *name*,
// not the college it belongs to). The college/major dropdowns in StepOne
// are keyed off campusDirectoryArr, so we reverse-lookup which college
// contains that program to seed `college`, `college_name`, and whether
// the program has majors — otherwise `program` arrives pre-filled but its
// dropdown has no matching `college` to derive its options from.
function resolveCollegeInfoForProgram(campus: string, programName: string) {
    const fallback = { college: '', college_name: '', hasMajor: false };

    if (!campus || !programName) return fallback;

    const collegeArr = campusDirectoryArr.find((c) =>
        c.campus.includes(campus),
    )?.colleges;

    if (!collegeArr) return fallback;

    for (const college of collegeArr) {
        const program = college.programs.find((p) => p.name === programName);

        if (program) {
            return {
                college: college.value,
                college_name: college.name,
                hasMajor: (program.majors?.length ?? 0) > 0,
            };
        }
    }

    return fallback;
}

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

type PageProps = {
    student: StudentProps;
};

type SubmissionStatus = 'none' | 'unprinted' | 'printed';

export default function Index() {
    const { student } = usePage<PageProps>().props;
    const [currentStep, setCurrentStep] = useState(1);
    const [isOpen, setIsOpen] = useState(false);
    const [openCancelModal, setOpenCancelModal] = useState(false);
    const [openSubmittingModal, setOpenSubmittingModal] = useState(false);
    const [progress, setProgress] = useState(0);

    // Result of GET /api/student/status/{id_number}. `null` = not checked yet.
    const [submissionStatus, setSubmissionStatus] =
        useState<SubmissionStatus | null>(null);
    const [existingStudent, setExistingStudent] = useState<StudentProps | null>(
        null,
    );
    // Whether the modal is currently visible. Separate from
    // submissionStatus so we can dismiss it without losing the status
    // itself (still useful for any future UI decisions).
    const [showStatusModal, setShowStatusModal] = useState(false);

    const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const initialCollegeInfo = resolveCollegeInfoForProgram(
        student.campus,
        student.program,
    );

    const {
        data,
        setData,
        processing,
        errors,
        post,
        clearErrors,
        reset,
        setError,
    } = useForm({
        type: '' as 'new' | 'replacement',
        id_number: student.id_number,
        first_name: student.first_name,
        middle_init: student.middle_init,
        last_name: student.last_name,
        suffix: student.suffix,
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
        campus: student.campus,
        college: initialCollegeInfo.college,
        college_name: initialCollegeInfo.college_name,
        program: student.program,
        hasMajor: initialCollegeInfo.hasMajor,
        major: null as string | null,
        year: student.year,
        picture: null as File | null,
        e_signature: null as File | null,
        confirm_info: false,
        data_privacy: false,
    });

    // On mount, check whether this student already has a submission and
    // whether it's printed. Drives which modal option (if any) is shown,
    // and prefills type accordingly so create() on the backend doesn't
    // reject the submission.
    useEffect(() => {
        apiService
            .post(
                route('api.student.status', {
                    id_number: student.id_number,
                    last_name: student.last_name,
                }),
            )
            .then((res) => {
                const status: SubmissionStatus = res.data.status;
                setSubmissionStatus(status);

                if (res.data.student) {
                    setExistingStudent(res.data.student);
                }

                if (status === 'unprinted' || status === 'printed') {
                    setShowStatusModal(true);
                } else {
                    // Brand-new student, no prior submission at all.
                    setData('type', 'new');
                }
            })
            .catch((err) =>
                console.error('Failed to check submission status', err),
            );
        // Only run once on mount — id_number doesn't change during this flow.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleUpdateExisting = () => {
        if (existingStudent) {
            const info = resolveCollegeInfoForProgram(
                existingStudent.campus,
                existingStudent.program,
            );

            setData('first_name', existingStudent.first_name);
            setData('middle_init', existingStudent.middle_init);
            setData('last_name', existingStudent.last_name);
            setData('suffix', existingStudent.suffix);

            setData(
                'emergency_first_name',
                existingStudent.emergency_first_name ?? '',
            );
            setData(
                'emergency_middle_init',
                existingStudent.emergency_middle_init ?? null,
            );
            setData(
                'emergency_last_name',
                existingStudent.emergency_last_name ?? '',
            );
            setData(
                'emergency_suffix',
                existingStudent.emergency_suffix ?? null,
            );
            setData('relationship', existingStudent.relationship ?? '');
            setData(
                'contact_number',
                existingStudent.contact_number
                    ? Number(existingStudent.contact_number)
                    : null,
            );

            setData('province', existingStudent.province ?? '');
            setData('city', existingStudent.city ?? '');
            setData('barangay', existingStudent.barangay ?? '');
            setData('zip_code', existingStudent.zip_code ?? '');

            setData('campus', existingStudent.campus);
            setData('college', info.college);
            setData('college_name', info.college_name);
            setData('program', existingStudent.program);
            setData('hasMajor', info.hasMajor);
            setData('major', existingStudent.major ?? null);
            setData('year', existingStudent.year);
        }

        // Unprinted students always resubmit as type=new — create()
        // routes this through updateOrCreate against the same id_number.
        setData('type', 'new');
        setShowStatusModal(false);
    };

    const handleSubmitReplacement = () => {
        setData('type', 'replacement');
        setShowStatusModal(false);
    };

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
    //
    // Always posts to student.create — the controller's updateOrCreate +
    // printed-status guard decides whether this is effectively an insert
    // or an update, so the frontend never needs to pick a different verb
    // or route.
    const submitForm = () => {
        if (processing) return;

        setIsOpen(false);
        setProgress(0);
        setOpenSubmittingModal(true);

        post(route('student.create'), {
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
                                Student ID Request
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <ThemeButton />

            <SubmissionStatusModal
                open={showStatusModal}
                status={
                    submissionStatus === 'unprinted' ||
                    submissionStatus === 'printed'
                        ? submissionStatus
                        : null
                }
                onUpdateExisting={handleUpdateExisting}
                onSubmitReplacement={handleSubmitReplacement}
            />

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

            <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
                <StepIndicator currentStep={currentStep} />

                <div className="space-y-4">
                    {currentStep === 1 && (
                        <StepSection>
                            <StepOne
                                data={data}
                                setData={setData}
                                errors={errors}
                            />
                        </StepSection>
                    )}

                    {currentStep === 2 && (
                        <StepSection>
                            <StepTwo
                                data={data}
                                setData={setData}
                                errors={errors}
                                setError={setError}
                            />
                        </StepSection>
                    )}

                    {currentStep === 3 && (
                        <StepSection>
                            <StepThree
                                data={data}
                                setData={setData}
                                errors={errors}
                            />
                        </StepSection>
                    )}

                    {currentStep === 4 && (
                        <StepSection>
                            <StepThreePreview data={data} />

                            <div className="mt-6 space-y-4">
                                <div className="flex items-start gap-2 rounded-xl border border-border p-3">
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
                                    onClick={() => setOpenCancelModal(true)}
                                    variant="outline"
                                    disabled={processing}
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
