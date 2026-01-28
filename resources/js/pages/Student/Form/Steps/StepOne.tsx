import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { StudentProps } from '@/lib/student-types';
import { campusDirectoryArr, cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import {
    ArrowBigRight,
    AsteriskIcon,
    Check,
    ChevronsUpDown,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface StepOneProps {
    data: FormDataProps;
    setData: (key: string, value: any) => void;
    errors: Record<string, string>;
    setModalOpen: () => void;
    onCancel: () => void;
}
type PageProps = {
    student: StudentProps;
};

export default function StepOne({
    data,
    setData,
    errors,
    setModalOpen,
    onCancel,
}: StepOneProps) {
    const { student } = usePage<PageProps>().props;

    // Popovers
    const [openProvince, setOpenProvince] = useState(false);
    const [openCities, setOpenCities] = useState(false);
    const [openBrgys, setOpenBrgys] = useState(false);

    const [isProgramDisabled, setIsProgramDisabled] = useState(true);
    const [isMajorDisabled, setIsMajorDisabled] = useState(true);

    const collegeArrFiltered = campusDirectoryArr.find((collegeItem) =>
        collegeItem.campus.includes(student.campus),
    )?.colleges;

    const programArrFiltered = collegeArrFiltered?.find(
        (programItem) => programItem.value === data.college,
    )?.programs;

    const majorArrFiltered = programArrFiltered?.find(
        (majorItem) => majorItem.name === data.program,
    )?.majors;

    const [provinces, setProvinces] = useState<ProvinceProp>([]);
    const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(
        null,
    );
    const [selectedProvinceName, setSelectedProvinceName] = useState<
        string | null
    >(null);

    const [cities, setCities] = useState<CitiesProp>([]);
    const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
    const [selectedCityName, setSelectedCityName] = useState<string | null>(
        null,
    );

    const [brgys, setBrgys] = useState<BrgysProp>([]);

    const fetchProvinces = () => {
        fetch('/table_province.json')
            .then((response) => response.json())
            .then((data) => {
                setProvinces(data);
            });
    };

    const fetchCities = (id: number) => {
        fetch('/table_municipality.json')
            .then((response) => response.json())
            .then((data) => {
                setCities(
                    data.filter((c: CitiesApiProp) => c.province_id === id),
                );
            });
    };

    const fetchBrgys = (id: number) => {
        fetch('/table_barangay.json')
            .then((response) => response.json())
            .then((data) => {
                setBrgys(
                    data.filter((b: BrgyApiProp) => b.municipality_id === id),
                );
            });
    };

    useEffect(() => {
        fetchProvinces();
    }, []);

    const resetForCollegeChange = () => {
        setData('program', '');
        setIsProgramDisabled(false);

        setData('major', null);
        setIsMajorDisabled(true);

        setData('section', '');
    };

    const resetForProgramChange = () => {
        setData('major', null);
        setIsMajorDisabled(false);

        setData('section', '');
    };

    const resetForProvinceChange = () => {
        setData('city', '');
        setData('barangay', '');
        setSelectedCityId(null);
    };

    const resetForCityChange = () => {
        setData('barangay', '');
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

    return (
        <>
            <Heading
                title="Personal Information"
                description="Provide your basic personal details as they will appear on your ID."
            />
            <div className="flex flex-col gap-2">
                <Label htmlFor="id_number">Student ID Number</Label>
                <Input
                    type="text"
                    placeholder="Enter ID Number"
                    readOnly
                    value={student.id_number}
                    maxLength={25}
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
                        maxLength={25}
                        readOnly
                    />
                </div>
                <div className="col-span-auto flex w-full flex-col gap-2">
                    <Label htmlFor="middle_init">M.I.</Label>
                    <Input
                        type="text"
                        id="middle_init"
                        value={student.middle_init ?? ''}
                        readOnly
                    />
                </div>
                <div className="col-span-4 flex w-full grow flex-col gap-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                        type="text"
                        id="last_name"
                        readOnly
                        value={student.last_name}
                    />
                </div>
                <div className="col-span-4 flex flex-col gap-2 md:col-span-3">
                    <Label htmlFor="suffix">Suffix</Label>
                    <Input readOnly type="text" value={student.suffix ?? ''} />
                </div>
            </div>
            <Heading
                title="College & Program Information"
                description="Select your college, program, and major to proceed."
            />
            <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                    <Label>Campus</Label>
                    <Input type="text" readOnly value={student.campus} />
                </div>
                <div className="flex flex-col gap-2">
                    <Label>
                        College
                        <AsteriskIcon size={12} color="red" />
                    </Label>
                    <Select
                        value={
                            data.college && data.college_name
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
            <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="zip_code">
                            Section
                            <AsteriskIcon size={12} color="red" />
                        </Label>
                        <span className="text-xs text-muted-foreground">
                            (ex: A, B, C, D, A1, A2, etc.)
                        </span>
                    </div>
                    <Input
                        type="text"
                        maxLength={data.college === 'CIT' ? 2 : 1}
                        disabled={data.college === ''}
                        placeholder="Enter Section"
                        value={data.section}
                        onChange={(e) => {
                            setData('section', e.target.value.toUpperCase());
                        }}
                    />
                    <InputError message={errors.section} />
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
            </div>

            <Heading
                title="In-Case of Emergency Contact Information"
                description="Enter the details of a person we can contact during emergencies."
            />
            <div className="grid gap-3 md:grid-cols-12">
                <div className="col-span-4 flex w-full grow flex-col gap-2">
                    <Label htmlFor="emergency_first_name">
                        Emergency First Name{' '}
                        <AsteriskIcon size={12} color="red" />
                    </Label>
                    <Input
                        type="text"
                        name="emergency_first_name"
                        id="emergency_first_name"
                        placeholder="Enter First Name"
                        value={data.emergency_first_name}
                        maxLength={25}
                        onChange={(e) => {
                            setData(
                                'emergency_first_name',
                                e.target.value.toUpperCase(),
                            );
                        }}
                    />
                    <InputError message={errors.emergency_first_name} />
                </div>
                <div className="col-span-auto flex w-full flex-col gap-2">
                    <Label htmlFor="emergency_middle_init">M.I.</Label>
                    <Input
                        type="text"
                        name="emergency_middle_init"
                        id="emergency_middle_init"
                        placeholder="Enter Middle Initial"
                        value={data.emergency_middle_init ?? ''}
                        onInput={(e) => {
                            const v = e.currentTarget.value.toUpperCase();
                            e.currentTarget.value = v.slice(0, 1);
                        }}
                        onChange={(e) =>
                            setData(
                                'emergency_middle_init',

                                e.currentTarget.value === ''
                                    ? null
                                    : e.currentTarget.value.toUpperCase(),
                            )
                        }
                    />
                    <InputError message={errors.emergency_middle_init} />
                </div>
                <div className="col-span-4 flex w-full grow flex-col gap-2">
                    <Label htmlFor="emergency_last_name">
                        Emergency Last Name
                        <AsteriskIcon size={12} color="red" />
                    </Label>
                    <Input
                        type="text"
                        name="emergency_last_name"
                        id="emergency_last_name"
                        placeholder="Enter Last Name"
                        value={data.emergency_last_name}
                        maxLength={25}
                        onChange={(e) => {
                            setData(
                                'emergency_last_name',
                                e.target.value.toUpperCase(),
                            );
                        }}
                    />
                    <InputError message={errors.emergency_last_name} />
                </div>
                <div className="col-span-4 flex flex-col gap-2 md:col-span-3">
                    <Label htmlFor="emergency_suffix">Suffix</Label>
                    <Select
                        value={data.emergency_suffix ?? ''}
                        onValueChange={(value) => {
                            if (value === 'None') {
                                setData('emergency_suffix', null);
                                return;
                            }
                            setData('emergency_suffix', value);
                        }}
                    >
                        <SelectTrigger className="">
                            <SelectValue placeholder="Choose an option" />
                        </SelectTrigger>
                        <SelectContent className="w-full md:w-10">
                            <SelectGroup>
                                {[
                                    'JR',
                                    'SR',
                                    'II',
                                    'III',
                                    'IV',
                                    'V',
                                    'None',
                                ].map((item, key) => (
                                    <SelectItem key={key} value={item}>
                                        {item}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <InputError message={errors.emergency_suffix} />
                </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                    <Label>
                        Relationship
                        <AsteriskIcon size={12} color="red" />
                    </Label>
                    <Select
                        value={data.relationship}
                        onValueChange={(value) =>
                            setData('relationship', value)
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose an option" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {[
                                    'Father',
                                    'Mother',
                                    'Brother',
                                    'Sister',
                                    'Uncle',
                                    'Aunt',
                                    'Cousin',
                                    'Spouse',
                                ].map((relation, key) => (
                                    <SelectItem key={key} value={relation}>
                                        {relation}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <InputError message={errors.relationship} />
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="contact_number">
                            Contact Number
                            <AsteriskIcon size={12} color="red" />
                        </Label>
                        <span className="text-xs text-muted-foreground">
                            (ex: 9123456789)
                        </span>
                    </div>
                    <div className="relative">
                        <span className="absolute left-2 flex h-full items-center justify-center text-sm">
                            +63
                        </span>
                        <Input
                            type="number"
                            name="contact_number"
                            id="contact_number"
                            placeholder="Enter Contact Number"
                            className="ps-9"
                            value={data.contact_number?.toString() ?? ''}
                            onInput={(e) => {
                                if (e.currentTarget.value.length > 10) {
                                    e.currentTarget.value =
                                        e.currentTarget.value.slice(0, 10);
                                }

                                setData(
                                    'contact_number',
                                    e.currentTarget.value
                                        ? Number(e.currentTarget.value)
                                        : null,
                                );
                            }}
                        />
                    </div>
                    <InputError message={errors.contact_number} />
                </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                    <Label>
                        Province
                        <AsteriskIcon size={12} color="red" />
                    </Label>

                    <Popover open={openProvince} onOpenChange={setOpenProvince}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openProvince}
                                className="justify-between"
                            >
                                {provinces.length > 0 && selectedProvinceName
                                    ? selectedProvinceName
                                    : 'Choose an option'}
                                <ChevronsUpDown className="opacity-50" />
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent className="p-0" align="start">
                            <Command>
                                <CommandInput
                                    placeholder="Search province..."
                                    className="h-9"
                                />
                                <CommandList>
                                    <CommandEmpty>
                                        No province found.
                                    </CommandEmpty>

                                    <CommandGroup>
                                        {provinces.map((p, index) => (
                                            <CommandItem
                                                key={index}
                                                value={p.province_name}
                                                onSelect={() => {
                                                    setData(
                                                        'province',
                                                        p.province_name,
                                                    );
                                                    setOpenProvince(false);
                                                    setSelectedProvinceId(
                                                        p.province_id,
                                                    );
                                                    setSelectedProvinceName(
                                                        p.province_name,
                                                    );
                                                    resetForProvinceChange();
                                                    fetchCities(p.province_id);
                                                }}
                                            >
                                                {p.province_name}

                                                <Check
                                                    className={cn(
                                                        'ml-auto',
                                                        p.province_id ===
                                                            selectedProvinceId
                                                            ? 'opacity-100'
                                                            : 'opacity-0',
                                                    )}
                                                />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    <InputError message={errors.province} />
                </div>

                <div className="flex flex-col gap-2">
                    <Label>
                        City / Municipality
                        <AsteriskIcon size={12} color="red" />
                    </Label>

                    <Popover open={openCities} onOpenChange={setOpenCities}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openCities}
                                className="justify-between"
                                disabled={selectedProvinceId === null}
                            >
                                {cities.length > 0 && selectedCityId
                                    ? selectedCityName
                                    : 'Choose an option'}
                                <ChevronsUpDown className="opacity-50" />
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent className="p-0" align="start">
                            <Command>
                                <CommandInput
                                    placeholder="Search cities/municipalities..."
                                    className="h-9"
                                />
                                <CommandList>
                                    <CommandEmpty>
                                        No city/municipality found.
                                    </CommandEmpty>

                                    <CommandGroup>
                                        {cities.map((c, index) => (
                                            <CommandItem
                                                key={index}
                                                value={c.municipality_name}
                                                onSelect={() => {
                                                    setData(
                                                        'city',
                                                        c.municipality_name,
                                                    );
                                                    setSelectedCityId(
                                                        c.municipality_id,
                                                    );

                                                    setSelectedCityName(
                                                        c.municipality_name,
                                                    );
                                                    fetchBrgys(
                                                        c.municipality_id,
                                                    );
                                                    setOpenCities(false);
                                                    resetForCityChange();
                                                }}
                                            >
                                                {c.municipality_name}

                                                <Check
                                                    className={cn(
                                                        'ml-auto',
                                                        c.municipality_id ===
                                                            selectedCityId
                                                            ? 'opacity-100'
                                                            : 'opacity-0',
                                                    )}
                                                />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    <InputError message={errors.cities} />
                </div>

                <div className="flex flex-col gap-2">
                    <Label>
                        Barangay
                        <AsteriskIcon size={12} color="red" />
                    </Label>

                    <Popover open={openBrgys} onOpenChange={setOpenBrgys}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openBrgys}
                                className="justify-between"
                                disabled={selectedCityId === null}
                            >
                                {brgys.length > 0 && data.barangay
                                    ? data.barangay
                                    : 'Choose an option'}
                                <ChevronsUpDown className="opacity-50" />
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent className="p-0" align="start">
                            <Command>
                                <CommandInput
                                    placeholder="Search barangays..."
                                    className="h-9"
                                />
                                <CommandList>
                                    <CommandEmpty>
                                        No barangays found.
                                    </CommandEmpty>

                                    <CommandGroup>
                                        {brgys.map((b, index) => (
                                            <CommandItem
                                                key={index}
                                                value={b.barangay_name}
                                                onSelect={() => {
                                                    setData(
                                                        'barangay',
                                                        b.barangay_name,
                                                    );
                                                    setOpenBrgys(false);
                                                }}
                                            >
                                                {b.barangay_name}

                                                <Check
                                                    className={cn(
                                                        'ml-auto',
                                                        b.barangay_name ===
                                                            data.barangay
                                                            ? 'opacity-100'
                                                            : 'opacity-0',
                                                    )}
                                                />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    <InputError message={errors.barangay} />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="zip_code">
                            Zip Code
                            <AsteriskIcon size={12} color="red" />
                        </Label>
                        <span className="text-xs text-muted-foreground">
                            (ex: 6115)
                        </span>
                    </div>
                    <Input
                        type="number"
                        name="zip_code"
                        id="zip_code"
                        value={data.zip_code}
                        min={0}
                        placeholder="Enter Zip Code"
                        onInput={(e) => {
                            if (e.currentTarget.value.length > 4) {
                                e.currentTarget.value =
                                    e.currentTarget.value.slice(0, 4);
                            }
                        }}
                        onChange={(e) => setData('zip_code', e.target.value)}
                    />

                    <InputError message={errors.zip_code} />
                </div>
            </div>

            <div className="flex items-center justify-end">
                <div className="space-x-3">
                    <Button
                        type="button"
                        onClick={onCancel}
                        className="ml-auto text-center"
                        size="lg"
                        variant="outline"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={setModalOpen}
                        className="ml-auto text-center"
                        size="lg"
                    >
                        Next
                        <ArrowBigRight />
                    </Button>
                </div>
            </div>
        </>
    );
}
