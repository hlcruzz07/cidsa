import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { StudentProps } from '@/lib/custom-types';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import {
    AlertCircleIcon,
    AsteriskIcon,
    Check,
    ChevronsUpDown,
    RotateCw,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface StepThreeProps {
    data: FormDataProps;
    setData: (key: string, value: unknown) => void;
    errors: Record<string, string>;
}

type PageProps = {
    student: StudentProps;
};

export default function StepThree({ data, setData, errors }: StepThreeProps) {
    const [openProvince, setOpenProvince] = useState(false);
    const [openCities, setOpenCities] = useState(false);
    const [openBrgys, setOpenBrgys] = useState(false);
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

    useEffect(() => {
        fetch('/table_province.json')
            .then((response) => response.json())
            .then(setProvinces);
    }, []);

    const fetchCities = (id: number) => {
        fetch('/table_municipality.json')
            .then((response) => response.json())
            .then((items) =>
                setCities(
                    items.filter(
                        (city: CitiesApiProp) => city.province_id === id,
                    ),
                ),
            );
    };

    const fetchBrgys = (id: number) => {
        fetch('/table_barangay.json')
            .then((response) => response.json())
            .then((items) =>
                setBrgys(
                    items.filter(
                        (barangay: BrgyApiProp) =>
                            barangay.municipality_id === id,
                    ),
                ),
            );
    };

    const resetForProvinceChange = () => {
        setData('city', '');
        setData('barangay', '');
        setSelectedCityId(null);
        setSelectedCityName(null);
        setCities([]);
        setBrgys([]);
    };

    const resetForCityChange = () => setData('barangay', '');

    return (
        <>
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
                        onChange={(e) =>
                            setData(
                                'emergency_first_name',
                                e.target.value.toUpperCase(),
                            )
                        }
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
                            e.currentTarget.value = e.currentTarget.value
                                .toUpperCase()
                                .slice(0, 1);
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
                        Emergency Last Name{' '}
                        <AsteriskIcon size={12} color="red" />
                    </Label>
                    <Input
                        type="text"
                        name="emergency_last_name"
                        id="emergency_last_name"
                        placeholder="Enter Last Name"
                        value={data.emergency_last_name}
                        onChange={(e) =>
                            setData(
                                'emergency_last_name',
                                e.target.value.toUpperCase(),
                            )
                        }
                    />
                    <InputError message={errors.emergency_last_name} />
                </div>
                <div className="col-span-4 flex flex-col gap-2 md:col-span-3">
                    <Label htmlFor="emergency_suffix">Suffix</Label>
                    <Select
                        value={data.emergency_suffix ?? ''}
                        onValueChange={(value) =>
                            setData(
                                'emergency_suffix',
                                value === 'None' ? null : value,
                            )
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Choose an option" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {[
                                    'JR',
                                    'SR',
                                    'II',
                                    'III',
                                    'IV',
                                    'V',
                                    'None',
                                ].map((item) => (
                                    <SelectItem key={item} value={item}>
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
                        Relationship <AsteriskIcon size={12} color="red" />
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
                                    'Grand Father',
                                    'Grand Mother',
                                ].map((relation) => (
                                    <SelectItem key={relation} value={relation}>
                                        {relation}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <InputError message={errors.relationship} />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="contact_number">
                        Contact Number <AsteriskIcon size={12} color="red" />
                    </Label>
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
                                e.currentTarget.value =
                                    e.currentTarget.value.slice(0, 10);
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
                        Province <AsteriskIcon size={12} color="red" />
                    </Label>
                    <Popover open={openProvince} onOpenChange={setOpenProvince}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openProvince}
                                className="justify-between"
                                disabled={provinces.length === 0}
                            >
                                {selectedProvinceName || 'Choose an option'}
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
                                        {provinces.map((province) => (
                                            <CommandItem
                                                key={province.province_id}
                                                value={province.province_name}
                                                onSelect={() => {
                                                    setData(
                                                        'province',
                                                        province.province_name,
                                                    );
                                                    setOpenProvince(false);
                                                    setSelectedProvinceId(
                                                        province.province_id,
                                                    );
                                                    setSelectedProvinceName(
                                                        province.province_name,
                                                    );
                                                    resetForProvinceChange();
                                                    fetchCities(
                                                        province.province_id,
                                                    );
                                                }}
                                            >
                                                {province.province_name}
                                                <Check
                                                    className={cn(
                                                        'ml-auto',
                                                        province.province_id ===
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
                        City / Municipality{' '}
                        <AsteriskIcon size={12} color="red" />
                    </Label>
                    <Popover open={openCities} onOpenChange={setOpenCities}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openCities}
                                className="justify-between"
                                disabled={
                                    selectedProvinceId === null ||
                                    cities.length === 0
                                }
                            >
                                {selectedCityName || 'Choose an option'}
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
                                        {cities.map((city) => (
                                            <CommandItem
                                                key={city.municipality_id}
                                                value={city.municipality_name}
                                                onSelect={() => {
                                                    setData(
                                                        'city',
                                                        city.municipality_name,
                                                    );
                                                    setSelectedCityId(
                                                        city.municipality_id,
                                                    );
                                                    setSelectedCityName(
                                                        city.municipality_name,
                                                    );
                                                    fetchBrgys(
                                                        city.municipality_id,
                                                    );
                                                    setOpenCities(false);
                                                    resetForCityChange();
                                                }}
                                            >
                                                {city.municipality_name}
                                                <Check
                                                    className={cn(
                                                        'ml-auto',
                                                        city.municipality_id ===
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
                        Barangay <AsteriskIcon size={12} color="red" />
                    </Label>
                    <Popover open={openBrgys} onOpenChange={setOpenBrgys}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openBrgys}
                                className="justify-between"
                                disabled={
                                    selectedCityId === null ||
                                    brgys.length === 0
                                }
                            >
                                {data.barangay || 'Choose an option'}
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
                                        {brgys.map((barangay) => (
                                            <CommandItem
                                                key={barangay.barangay_name}
                                                value={barangay.barangay_name}
                                                onSelect={() => {
                                                    setData(
                                                        'barangay',
                                                        barangay.barangay_name,
                                                    );
                                                    setOpenBrgys(false);
                                                }}
                                            >
                                                {barangay.barangay_name}
                                                <Check
                                                    className={cn(
                                                        'ml-auto',
                                                        barangay.barangay_name ===
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
                    <Label htmlFor="zip_code">
                        Zip Code <AsteriskIcon size={12} color="red" />
                    </Label>
                    <Input
                        type="number"
                        name="zip_code"
                        id="zip_code"
                        value={data.zip_code}
                        min={0}
                        placeholder="Enter Zip Code"
                        onInput={(e) => {
                            e.currentTarget.value = e.currentTarget.value.slice(
                                0,
                                4,
                            );
                        }}
                        onChange={(e) => setData('zip_code', e.target.value)}
                    />
                    <InputError message={errors.zip_code} />
                </div>
            </div>
        </>
    );
}

export function StepThreePreview({ data }: { data: FormDataProps }) {
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
        return !!(
            data.picture &&
            data.e_signature &&
            data.college_name &&
            data.program &&
            (!data.hasMajor || data.major) && // only require major if hasMajor is true
            data.emergency_first_name &&
            data.emergency_last_name &&
            data.relationship &&
            data.contact_number &&
            data.province &&
            data.city &&
            data.barangay &&
            data.zip_code
        );
    }, [
        data.picture,
        data.e_signature,
        data.college_name,
        data.program,
        data.hasMajor,
        data.major,
        data.emergency_first_name,
        data.emergency_last_name,
        data.relationship,
        data.contact_number,
        data.province,
        data.city,
        data.barangay,
        data.zip_code,
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
