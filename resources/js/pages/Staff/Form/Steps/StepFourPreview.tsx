import Heading from '@/components/heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircleIcon, RotateCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageProps, StaffFormData } from '../types';

interface StepFourPreviewProps {
    data: StaffFormData;
    staff: PageProps['staff'];
}

export default function StepFourPreview({ data, staff }: StepFourPreviewProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    const previewPicture = useMemo(() => {
        if (!data.picture || typeof data.picture === 'string')
            return '/placeholder.jpg';
        return URL.createObjectURL(data.picture);
    }, [data.picture]);

    const previewSig = useMemo(() => {
        if (!data.e_signature || typeof data.e_signature === 'string')
            return undefined;
        return URL.createObjectURL(data.e_signature);
    }, [data.e_signature]);

    const isComplete = useMemo(
        () =>
            !!(
                data.picture &&
                data.e_signature &&
                data.emergency_fname &&
                data.emergency_lname &&
                data.emergency_phone &&
                data.emergency_address
            ),
        [data],
    );

    const emergencyContactName = [
        data.emergency_fname,
        data.emergency_mname ? `${data.emergency_mname}.` : '',
        data.emergency_lname,
        data.emergency_suffix ? `${data.emergency_suffix}.` : '',
    ]
        .filter(Boolean)
        .join(' ');

    const formattedPhone = data.emergency_phone
        ? `0${data.emergency_phone.toString().slice(0, 3)}-${data.emergency_phone.toString().slice(3)}`
        : '';

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
                                className="col-start-1 row-start-1 overflow-hidden rounded-md border-4 border-primary bg-white"
                                style={{ backfaceVisibility: 'hidden' }}
                            >
                                <div className="mb-3 flex items-center gap-2 border-b border-gray-300 p-3">
                                    <div className="h-10 w-12 animate-pulse rounded-full bg-gray-400 md:h-23 md:w-25" />
                                    <div className="flex w-full flex-col">
                                        <div className="mb-2.5 h-2.5 animate-pulse rounded-full bg-gray-400 md:h-5" />
                                        <div className="h-1.5 w-10/12 animate-pulse rounded-full bg-gray-400 md:h-2.5" />
                                    </div>
                                </div>
                                <div className="p-3 pt-0">
                                    <div className="flex w-full">
                                        <div className="flex grow items-center justify-center">
                                            <div className="flex flex-col items-center text-center">
                                                {previewSig && (
                                                    <img
                                                        src={previewSig}
                                                        className="w-20 md:w-40 lg:w-auto"
                                                        alt="Signature"
                                                    />
                                                )}
                                                <h2 className="text-sm font-extrabold uppercase md:text-xl lg:text-3xl dark:text-black">
                                                    {staff.name}
                                                </h2>
                                                {staff.department && (
                                                    <p className="text-[9px] font-medium capitalize md:text-base lg:text-lg dark:text-black">
                                                        {staff.department}
                                                    </p>
                                                )}
                                                <p className="text-[9px] font-medium capitalize md:text-sm lg:text-base dark:text-black">
                                                    {staff.campus}
                                                </p>
                                            </div>
                                        </div>
                                        <img
                                            src={previewPicture}
                                            className="h-25 w-auto rounded-md border-2 border-green-600 object-cover md:h-50 md:border-4 lg:h-96"
                                            alt="ID photo"
                                        />
                                    </div>
                                </div>
                                <div className="flex border-t border-gray-300">
                                    <h2 className="flex w-8/12 items-center justify-center bg-green-600 text-center text-xl font-extrabold text-white md:text-3xl lg:text-5xl">
                                        STAFF
                                    </h2>
                                    <div className="flex grow items-center justify-center py-2 font-bold text-black">
                                        <div className="flex flex-col items-center">
                                            <p className="text-xs md:text-sm lg:text-base">
                                                DIGITAL ID
                                            </p>
                                            <p className="text-[9px] md:text-xs lg:text-sm">
                                                {staff.digital_id}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Back */}
                            <div
                                className="col-start-1 row-start-1 overflow-hidden rounded-md border-4 border-primary bg-white"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)',
                                }}
                            >
                                <div className="p-3">
                                    <div className="flex w-full gap-3">
                                        <div className="flex grow flex-col justify-between gap-2">
                                            <div className="flex flex-col gap-1">
                                                {[...Array(4)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="h-1 animate-pulse rounded-full bg-gray-400 md:h-2.5 lg:h-4"
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-xs font-medium text-red-500 md:text-sm lg:text-lg">
                                                In case of emergency, please
                                                contact
                                            </p>
                                            <div className="flex flex-col dark:text-black">
                                                <p className="text-base font-bold md:text-2xl">
                                                    {emergencyContactName}
                                                </p>
                                                <p className="text-xs capitalize md:text-sm lg:text-lg">
                                                    {data.emergency_address}
                                                </p>
                                                <p className="text-xs md:text-sm lg:text-lg">
                                                    {formattedPhone}
                                                </p>
                                                {data.blood_type && (
                                                    <p className="text-xs md:text-sm lg:text-lg">
                                                        Blood Type:{' '}
                                                        {data.blood_type}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                {[...Array(4)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="h-1 animate-pulse rounded-full bg-gray-400 md:h-2.5 lg:h-4"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="h-full min-h-40 w-22 animate-pulse rounded-md bg-gray-400 md:h-60 md:w-40 lg:h-96 lg:w-80" />
                                    </div>
                                </div>
                                <h2 className="flex h-12 w-full items-center justify-center border-t bg-green-600 text-center text-xl font-extrabold text-white md:text-3xl lg:text-5xl" />
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsFlipped((prev) => !prev)}
                        className="flex w-full items-center justify-center gap-2 rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                        <RotateCw className="h-4 w-4" />
                        {isFlipped ? 'View Front' : 'View Back'}
                    </button>
                </div>
            )}
        </>
    );
}
