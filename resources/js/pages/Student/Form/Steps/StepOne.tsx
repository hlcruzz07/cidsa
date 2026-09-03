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
import { StudentProps } from '@/lib/custom-types';
import { campusDirectoryArr } from '@/lib/utils';
import apiService from '@/services/apiService';
import { usePage } from '@inertiajs/react';
import { AsteriskIcon } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';
import AlertReplacement from '../Modal/AlertReplacement';
import { ReplacementGuide } from '../Modal/ReplacementGuide';

interface StepOneProps {
    data: FormDataProps;
    setData: (key: string, value: any) => void;
    errors: Record<string, string>;
}
type PageProps = {
    student: StudentProps;
};

export default function StepOne({ data, setData, errors }: StepOneProps) {
    const { student } = usePage<PageProps>().props;

    const [isProgramDisabled, setIsProgramDisabled] = useState(true);
    const [isMajorDisabled, setIsMajorDisabled] = useState(true);

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
        <>
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
            <div className="flex flex-col gap-2">
                <Label htmlFor="id_number">Student ID Number</Label>
                <Input
                    type="text"
                    placeholder="Enter ID Number"
                    disabled
                    value={student.id_number}
                />
                <InputError message={errors.id_number} />
            </div>

            <p className="text-xs text-muted-foreground">
                Kindly check your enrolment form for your ID number to avoid
                data duplication.
            </p>
            <div className="grid gap-3 md:grid-cols-12">
                <div className="col-span-4 flex w-full grow flex-col gap-2">
                    <Label htmlFor="first_name">First Name </Label>
                    <Input
                        type="text"
                        id="first_name"
                        value={student.first_name}
                        disabled
                    />
                </div>
                <div className="col-span-auto flex w-full flex-col gap-2">
                    <Label htmlFor="middle_init">M.I.</Label>
                    <Input
                        type="text"
                        id="middle_init"
                        value={student.middle_init ?? ''}
                        disabled
                    />
                </div>
                <div className="col-span-4 flex w-full grow flex-col gap-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                        type="text"
                        id="last_name"
                        disabled
                        value={student.last_name}
                    />
                </div>
                <div className="col-span-4 flex flex-col gap-2 md:col-span-3">
                    <Label htmlFor="suffix">Suffix</Label>
                    <Input disabled type="text" value={student.suffix ?? ''} />
                </div>
            </div>
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
                </div>
                <div className="flex flex-col gap-2">
                    <Label>
                        College <AsteriskIcon size={12} color="red" />
                    </Label>
                    <Select
                        disabled={data.campus === ''}
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
                        disabled={isProgramDisabled}
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
            </div>
        </>
    );
}
