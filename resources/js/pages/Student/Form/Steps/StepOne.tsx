import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormDataProps } from '@/lib/form-type';
import { campusDirectoryArr } from '@/lib/utils';
import apiService from '@/services/apiService';
import { AsteriskIcon, LockIcon } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';
import AlertReplacement from '../Modal/AlertReplacement';
import { ReplacementGuide } from '../Modal/ReplacementGuide';

interface StepOneProps {
    data: FormDataProps;
    setData: (key: string, value: any) => void;
    errors: Record<string, string>;
}

// A locked note shown under a dropdown that arrived pre-filled from the
// student's enrollment record, so they understand why it's disabled.
function LockedNote() {
    return (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <LockIcon size={12} />
            Pre-filled from your enrollment record.
        </p>
    );
}

export default function StepOne({ data, setData, errors }: StepOneProps) {
    const [isProgramDisabled, setIsProgramDisabled] = useState(!data.college);
    const [isMajorDisabled, setIsMajorDisabled] = useState(!data.hasMajor);

    // Snapshot, ONCE on mount, which fields already came in with a value
    // from useForm's initial data (campus/program/year straight from the
    // student record, college resolved from program in the parent). Using
    // a lazy useState initializer means this is captured only from the
    // very first render's `data` — later edits to `data` (e.g. a user
    // picking a program) never retroactively lock/unlock a field.
    const [lockedFields] = useState(() => ({
        campus: !!data.campus,
        college: !!data.college,
        program: !!data.program,
        year: !!data.year,
    }));

    const collegeArrFiltered = campusDirectoryArr.find((collegeItem) =>
        collegeItem.campus.includes(data.campus),
    )?.colleges;

    const programArrFiltered = collegeArrFiltered?.find(
        (programItem) => programItem.value === data.college,
    )?.programs;

    const majorArrFiltered = programArrFiltered?.find(
        (majorItem) => majorItem.name === data.program,
    )?.majors;

    const resetForCampusChange = () => {
        setData('college', '');
        setData('college_name', '');

        setData('program', '');
        setIsProgramDisabled(true);

        setData('major', null);
        setIsMajorDisabled(true);
    };

    const resetForCollegeChange = () => {
        setData('program', '');
        setIsProgramDisabled(false);

        setData('major', null);
        setIsMajorDisabled(true);
    };

    const resetForProgramChange = () => {
        setData('major', null);
        setIsMajorDisabled(false);
    };

    const handleProgramChange = (program: string) => {
        const filtered = programArrFiltered?.find(
            (majorItem) => majorItem.name === program,
        )?.majors;

        if (!filtered) {
            setData('hasMajor', false);
            return;
        }

        if (filtered.length > 0) {
            setData('hasMajor', true);
        } else {
            setData('hasMajor', false);
        }
    };

    const [openAlertReplace, setOpenAlertReplace] = useState(false);
    const [replaceData, setReplaceData] = useState<any>(null);
    const [openReplaceGuide, setOpenReplaceGuide] = useState(false);

    const handleCheckHasReplacement = async () => {
        try {
            const response = await apiService.get(
                route('student.check.replacement'),
            );

            if (response.data) {
                // Student already has a pending replacement — show the alert,
                // do NOT open the guide so it doesn't render on top.
                setReplaceData(response.data);

                setOpenAlertReplace(true);
            } else {
                // No existing replacement — show the guide steps instead.
                setOpenReplaceGuide(true);
            }

            console.log(response.data);
        } catch (error) {
            console.error('Error checking if has a replacement', error);
        }
    };

    return (
        <div className="space-y-5">
            <Heading
                title="Personal Information"
                description="Provide your basic personal details as they will appear on your ID."
            />

            {replaceData && (
                <AlertReplacement
                    open={openAlertReplace}
                    setOpen={setOpenAlertReplace}
                    data={replaceData}
                />
            )}

            <ReplacementGuide
                open={openReplaceGuide}
                setOpen={setOpenReplaceGuide}
            />
            <div className="flex flex-col gap-2">
                <Label>
                    ID Type
                    <AsteriskIcon size={12} color="red" />
                </Label>
                <Select
                    value={data.type}
                    disabled={!!data.type}
                    onValueChange={(value) => {
                        if (value === 'new') {
                            setData('type', value);
                            setData('receipt', null);
                            setData('reason', null);
                            return;
                        }

                        setData('type', value);
                        handleCheckHasReplacement();
                    }}
                    name={data.type}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose an option" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {['new', 'replacement'].map((item, key) => (
                                <SelectItem key={key} value={item}>
                                    {item.toUpperCase()}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <InputError message={errors.type} />
            </div>
            {data.type === 'replacement' && (
                <>
                    {data.receipt && (
                        <div className="flex items-center justify-center">
                            <img
                                src={URL.createObjectURL(data.receipt)}
                                alt=""
                                className="size-64 border object-cover"
                            />
                        </div>
                    )}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="receipt">
                            Receipt
                            <AsteriskIcon size={12} color="red" />
                        </Label>

                        <Input
                            id="receipt"
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => {
                                setData('receipt', e.target.files?.[0] ?? null);
                            }}
                        />

                        <InputError message={errors.receipt} />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Reason (optional)</Label>
                        <Textarea
                            value={data.reason ?? ''}
                            onChange={(e) => {
                                if (e.target.value === '') {
                                    setData('reason', null);
                                    return;
                                }
                                setData('reason', e.target.value);
                            }}
                            maxLength={250}
                            placeholder="Enter your reason for replacement"
                        />
                        <InputError message={errors.reason} />
                    </div>
                </>
            )}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="id_number">Student ID Number</Label>
                    <Input
                        type="text"
                        placeholder="Enter ID Number"
                        disabled
                        value={data.id_number}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="first_name">Full Name </Label>
                    <Input
                        type="text"
                        id="first_name"
                        value={[
                            data.first_name,
                            data.middle_init
                                ? data.middle_init + '.'
                                : data.middle_init,
                            data.last_name,
                            data.suffix,
                        ]
                            .filter(Boolean)
                            .join(' ')}
                        disabled
                    />
                </div>
            </div>

            <p className="text-xs text-muted-foreground">
                Kindly check your enrolment form for your ID number to avoid
                data duplication.
            </p>

            <Heading
                title="College & Program Information"
                description="Select your college, program, and major to proceed."
            />
            <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                    <Label>
                        Campus <AsteriskIcon size={12} color="red" />
                    </Label>
                    <Select
                        value={data.campus}
                        onValueChange={(value) => {
                            setData('campus', value);
                            resetForCampusChange();
                        }}
                        disabled={lockedFields.campus}
                    >
                        <SelectTrigger className="">
                            <SelectValue placeholder="Choose an option">
                                {data.campus || 'Choose an option'}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="w-full">
                            <SelectGroup>
                                {[
                                    'Talisay',
                                    'Alijis',
                                    'Fortune Towne',
                                    'Binalbagan',
                                ].map((item, key) => (
                                    <SelectItem key={key} value={item}>
                                        {item}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <InputError message={errors.campus} />
                    {lockedFields.campus && <LockedNote />}
                </div>
                <div className="flex flex-col gap-2">
                    <Label>
                        College <AsteriskIcon size={12} color="red" />
                    </Label>
                    <Select
                        disabled={data.campus === '' || lockedFields.college}
                        value={
                            data.campus && data.college && data.college_name
                                ? JSON.stringify({
                                      value: data.college,
                                      name: data.college_name,
                                  })
                                : undefined
                        }
                        onValueChange={(val) => {
                            const parsed = JSON.parse(val);

                            setData('college', parsed.value);
                            setData('college_name', parsed.name);

                            resetForCollegeChange();
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose an option" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectGroup>
                                {collegeArrFiltered?.map((item, key) => (
                                    <SelectItem
                                        key={key}
                                        value={JSON.stringify({
                                            value: item.value,
                                            name: item.name,
                                        })}
                                    >
                                        {item.value} - {item.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <InputError message={errors.college} />
                    {lockedFields.college && <LockedNote />}
                </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                    <Label>
                        Program
                        <AsteriskIcon size={12} color="red" />
                    </Label>
                    <Select
                        value={data.program}
                        onValueChange={(value) => {
                            setData('program', value);
                            resetForProgramChange();
                            handleProgramChange(value);
                        }}
                        disabled={isProgramDisabled || lockedFields.program}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose an option" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {programArrFiltered?.map((item, key) => (
                                    <SelectItem key={key} value={item.name}>
                                        {item.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <InputError message={errors.program} />
                    {lockedFields.program && <LockedNote />}
                </div>
                <div className="flex flex-col gap-2">
                    <Label>
                        Major{' '}
                        {data.hasMajor ? (
                            <AsteriskIcon size={12} color="red" />
                        ) : (
                            ''
                        )}
                    </Label>
                    <Select
                        value={data.major ?? ''}
                        onValueChange={(value) =>
                            setData('major', value ?? null)
                        }
                        disabled={
                            isMajorDisabled || majorArrFiltered?.length === 0
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose an option" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {majorArrFiltered?.map((item, key) => (
                                    <SelectItem key={key} value={item}>
                                        {item}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <InputError message={errors.major} />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <Label>
                    Year Level
                    <AsteriskIcon size={12} color="red" />
                </Label>
                <Select
                    value={data.year}
                    onValueChange={(value) => {
                        setData('year', value);
                    }}
                    disabled={lockedFields.year}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose an option" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {[
                                '1st Year',
                                '2nd Year',
                                '3rd Year',
                                '4th Year',
                                '5th Year',
                            ].map((item, key) => (
                                <SelectItem key={key} value={item}>
                                    {item}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <InputError message={errors.year} />
                {lockedFields.year && <LockedNote />}
            </div>
        </div>
    );
}
