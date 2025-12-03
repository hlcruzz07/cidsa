import HeadingSmall from '@/components/heading-small';
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
import { Separator } from '@/components/ui/separator';
import { type SharedData } from '@/types';
import { useForm, usePage } from '@inertiajs/react';
import { AsteriskIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;
    const [locations, setLocations] = useState({});
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('');

    //Address
    const [selectedProvince, setSelectedProvince] = useState<string>('');
    const [selectedCity, setSelectedCity] = useState<string>('');

    const [isCityDisabled, setIsCityDisabled] = useState(true);
    const [isBarangayDisabled, setIsBarangayDisabled] = useState(true);

    const [isCollegeDisabled, setIsCollegeDisabled] = useState(true);
    const [isProgramDisabled, setIsProgramDisabled] = useState(true);
    const [isMajorDisabled, setIsMajorDisabled] = useState(true);

    // Selected Handlers

    const resetForCampusChange = () => {
        setData('college', '');
        setIsCollegeDisabled(true);

        setData('program', '');
        setIsProgramDisabled(true);

        setData('major', null);
        setIsMajorDisabled(true);
    };

    const resetForCollegeChange = () => {
        setData('program', '');
        setIsProgramDisabled(true);

        setData('major', null);
        setIsMajorDisabled(true);
    };

    const resetForProgramChange = () => {
        setData('major', null);
        setIsMajorDisabled(true);
    };

    const fetchLocations = () => {
        fetch('/ph-location.json')
            .then((response) => response.json())
            .then((data) => {
                setLocations(data);
            });
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    const relationshipArr = [
        'Father',
        'Mother',
        'Brother',
        'Sister',
        'Uncle',
        'Aunt',
        'Cousin',
        'Spouse',
    ];

    const provinces = Object.values(locations)
        .flatMap((region: any) =>
            Object.keys(region.province_list).map((province) => ({
                value: province,
                label: province,
            })),
        )
        .sort((a, b) => a.label.localeCompare(b.label));

    const cities = selectedProvince
        ? Object.values(locations)
              .flatMap((region: any) =>
                  Object.entries(region.province_list)
                      .filter(([provName]) => provName === selectedProvince)
                      .flatMap(([_, province]: any) =>
                          Object.keys(province.municipality_list),
                      ),
              )
              .sort((a, b) => a.localeCompare(b))
        : [];

    const barangays = selectedCity
        ? Object.values(locations)
              .flatMap((region: any) =>
                  Object.values(region.province_list).flatMap((province: any) =>
                      Object.entries(province.municipality_list)
                          .filter(
                              ([municipalityName]) =>
                                  municipalityName === selectedCity,
                          )
                          .flatMap(
                              ([_, municipality]: any) =>
                                  municipality.barangay_list,
                          ),
                  ),
              )
              .sort((a, b) => a.localeCompare(b))
        : [];

    const campusDirectoryArr = [
        {
            campus: 'Talisay',
            colleges: [
                {
                    value: 'CAS',
                    name: 'College of Arts & Sciences',
                    programs: [
                        {
                            name: 'Bachelor of Arts in English Language',
                            majors: [],
                        },
                        {
                            name: 'Bachelor of Arts in Social Science',
                            majors: [],
                        },
                        {
                            name: 'Bachelor of Public Administration',
                            majors: [],
                        },
                        {
                            name: 'Bachelor of Science in Applied Mathematics',
                            majors: [],
                        },
                        {
                            name: 'Bachelor of Science in Psychology',
                            majors: [],
                        },
                        {
                            name: 'Master in Public Administration',
                            majors: [
                                'Human Resource Management',
                                'Urban Planning and Management',
                            ],
                        },
                        {
                            name: 'Doctor in Public Administration',
                            majors: ['Professional Track'],
                        },
                    ],
                },
                {
                    value: 'CBMA',
                    name: 'College of Business Management & Accountancy',
                    programs: [
                        {
                            name: 'Bachelor of Science in Hospitality Management',
                            majors: [],
                        },
                    ],
                },
                {
                    value: 'CCS',
                    name: 'College of Computer Studies',
                    programs: [
                        {
                            name: 'Bachelor of Science in Information Systems',
                            majors: [],
                        },
                    ],
                },
                {
                    value: 'COED',
                    name: 'College of Education',
                    programs: [
                        {
                            name: 'Bachelor of Early Childhood Education',
                            majors: [],
                        },
                        {
                            name: 'Bachelor of Elementary Education',
                            majors: ['General Education'],
                        },
                        { name: 'Bachelor of Physical Education', majors: [] },
                        {
                            name: 'Bachelor of Secondary Education',
                            majors: [
                                'English',
                                'Filipino',
                                'Mathematics',
                                'Science',
                            ],
                        },
                        {
                            name: 'Bachelor of Special Needs Education',
                            majors: ['Generalist'],
                        },
                        {
                            name: 'Bachelor of Technology and Livelihood Education',
                            majors: ['Home Economics', 'Industrial'],
                        },
                        {
                            name: 'Teacher Certificate Program (Supplementals)',
                            majors: [],
                        },
                        {
                            name: 'Master of Arts in Education',
                            majors: ['Educational Management'],
                        },
                        {
                            name: 'Master of Arts in Education (Academic Track)',
                            majors: [
                                'Educational Management',
                                'English',
                                'General Science',
                                'Mathematics',
                                'Physical Education',
                                'Technology and Livelihood Education',
                            ],
                        },
                        {
                            name: 'Doctor of Education',
                            majors: ['Educational Management'],
                        },
                    ],
                },
                {
                    value: 'COE',
                    name: 'College of Engineering',
                    programs: [
                        {
                            name: 'Bachelor of Science in Civil Engineering',
                            majors: [],
                        },
                    ],
                },
                {
                    value: 'CIT',
                    name: 'College of Industrial Technology',
                    programs: [
                        {
                            name: 'Bachelor of Industrial Technology',
                            majors: [
                                'Apparel & Fashion Technology',
                                'Architectural Drafting Technology',
                                'Automotive Technology',
                                'Culinary Technology',
                                'Electrical Technology',
                                'Electronics Technology',
                                'HVACR Technology',
                                'Mechanical Technology',
                            ],
                        },
                        {
                            name: 'Bachelor of Science in Industrial Technology',
                            majors: [
                                'Apparel & Fashion Technology',
                                'Architectural Drafting Technology',
                                'Automotive Technology',
                                'Culinary Technology',
                                'Electrical Technology',
                                'Electronics Technology',
                                'HVACR Technology',
                                'Mechanical Technology',
                            ],
                        },
                        { name: 'Master in Technology Management', majors: [] },
                        {
                            name: 'Doctor in Philosophy in Technology Management',
                            majors: [],
                        },
                    ],
                },
            ],
        },

        {
            campus: 'Binalbagan',
            colleges: [
                {
                    value: 'CBMA',
                    name: 'College of Business Management & Accountancy',
                    programs: [
                        {
                            name: 'Bachelor of Science in Hospitality Management',
                            majors: ['Financial Management'],
                        },
                    ],
                },
                {
                    value: 'CCS',
                    name: 'College of Computer Studies',
                    programs: [
                        {
                            name: 'Bachelor of Science in Information Technology',
                            majors: [],
                        },
                    ],
                },
                {
                    value: 'CCJ',
                    name: 'College of Criminal Justice',
                    programs: [
                        {
                            name: 'Bachelor of Science in Criminology',
                            majors: [],
                        },
                    ],
                },
                {
                    value: 'COED',
                    name: 'College of Education',
                    programs: [
                        {
                            name: 'Bachelor of Elementary Education',
                            majors: ['General Education'],
                        },
                        {
                            name: 'Bachelor of Secondary Education',
                            majors: ['Science'],
                        },
                        {
                            name: 'Bachelor of Technology and Livelihood Education',
                            majors: ['Home Economics'],
                        },
                    ],
                },
                {
                    value: 'COF',
                    name: 'College of Fisheries',
                    programs: [
                        {
                            name: 'Bachelor of Science in Fisheries',
                            majors: [],
                        },
                    ],
                },
            ],
        },

        {
            campus: 'Fortune Towne',
            colleges: [
                {
                    value: 'CBMA',
                    name: 'College of Business Management & Accountancy',
                    programs: [
                        {
                            name: 'Bachelor of Science in Accountancy',
                            majors: [],
                        },
                        {
                            name: 'Bachelor of Science in Business Administration',
                            majors: ['Financial Management'],
                        },
                        {
                            name: 'Bachelor of Science in Entrepreneurship',
                            majors: [],
                        },
                        {
                            name: 'Bachelor of Science in Management Accounting',
                            majors: [],
                        },
                        {
                            name: 'Bachelor of Science in Office Administration',
                            majors: [],
                        },
                        {
                            name: 'Master of Business Administration',
                            majors: [],
                        },
                        { name: 'Master of Public Administration', majors: [] },
                    ],
                },
                {
                    value: 'CCS',
                    name: 'College of Computer Studies',
                    programs: [
                        {
                            name: 'Bachelor of Science in Information Systems',
                            majors: [],
                        },
                    ],
                },
            ],
        },

        {
            campus: 'Alijis',
            colleges: [
                {
                    value: 'CCS',
                    name: 'College of Computer Studies',
                    programs: [
                        {
                            name: 'Bachelor of Science in Information Systems',
                            majors: [],
                        },
                        {
                            name: 'Bachelor of Science in Information Technology',
                            majors: [],
                        },
                    ],
                },
                {
                    value: 'COE',
                    name: 'College of Engineering',
                    programs: [
                        {
                            name: 'Bachelor of Science in Computer Engineering',
                            majors: [],
                        },
                        {
                            name: 'Bachelor of Science in Electronics Engineering',
                            majors: [],
                        },
                    ],
                },
                {
                    value: 'CIT',
                    name: 'College of Industrial Technology',
                    programs: [
                        {
                            name: 'Bachelor of Industrial Technology',
                            majors: [
                                'Architectural Drafting Technology',
                                'Automotive Technology',
                                'Computer Technology',
                                'Culinary Technology',
                                'Electrical Technology',
                                'Electronics Technology',
                                'Mechanical Technology',
                            ],
                        },
                        {
                            name: 'Bachelor of Science in Industrial Technology',
                            majors: [
                                'Architectural Drafting Technology',
                                'Automotive Technology',
                                'Computer Technology',
                                'Culinary Technology',
                                'Electrical Technology',
                                'Electronics Technology',
                                'Mechanical Technology',
                            ],
                        },
                    ],
                },
                {
                    value: 'COED',
                    name: 'College of Education',
                    programs: [
                        {
                            name: 'Bachelor of Technical Vocational Teacher Education',
                            majors: [
                                'Electrical Technology',
                                'Electronics Technology',
                            ],
                        },
                    ],
                },
            ],
        },
    ];

    const resetForProvinceChange = () => {
        setData('city', '');
        setData('barangay', '');
        setIsBarangayDisabled(true);
        setSelectedCity('');
    };
    const resetForCityChange = () => {
        setData('barangay', '');
    };

    const { data, setData, processing, reset, clearErrors, errors } = useForm({
        id_type: '',
        id_number: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        emergency_first_name: '',
        emergency_middle_name: '',
        emergency_last_name: '',
        relationship: '',
        contact_number: '',
        province: '',
        city: '',
        barangay: '',
        zip_code: '',
        campus: '',
        college: '',
        program: '',
        major: null as string | null,
        year_level: '',
        section: '',
    });

    const collegeArrFiltered = campusDirectoryArr.find((collegeItem) =>
        collegeItem.campus.includes(data.campus),
    )?.colleges;

    const programArrFiltered = collegeArrFiltered?.find(
        (programItem) => programItem.value === data.college,
    )?.programs;

    const majorArrFiltered = programArrFiltered?.find(
        (majorItem) => majorItem.name === data.program,
    )?.majors;

    console.log(data);

    return (
        <>
            <div className="relative flex min-h-screen justify-center overflow-hidden bg-white bg-cover bg-fixed bg-center bg-no-repeat md:bg-[url('/chmsu.webp')]">
                <div className="absolute top-0 left-0 h-full w-full md:bg-black/40"></div>

                <div className="relative z-10 rounded-xl bg-white p-5 md:my-20 md:border md:shadow-lg">
                    <div className="flex items-center justify-center">
                        <div className="flex flex-col items-center justify-center gap-3 md:flex-row">
                            <img
                                src="/logo.webp"
                                className="h-18 w-18 md:h-20 md:w-20"
                                alt="CHMSU Logo"
                                loading="lazy"
                            />
                            <div className="flex flex-col items-center md:items-start">
                                <h1 className="text-2xl font-extrabold text-green-600 md:text-3xl">
                                    CHMSU - CIDSA
                                </h1>
                                <small className="text-xs md:text-base">
                                    IDentification Card & Security Access
                                    Activation Form
                                </small>
                            </div>
                        </div>
                    </div>
                    <Separator className="my-5" />
                    <form className="space-y-4">
                        <HeadingSmall description="Personal Information" />
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="flex flex-col gap-2">
                                <Label>
                                    Student ID Type
                                    <AsteriskIcon size={12} color="red" />
                                </Label>
                                <Select
                                    value={data.id_type}
                                    onValueChange={(value) =>
                                        setData('id_type', value)
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose an option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="new">
                                                New
                                            </SelectItem>
                                            <SelectItem value="replacement">
                                                Replacement
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <InputError message={''} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="id_number">
                                    Student ID Number
                                    <AsteriskIcon size={12} color="red" />
                                </Label>
                                <Input
                                    type="text"
                                    name="id_number"
                                    id="id_number"
                                    placeholder="Enter ID Number"
                                    value={data.id_number}
                                    onInput={(e) => {
                                        const v =
                                            e.currentTarget.value.toUpperCase();
                                        e.currentTarget.value = v;
                                        setData('id_number', v);
                                    }}
                                />
                                <InputError message={''} />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Kindly check your enrolment form for your ID number
                            to avoid data duplication.
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-1">
                            <div className="flex flex-col gap-2">
                                <Label>
                                    First Name{' '}
                                    <AsteriskIcon size={12} color="red" />
                                </Label>
                                <Input
                                    type="text"
                                    name="first_name"
                                    id="first_name"
                                    placeholder="Enter First Name"
                                    value={data.first_name}
                                    onChange={(e) => {
                                        const value = e.target.value
                                            .toLowerCase()
                                            .replace(/\b\w/g, (char) =>
                                                char.toUpperCase(),
                                            );

                                        e.target.value = value;

                                        setData('first_name', e.target.value);
                                    }}
                                />

                                <InputError message={''} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label>Middle Initial</Label>
                                <Input
                                    type="text"
                                    name="middle_name"
                                    id="middle_name"
                                    placeholder="(Optional)"
                                    onInput={(e) => {
                                        let v =
                                            e.currentTarget.value.toUpperCase();
                                        e.currentTarget.value = v.slice(0, 1);
                                    }}
                                    onChange={(e) =>
                                        setData('middle_name', e.target.value)
                                    }
                                    value={data.middle_name}
                                />
                                <InputError message={''} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label>
                                    Last Name
                                    <AsteriskIcon size={12} color="red" />
                                </Label>
                                <Input
                                    type="text"
                                    name="last_name"
                                    id="last_name"
                                    placeholder="Enter Last Name"
                                    onChange={(e) => {
                                        const value = e.target.value
                                            .toLowerCase()
                                            .replace(/\b\w/g, (char) =>
                                                char.toUpperCase(),
                                            );

                                        e.target.value = value;
                                        setData('last_name', e.target.value);
                                    }}
                                    value={data.last_name}
                                />
                                <InputError message={''} />
                            </div>
                        </div>
                        <HeadingSmall description="In-Case of Emergency Contact Information" />
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-1">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="emergency_first_name">
                                    First Name{' '}
                                    <AsteriskIcon size={12} color="red" />
                                </Label>
                                <Input
                                    type="text"
                                    name="emergency_first_name"
                                    id="emergency_first_name"
                                    placeholder="Enter First Name"
                                    onChange={(e) => {
                                        const value = e.target.value
                                            .toLowerCase()
                                            .replace(/\b\w/g, (char) =>
                                                char.toUpperCase(),
                                            );

                                        e.target.value = value;
                                        setData(
                                            'emergency_first_name',
                                            e.target.value,
                                        );
                                    }}
                                />
                                <InputError message={''} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="emergency_middle_name">
                                    Middle Initial
                                </Label>
                                <Input
                                    type="text"
                                    name="emergency_middle_name"
                                    id="emergency_middle_name"
                                    placeholder="(Optional)"
                                    onInput={(e) => {
                                        let v =
                                            e.currentTarget.value.toUpperCase();
                                        e.currentTarget.value = v.slice(0, 1);
                                    }}
                                    onChange={(e) =>
                                        setData(
                                            'emergency_middle_name',
                                            e.currentTarget.value,
                                        )
                                    }
                                />
                                <InputError message={''} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="emergency_last_name">
                                    Last Name
                                    <AsteriskIcon size={12} color="red" />
                                </Label>
                                <Input
                                    type="text"
                                    name="emergency_last_name"
                                    id="emergency_last_name"
                                    placeholder="Enter Last Name"
                                    onChange={(e) => {
                                        const value = e.target.value
                                            .toLowerCase()
                                            .replace(/\b\w/g, (char) =>
                                                char.toUpperCase(),
                                            );

                                        e.target.value = value;
                                        setData(
                                            'emergency_last_name',
                                            e.target.value,
                                        );
                                    }}
                                />
                                <InputError message={''} />
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
                                            {relationshipArr.map(
                                                (relation, key) => (
                                                    <SelectItem
                                                        key={key}
                                                        value={relation}
                                                    >
                                                        {relation}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <InputError message={''} />
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
                                        value={data.contact_number}
                                        onInput={(e) => {
                                            if (
                                                e.currentTarget.value.length >
                                                10
                                            ) {
                                                e.currentTarget.value =
                                                    e.currentTarget.value.slice(
                                                        0,
                                                        10,
                                                    );
                                            }

                                            setData(
                                                'contact_number',
                                                e.currentTarget.value,
                                            );
                                        }}
                                    />
                                </div>
                                <InputError message={''} />
                            </div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="flex flex-col gap-2">
                                <Label>
                                    Province
                                    <AsteriskIcon size={12} color="red" />
                                </Label>
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={open}
                                            className="justify-between"
                                        >
                                            {value
                                                ? provinces.find(
                                                      (province) =>
                                                          province.value ===
                                                          value,
                                                  )?.label
                                                : 'Choose an option'}
                                            <ChevronsUpDown className="opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0">
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
                                                    {provinces.map(
                                                        (province) => (
                                                            <CommandItem
                                                                key={
                                                                    province.value
                                                                }
                                                                value={
                                                                    province.value
                                                                }
                                                                onSelect={(
                                                                    currentValue,
                                                                ) => {
                                                                    setValue(
                                                                        currentValue ===
                                                                            value
                                                                            ? ''
                                                                            : currentValue,
                                                                    );
                                                                    setOpen(
                                                                        false,
                                                                    );
                                                                    setIsCityDisabled(
                                                                        false,
                                                                    );
                                                                    setSelectedProvince(
                                                                        province.value,
                                                                    );
                                                                    setData(
                                                                        'province',
                                                                        province.value,
                                                                    );
                                                                    resetForProvinceChange();
                                                                }}
                                                            >
                                                                {province.label}
                                                                <Check
                                                                    className={cn(
                                                                        'ml-auto',
                                                                        value ===
                                                                            province.value
                                                                            ? 'opacity-100'
                                                                            : 'opacity-0',
                                                                    )}
                                                                />
                                                            </CommandItem>
                                                        ),
                                                    )}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <InputError message={''} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label>
                                    City / Municipality
                                    <AsteriskIcon size={12} color="red" />
                                </Label>
                                <Select
                                    disabled={isCityDisabled}
                                    value={data.city}
                                    onValueChange={(value) => {
                                        setIsBarangayDisabled(false);
                                        setSelectedCity(value);
                                        setData('city', value);
                                        resetForCityChange();
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose an option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {cities.map((city, key) => (
                                                <SelectItem
                                                    key={key}
                                                    value={city}
                                                >
                                                    {city}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <InputError message={''} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label>
                                    Barangay
                                    <AsteriskIcon size={12} color="red" />
                                </Label>
                                <Select
                                    value={data.barangay}
                                    onValueChange={(value) =>
                                        setData('barangay', value)
                                    }
                                    disabled={isBarangayDisabled}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose an option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {barangays.map((brgy, key) => (
                                                <SelectItem
                                                    key={key}
                                                    value={brgy}
                                                >
                                                    {brgy}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <InputError message={''} />
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
                                                e.currentTarget.value.slice(
                                                    0,
                                                    4,
                                                );
                                        }
                                    }}
                                    onChange={(e) =>
                                        setData('zip_code', e.target.value)
                                    }
                                />

                                <InputError message={''} />
                            </div>
                        </div>
                        <HeadingSmall description="College & Program Information" />
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="flex flex-col gap-2">
                                <Label>
                                    Campus
                                    <AsteriskIcon size={12} color="red" />
                                </Label>
                                <Select
                                    value={data.campus}
                                    onValueChange={(value) => {
                                        setData('campus', value);
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose an option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {campusDirectoryArr.map(
                                                (item, key) => (
                                                    <SelectItem
                                                        key={key}
                                                        value={item.campus}
                                                    >
                                                        {item.campus ===
                                                        'Talisay'
                                                            ? 'Talisay (Main Campus)'
                                                            : item.campus}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <InputError message={''} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label>
                                    College
                                    <AsteriskIcon size={12} color="red" />
                                </Label>
                                <Select
                                    value={data.college}
                                    onValueChange={(value) => {
                                        setData('college', value);
                                        setIsProgramDisabled(false);
                                    }}
                                    disabled={isCollegeDisabled}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose an option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {collegeArrFiltered?.map(
                                                (item, key) => (
                                                    <SelectItem
                                                        key={key}
                                                        value={item.value}
                                                    >
                                                        {item.value} -{' '}
                                                        {item.name}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <InputError message={''} />
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
                                        setIsMajorDisabled(false);
                                    }}
                                    disabled={isProgramDisabled}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose an option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {programArrFiltered?.map(
                                                (item, key) => (
                                                    <SelectItem
                                                        key={key}
                                                        value={item.name}
                                                    >
                                                        {item.name}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <InputError message={''} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label>
                                    Major
                                    <AsteriskIcon size={12} color="red" />
                                </Label>
                                <Select
                                    value={data.major ?? ''}
                                    onValueChange={(value) =>
                                        setData('major', value ?? null)
                                    }
                                    disabled={isMajorDisabled}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose an option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {majorArrFiltered?.map(
                                                (item, key) => (
                                                    <SelectItem
                                                        key={key}
                                                        value={item}
                                                    >
                                                        {item}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <InputError message={''} />
                            </div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="flex flex-col gap-2">
                                <Label>
                                    Year Level
                                    <AsteriskIcon size={12} color="red" />
                                </Label>
                                <Select>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose an option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="1">I</SelectItem>
                                            <SelectItem value="2">
                                                II
                                            </SelectItem>
                                            <SelectItem value="3">
                                                III
                                            </SelectItem>
                                            <SelectItem value="4">
                                                IV
                                            </SelectItem>
                                            <SelectItem value="5">V</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <InputError message={''} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <Label>
                                        Section
                                        <AsteriskIcon size={12} color="red" />
                                    </Label>
                                    <span className="text-xs text-muted-foreground">
                                        (ex: A, B, C, D)
                                    </span>
                                </div>
                                <Input
                                    type="text"
                                    name="section"
                                    id="section"
                                    placeholder="Enter Section"
                                    onChange={(e) => {
                                        const value = e.target.value
                                            .toUpperCase()
                                            .replace(/\b\w/g, (char) =>
                                                char.toUpperCase(),
                                            );

                                        e.target.value = value;

                                        if (e.currentTarget.value.length > 1) {
                                            e.currentTarget.value =
                                                e.currentTarget.value.slice(
                                                    0,
                                                    1,
                                                );
                                        }
                                    }}
                                />
                                <InputError message={''} />
                            </div>
                        </div>
                        <Button className="ml-auto block">Next</Button>
                    </form>
                </div>
            </div>
        </>
    );
}
