import Heading from '@/components/heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StudentProps } from '@/lib/custom-types';
import { usePage } from '@inertiajs/react';
import { AlertCircleIcon, RotateCw } from 'lucide-react';
import { useMemo, useState } from 'react';

interface StepTwoProps {
    data: {
        emergency_first_name: string;
        emergency_middle_init: string | null;
        emergency_last_name: string;
        emergency_suffix: string | null;
        relationship: string;
        contact_number: number | null;
        province: string;
        city: string;
        barangay: string;
        zip_code: string;
        college: string;
        college_name: string;
        program: string;
        hasMajor: boolean;
        major: string | null;
        picture: File | null;
        e_signature: File | null;
        data_privacy: boolean;
        confirm_info: boolean;
    };
    setData: (key: string, value: any) => void;
    errors: Record<string, string>;
}

type PageProps = {
    student: StudentProps;
};

export default function StepThree({ data, setData, errors }: StepTwoProps) {
    const { student } = usePage<PageProps>().props;
    const [isFlipped, setIsFlipped] = useState(false);

    const previewPicture = useMemo(() => {
        if (!data.picture) return '/placeholder.jpg';
        return URL.createObjectURL(data.picture);
    }, [data.picture]);

    const previewSig = useMemo(() => {
        if (!data.e_signature) return;
        return URL.createObjectURL(data.e_signature);
    }, [data.e_signature]);

    const isComplete = useMemo(() => {
        return (
            (data.picture && data.e_signature && data.college_name) ||
            data.program ||
            (data.emergency_first_name &&
                data.emergency_last_name &&
                data.relationship &&
                data.contact_number &&
                data.province &&
                data.city &&
                data.barangay &&
                data.zip_code &&
                data.confirm_info &&
                data.data_privacy)
        );
    }, [
        data.picture,
        data.e_signature,
        data.college_name,
        data.program,
        data.emergency_first_name,
        data.emergency_last_name,
        data.relationship,
        data.contact_number,
        data.province,
        data.city,
        data.barangay,
        data.zip_code,
        data.confirm_info,
        data.data_privacy,
    ]);

    return (
        <>
            {isComplete && (
                <div className="space-y-5">
                    <Heading
                        title="Preview & Confirmation"
                        description="Review all the information you entered and verify that your photo, signature, and personal details are correct before submission."
                    />

                    <Alert variant="destructive">
                        <AlertCircleIcon />
                        <AlertTitle>
                            <strong>Important:</strong> This preview is a
                            system-generated layout and{' '}
                            <strong>NOT the official CHMSU ID design.</strong>
                        </AlertTitle>
                        <AlertDescription>
                            Its purpose is solely to help you verify your
                            information before final submission.
                        </AlertDescription>
                    </Alert>

                    <div style={{ perspective: '1500px' }}>
                        <div
                            className="grid grid-cols-1 grid-rows-1 transition-transform duration-700"
                            style={{
                                transformStyle: 'preserve-3d',
                                transform: isFlipped
                                    ? 'rotateY(180deg)'
                                    : 'rotateY(0deg)',
                            }}
                        >
                            {/* Front */}
                            <div
                                className="col-start-1 row-start-1 overflow-hidden rounded-md border-4 border-[var(--main-color)] bg-white"
                                style={{ backfaceVisibility: 'hidden' }}
                            >
                                <div className="mb-3 flex items-center gap-2 border-b border-gray-300 p-3">
                                    <div className="h-10 w-12 animate-pulse rounded-full bg-gray-400 md:h-23 md:w-25"></div>
                                    <div className="flex w-full flex-col">
                                        <div className="mb-2.5 h-2.5 animate-pulse rounded-full bg-gray-400 md:h-5"></div>
                                        <div className="h-1.5 w-10/12 animate-pulse rounded-full bg-gray-400 md:h-2.5"></div>
                                    </div>
                                </div>

                                <div className="p-3 pt-0">
                                    <div className="flex w-full">
                                        <div className="flex grow items-center justify-center">
                                            <div className="flex flex-col items-center text-center">
                                                <img
                                                    src={previewSig}
                                                    className="lg::w-auto w-20 md:w-40"
                                                />
                                                <h1 className="text-sm font-extrabold uppercase md:text-xl lg:text-3xl dark:text-black">
                                                    {`${student.first_name} ${student.middle_init ? student.middle_init + '.' : ''} ${student.last_name} ${student.suffix ? student.suffix + '.' : ''}`}
                                                </h1>
                                                <h1 className="capitalized text-[9px] font-medium md:text-base lg:text-lg dark:text-black">
                                                    {data.program}
                                                </h1>
                                                <h1 className="capitalized text-[9px] font-medium md:text-sm lg:text-base dark:text-black">
                                                    {data.college_name}
                                                </h1>
                                            </div>
                                        </div>
                                        <img
                                            src={previewPicture}
                                            className="h-25 w-auto rounded-md border-2 border-green-600 object-cover md:h-50 md:border-4 lg:h-96"
                                            alt=""
                                        />
                                    </div>
                                </div>
                                <div className="flex border-t border-gray-300">
                                    <h1 className="flex w-8/12 items-center justify-center bg-green-600 text-center text-xl font-extrabold text-white md:text-3xl lg:text-5xl">
                                        STUDENT
                                    </h1>
                                    <div className="flex grow items-center justify-center py-2 font-bold text-black">
                                        <div className="flex flex-col items-center">
                                            <h1 className="text-xs md:text-sm lg:text-base">
                                                ID NUMBER
                                            </h1>
                                            <h1 className="text-[9px] md:text-xs lg:text-sm">
                                                {student.id_number}
                                            </h1>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Back */}
                            <div
                                className="col-start-1 row-start-1 overflow-hidden rounded-md border-4 border-[var(--main-color)] bg-white"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)',
                                }}
                            >
                                <div className="p-3">
                                    <div className="flex w-full gap-3">
                                        <div className="flex grow flex-col justify-between gap-2">
                                            <div className="flex flex-col gap-1">
                                                <div className="h-1 animate-pulse rounded-full bg-gray-400 md:h-2.5 lg:h-4"></div>
                                                <div className="h-1 animate-pulse rounded-full bg-gray-400 md:h-2.5 lg:h-4"></div>
                                                <div className="h-1 animate-pulse rounded-full bg-gray-400 md:h-2.5 lg:h-4"></div>
                                                <div className="h-1 animate-pulse rounded-full bg-gray-400 md:h-2.5 lg:h-4"></div>
                                            </div>
                                            <h1 className="text-xs font-medium text-red-500 md:text-sm lg:text-lg">
                                                In case of emergency, please
                                                contact
                                            </h1>
                                            <div className="flex flex-col dark:text-black">
                                                <p className="text-base font-bold md:text-2xl">
                                                    {[
                                                        data.emergency_first_name,
                                                        data.emergency_middle_init
                                                            ? data.emergency_middle_init +
                                                              '.'
                                                            : '',
                                                        data.emergency_last_name,
                                                        data.emergency_suffix
                                                            ? data.emergency_suffix +
                                                              '.'
                                                            : '',
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' ')}
                                                </p>
                                                <p className="text-xs capitalize md:text-sm lg:text-lg">
                                                    Brgy.{' '}
                                                    {[
                                                        data.barangay,
                                                        data.city,
                                                        data.zip_code,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(', ')}
                                                </p>
                                                <p className="text-xs capitalize md:text-sm lg:text-lg">
                                                    {data.province}
                                                </p>
                                                <p className="text-xs capitalize md:text-sm lg:text-lg">
                                                    {`0${data.contact_number?.toString().slice(0, 3)}-${data.contact_number?.toString().slice(3)}`}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="h-1 animate-pulse rounded-full bg-gray-400 md:h-2.5 lg:h-4"></div>
                                                <div className="h-1 animate-pulse rounded-full bg-gray-400 md:h-2.5 lg:h-4"></div>
                                                <div className="h-1 animate-pulse rounded-full bg-gray-400 md:h-2.5 lg:h-4"></div>
                                                <div className="h-1 animate-pulse rounded-full bg-gray-400 md:h-2.5 lg:h-4"></div>
                                            </div>
                                        </div>
                                        <div className="h-full min-h-40 w-22 animate-pulse rounded-md bg-gray-400 md:h-60 md:w-40 lg:h-96 lg:w-80" />
                                    </div>
                                </div>
                                <h1 className="flex h-12 w-full items-center justify-center border-t bg-green-600 text-center text-xl font-extrabold text-white md:text-3xl lg:text-5xl"></h1>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsFlipped((prev) => !prev)}
                        className="flex w-full items-center justify-center gap-2 rounded-md border border-[var(--main-color)] px-4 py-2 text-sm font-medium text-[var(--main-color)] transition-colors hover:bg-[var(--main-color)]/10"
                    >
                        <RotateCw className="h-4 w-4" />
                        {isFlipped ? 'View Front' : 'View Back'}
                    </button>
                </div>
            )}
        </>
    );
}
