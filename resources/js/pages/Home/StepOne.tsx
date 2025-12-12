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
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import {
    ArrowBigRight,
    AsteriskIcon,
    Check,
    ChevronsUpDown,
    ImageUpIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Types
type Municipality = {
    barangay_list: string[];
};

type Province = {
    municipality_list: {
        [municipalityName: string]: Municipality;
    };
};

type Region = {
    province_list: {
        [provinceName: string]: Province;
    };
};

type Locations = {
    [regionName: string]: Region;
};

type CampusData = {
    campus: string;
    colleges: {
        value: string;
        name: string;
        programs: {
            name: string;
            majors: string[];
        }[];
    }[];
};

type FormData = {
    id_type: string;
    id_number: string;
    affidavit_img: File | null;
    receipt_img: File | null;
    first_name: string;
    middle_init: string | null;
    last_name: string;
    suffix: string | null;
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
    campus: string;
    college: string;
    college_name: string;
    program: string;
    hasMajor: boolean;
    major: string | null;
    year_level: number | null;
    section: string;
    picture: File | null;
    e_signature: File | null;
    data_privacy: boolean;
    confirm_info: boolean;
};

interface StepOneProps {
    data: FormData;
    setData: (key: string, value: any) => void;
    processing: boolean;
    errors: Record<string, string>;
    onShowReplacementModal: () => void;
}

const campusDirectoryArr: CampusData[] = [
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

export default function StepOne({
    data,
    setData,
    processing,
    errors,
    onShowReplacementModal,
}: StepOneProps) {
    const [locations, setLocations] = useState<Locations>({});
    const [open, setOpen] = useState(false);

    const [selectedProvince, setSelectedProvince] = useState<string>('');
    const [selectedCity, setSelectedCity] = useState<string>('');

    const [isCityDisabled, setIsCityDisabled] = useState(true);
    const [isBarangayDisabled, setIsBarangayDisabled] = useState(true);

    const [isCollegeDisabled, setIsCollegeDisabled] = useState(true);
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

    const provinces = Object.values(locations)
        .flatMap((region) =>
            Object.keys(region.province_list).map((province) => ({
                value: province,
                label: province,
            })),
        )
        .sort((a, b) => a.label.localeCompare(b.label));

    const cities = selectedProvince
        ? Object.values(locations)
              .flatMap((region) =>
                  Object.entries(region.province_list)
                      .filter(([provName]) => provName === selectedProvince)
                      .flatMap(([, province]) =>
                          Object.keys(province.municipality_list),
                      ),
              )
              .sort((a, b) => a.localeCompare(b))
        : [];

    const barangays = selectedCity
        ? Object.values(locations)
              .flatMap((region) =>
                  Object.values(region.province_list).flatMap((province) =>
                      Object.entries(province.municipality_list)
                          .filter(
                              ([municipalityName]) =>
                                  municipalityName === selectedCity,
                          )
                          .flatMap(
                              ([, municipality]) => municipality.barangay_list,
                          ),
                  ),
              )
              .sort((a, b) => a.localeCompare(b))
        : [];

    const resetForCampusChange = () => {
        setData('college', '');
        setData('college_name', '');
        setIsCollegeDisabled(false);

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

    const resetForProvinceChange = () => {
        setData('city', '');
        setData('barangay', '');
        setIsBarangayDisabled(true);
        setSelectedCity('');
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
            <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                    <Label>
                        Student ID Type
                        <AsteriskIcon size={12} color="red" />
                    </Label>
                    <Select
                        value={data.id_type}
                        onValueChange={(value) => {
                            if (value === 'replacement') {
                                onShowReplacementModal();
                                setData('affidavit_img', null);
                                setData('receipt_img', null);
                            }
                            setData('id_type', value);
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose an option" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="replacement">
                                    Replacement (Misplaced ID)
                                </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <InputError message={errors.id_type} />
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
                            const v = e.currentTarget.value
                                .trim()
                                .toUpperCase();
                            setData('id_number', v);
                        }}
                        maxLength={25}
                    />
                    <InputError message={errors.id_number} />
                </div>
            </div>

            {data.id_type === 'replacement' && (
                <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        <Input
                            type="file"
                            id="affidavit_img"
                            accept=".jpg"
                            hidden
                        />
                        <Label>
                            Upload Affidavit of Loss Image
                            <AsteriskIcon size={12} color="red" />
                        </Label>
                        {data.affidavit_img ? (
                            <>
                                <img
                                    src="/file-placeholder.jpg"
                                    loading="lazy"
                                    className="max-h-96 w-full object-contain"
                                />
                            </>
                        ) : (
                            <div className="flex h-96 items-center justify-center border">
                                <h1 className="text-xl font-semibold tracking-widest text-gray-400 italic">
                                    AOF Image Preview
                                </h1>
                            </div>
                        )}
                        <Button type="button" className="p-0">
                            <Label
                                htmlFor="affidavit_img"
                                className="m-0 flex h-full w-full items-center justify-center"
                            >
                                Upload AOF Image
                                <ImageUpIcon />
                            </Label>
                        </Button>
                        <InputError message={errors.affidavit_img} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Input
                            type="file"
                            id="receipt_img"
                            accept=".jpg"
                            hidden
                        />
                        <Label>
                            Upload Cashier's Receipt Image
                            <AsteriskIcon size={12} color="red" />
                        </Label>
                        <div className="flex h-96 items-center justify-center border">
                            <h1 className="text-xl font-semibold tracking-widest text-gray-400 italic">
                                Cashier's Receipt Image Preview
                            </h1>
                        </div>
                        <Button type="button" className="p-0">
                            <Label
                                htmlFor="receipt_img"
                                className="m-0 flex h-full w-full items-center justify-center"
                            >
                                Upload Receipt Image
                                <ImageUpIcon />
                            </Label>
                        </Button>
                        <InputError message={errors.receipt_img} />
                    </div>
                </div>
            )}

            <p className="text-xs text-muted-foreground">
                Kindly check your enrolment form for your ID number to avoid
                data duplication.
            </p>
            <div className="grid gap-3 md:grid-cols-12">
                <div className="col-span-4 flex w-full grow flex-col gap-2">
                    <Label htmlFor="first_name">
                        First Name <AsteriskIcon size={12} color="red" />
                    </Label>
                    <Input
                        type="text"
                        name="first_name"
                        id="first_name"
                        placeholder="Enter First Name"
                        value={data.first_name}
                        maxLength={25}
                        onChange={(e) => {
                            const value = e.target.value
                                .toLowerCase()
                                .replace(/\b\w/g, (char) => char.toUpperCase());

                            e.target.value = value;
                            setData('first_name', e.target.value);
                        }}
                    />
                    <InputError message={errors.first_name} />
                </div>
                <div className="col-span-auto flex w-full flex-col gap-2">
                    <Label htmlFor="middle_init">M.I.</Label>
                    <Input
                        type="text"
                        name="middle_init"
                        id="middle_init"
                        value={data.middle_init ?? ''}
                        onInput={(e) => {
                            const v = e.currentTarget.value.toUpperCase();
                            e.currentTarget.value = v.slice(0, 1);
                        }}
                        onChange={(e) =>
                            setData(
                                'middle_init',

                                e.currentTarget.value === ''
                                    ? null
                                    : e.currentTarget.value,
                            )
                        }
                    />
                    <InputError message={errors.middle_init} />
                </div>
                <div className="col-span-4 flex w-full grow flex-col gap-2">
                    <Label htmlFor="last_name">
                        Last Name
                        <AsteriskIcon size={12} color="red" />
                    </Label>
                    <Input
                        type="text"
                        name="last_name"
                        id="last_name"
                        placeholder="Enter Last Name"
                        value={data.last_name}
                        maxLength={25}
                        onChange={(e) => {
                            const value = e.target.value
                                .toLowerCase()
                                .replace(/\b\w/g, (char) => char.toUpperCase());

                            e.target.value = value;
                            setData('last_name', e.target.value);
                        }}
                    />
                    <InputError message={errors.last_name} />
                </div>
                <div className="col-span-4 flex flex-col gap-2 md:col-span-3">
                    <Label htmlFor="suffix">Suffix</Label>
                    <Select
                        value={data.suffix ?? ''}
                        onValueChange={(value) => {
                            if (value === 'None') {
                                setData('suffix', null);
                                return;
                            }
                            setData('suffix', value);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Choose an option" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {[
                                    'Jr.',
                                    'Sr.',
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
                    <InputError message={errors.suffix} />
                </div>
            </div>
            <Heading
                title="College & Program Information"
                description="Select your college, program, and major to proceed."
            />
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
                            resetForCampusChange();
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose an option" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {campusDirectoryArr.map((item, key) => (
                                    <SelectItem key={key} value={item.campus}>
                                        {item.campus === 'Talisay'
                                            ? 'Talisay (Main Campus)'
                                            : item.campus}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <InputError message={errors.campus} />
                </div>
                <div className="flex flex-col gap-2">
                    <Label>
                        College
                        <AsteriskIcon size={12} color="red" />
                    </Label>
                    <Select
                        value={JSON.stringify({
                            value: data.college,
                            name: data.college_name,
                        })}
                        onValueChange={(val) => {
                            const parsed = JSON.parse(val);

                            setData('college', parsed.value);
                            setData('college_name', parsed.name);

                            resetForCollegeChange();
                        }}
                        disabled={isCollegeDisabled}
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
                    <Label>
                        Year Level
                        <AsteriskIcon size={12} color="red" />
                    </Label>
                    <Select
                        value={data.year_level?.toString() ?? ''}
                        onValueChange={(value) => {
                            setData('year_level', value ? Number(value) : null);
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose an option" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="1">1st year</SelectItem>
                                <SelectItem value="2">2nd year</SelectItem>
                                <SelectItem value="3">3rd year</SelectItem>
                                <SelectItem value="4">4th year</SelectItem>
                                <SelectItem value="5">5th year</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <InputError message={errors.year_level} />
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
                        value={data.section}
                        onChange={(e) => {
                            const value = e.target.value
                                .toUpperCase()
                                .replace(/\b\w/g, (char) => char.toUpperCase());

                            e.target.value = value;

                            if (e.currentTarget.value.length > 1) {
                                e.currentTarget.value =
                                    e.currentTarget.value.slice(0, 1);
                            }

                            setData('section', e.currentTarget.value);
                        }}
                    />
                    <InputError message={errors.section} />
                </div>
            </div>
            <Heading
                title="In-Case of Emergency Contact Information"
                description="Enter the details of a person we can contact during emergencies."
            />
            <div className="grid gap-3 md:grid-cols-12">
                <div className="col-span-4 flex w-full grow flex-col gap-2">
                    <Label htmlFor="emergency_first_name">
                        First Name <AsteriskIcon size={12} color="red" />
                    </Label>
                    <Input
                        type="text"
                        name="emergency_first_name"
                        id="emergency_first_name"
                        placeholder="Enter First Name"
                        value={data.emergency_first_name}
                        maxLength={25}
                        onChange={(e) => {
                            const value = e.target.value
                                .toLowerCase()
                                .replace(/\b\w/g, (char) => char.toUpperCase());

                            e.target.value = value;
                            setData('emergency_first_name', e.target.value);
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
                                    : e.currentTarget.value,
                            )
                        }
                    />
                    <InputError message={errors.emergency_middle_init} />
                </div>
                <div className="col-span-4 flex w-full grow flex-col gap-2">
                    <Label htmlFor="emergency_last_name">
                        Last Name
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
                            const value = e.target.value
                                .toLowerCase()
                                .replace(/\b\w/g, (char) => char.toUpperCase());

                            e.target.value = value;
                            setData('emergency_last_name', e.target.value);
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
                                    'Jr.',
                                    'Sr.',
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

                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="justify-between"
                            >
                                {data.province
                                    ? provinces.find(
                                          (p) => p.value === data.province,
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
                                        {provinces.map((province) => (
                                            <CommandItem
                                                key={province.value}
                                                value={province.value}
                                                onSelect={() => {
                                                    setData(
                                                        'province',
                                                        province.value,
                                                    );
                                                    setOpen(false);

                                                    setIsCityDisabled(false);
                                                    setSelectedProvince(
                                                        province.value,
                                                    );
                                                    resetForProvinceChange();
                                                }}
                                            >
                                                {province.label}

                                                <Check
                                                    className={cn(
                                                        'ml-auto',
                                                        data.province ===
                                                            province.value
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

                    <Select
                        disabled={isCityDisabled}
                        value={data.city}
                        onValueChange={(value) => {
                            setData('city', value);
                            setIsBarangayDisabled(false);
                            setSelectedCity(value);
                            resetForCityChange();
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose an option" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectGroup>
                                {cities.map((city, key) => (
                                    <SelectItem key={key} value={city}>
                                        {city}
                                    </SelectItem>
                                ))}

                                {data.city && !cities.includes(data.city) && (
                                    <SelectItem value={data.city}>
                                        {data.city}
                                    </SelectItem>
                                )}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <InputError message={errors.city} />
                </div>

                <div className="flex flex-col gap-2">
                    <Label>
                        Barangay
                        <AsteriskIcon size={12} color="red" />
                    </Label>

                    <Select
                        disabled={isBarangayDisabled}
                        value={data.barangay}
                        onValueChange={(value) => setData('barangay', value)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose an option" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectGroup>
                                {barangays.map((brgy, key) => (
                                    <SelectItem key={key} value={brgy}>
                                        {brgy}
                                    </SelectItem>
                                ))}

                                {data.barangay &&
                                    !barangays.includes(data.barangay) && (
                                        <SelectItem value={data.barangay}>
                                            {data.barangay}
                                        </SelectItem>
                                    )}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

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

            <div className="flex justify-end">
                <Button
                    type="submit"
                    disabled={processing}
                    className="ml-auto text-center"
                >
                    {processing ? (
                        <>
                            <Spinner />
                            Loading...
                        </>
                    ) : (
                        <>
                            Next
                            <ArrowBigRight />
                        </>
                    )}
                </Button>
            </div>
        </>
    );
}
