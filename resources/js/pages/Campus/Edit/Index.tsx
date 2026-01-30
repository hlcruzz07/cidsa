import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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
import AppLayout from '@/layouts/app-layout';
import { StudentProps } from '@/lib/student-types';
import { BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import * as imageConversion from 'image-conversion';
import { ChangeEvent, useEffect, useRef, useState } from 'react';

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
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import {
    applyWhiteBackground,
    resizeWithFaceCentering,
} from '@/lib/image-remover';
import { campusDirectoryArr, cn } from '@/lib/utils';
import { removeBackground } from '@imgly/background-removal';
import {
    AsteriskIcon,
    Check,
    ChevronsUpDown,
    ImageIcon,
    ImagePlusIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

type PageProps = {
    student: StudentProps;
};

type ProvinceProp = Array<{
    province_id: number;
    province_name: string;
}>;

type CitiesProp = Array<{
    municipality_id: number;
    municipality_name: string;
    province_id: number;
}>;

type BrgysProp = Array<{
    barangay_id: number;
    barangay_name: string;
    municipality_id: number;
}>;

type CitiesApiProp = {
    municipality_id: number;
    municipality_name: string;
    province_id: number;
};

type BrgyApiProp = {
    barangay_id: number;
    barangay_name: string;
    municipality_id: number;
};

export default function Index() {
    const { student } = usePage<PageProps>().props;
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: `Student - Edit`,
            href: `/campus/student/edit/${student.id}`,
        },
    ];

    const { data, setData, processing, errors, put, clearErrors, reset } =
        useForm({
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
            year: '',
            section: '',
        });

    const [openProvince, setOpenProvince] = useState(false);
    const [openCities, setOpenCities] = useState(false);
    const [openBrgys, setOpenBrgys] = useState(false);

    const [isProgramDisabled, setIsProgramDisabled] = useState(true);
    const [isMajorDisabled, setIsMajorDisabled] = useState(true);

    const [provinces, setProvinces] = useState<ProvinceProp>([]);
    const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(
        null,
    );

    const [cities, setCities] = useState<CitiesProp>([]);
    const [selectedCityId, setSelectedCityId] = useState<number | null>(null);

    const [brgys, setBrgys] = useState<BrgysProp>([]);
    const [isInitializing, setIsInitializing] = useState(true);

    const collegeArrFiltered = campusDirectoryArr.find((collegeItem) =>
        collegeItem.campus.includes(student?.campus!),
    )?.colleges;

    const programArrFiltered = collegeArrFiltered?.find(
        (programItem) =>
            programItem.value === (data.college || student?.college),
    )?.programs;

    const majorArrFiltered = programArrFiltered?.find(
        (majorItem) => majorItem.name === (data.program || student?.program),
    )?.majors;

    const fetchProvinces = () => {
        fetch('/table_province.json')
            .then((response) => response.json())
            .then((data) => {
                setProvinces(data);
            })
            .catch((error) => {
                console.error('Error fetching provinces:', error);
                toast.error('Failed to load provinces data');
            });
    };

    const fetchCities = (id: number) => {
        fetch('/table_municipality.json')
            .then((response) => response.json())
            .then((data) => {
                const filteredCities = data.filter(
                    (c: CitiesApiProp) => c.province_id === id,
                );
                setCities(filteredCities);
            })
            .catch((error) => {
                console.error('Error fetching cities:', error);
                toast.error('Failed to load cities data');
            });
    };

    const fetchBrgys = (id: number) => {
        fetch('/table_barangay.json')
            .then((response) => response.json())
            .then((data) => {
                const filteredBrgys = data.filter(
                    (b: BrgyApiProp) => b.municipality_id === id,
                );
                setBrgys(filteredBrgys);
            })
            .catch((error) => {
                console.error('Error fetching barangays:', error);
                toast.error('Failed to load barangays data');
            });
    };

    useEffect(() => {
        fetchProvinces();
    }, []);

    // Initialize form data from student
    useEffect(() => {
        if (!student) return;

        // Set basic form data
        setData({
            first_name: student.first_name ?? '',
            middle_init: student.middle_init ?? null,
            last_name: student.last_name ?? '',
            suffix: student.suffix ?? null,
            emergency_first_name: student.emergency_first_name ?? '',
            emergency_middle_init: student.emergency_middle_init ?? null,
            emergency_last_name: student.emergency_last_name ?? '',
            emergency_suffix: student.emergency_suffix ?? null,
            relationship: student.relationship ?? '',
            contact_number: student.contact_number,
            province: student.province ?? '',
            city: student.city ?? '',
            barangay: student.barangay ?? '',
            zip_code: student.zip_code ?? '',
            campus: student.campus ?? '',
            college: student.college ?? '',
            college_name: student.college_name ?? '',
            program: student.program ?? '',
            hasMajor: Boolean(student.major),
            major: student.major ?? null,
            year: student.year ?? '',
            section: student.section ?? '',
        });

        // Enable program dropdown if college is set
        if (student.college) {
            setIsProgramDisabled(false);
        }

        // Enable major dropdown if program is set and has majors
        if (student.program && student.major) {
            setIsMajorDisabled(false);
        }
    }, []);

    // Initialize province after provinces are loaded
    useEffect(() => {
        if (!student?.province || provinces.length === 0) return;

        const foundProvince = provinces.find(
            (p) => p.province_name === student.province,
        );
        if (foundProvince) {
            setSelectedProvinceId(foundProvince.province_id);

            fetchCities(foundProvince.province_id);
        }
        setIsInitializing(false);
    }, [provinces, student]);

    // Initialize city after cities are loaded
    useEffect(() => {
        if (!student?.city || cities.length === 0) return;

        const foundCity = cities.find(
            (c) => c.municipality_name === student.city,
        );
        if (foundCity) {
            setSelectedCityId(foundCity.municipality_id);

            fetchBrgys(foundCity.municipality_id);
        }
    }, [cities, student]);

    // Initialize barangay after barangays are loaded
    useEffect(() => {
        if (!student?.barangay || brgys.length === 0) return;
        // Barangay is already set in form data, just ensure the list is loaded
    }, [brgys, student]);

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
        setCities([]);
        setBrgys([]);
    };

    const resetForCityChange = () => {
        setData('barangay', '');
        setBrgys([]);
    };

    const handleProgramChange = (program: string) => {
        const programItem = programArrFiltered?.find(
            (item) => item.name === program,
        );
        if (programItem?.majors && programItem.majors.length > 0) {
            setData('hasMajor', true);
        } else {
            setData('hasMajor', false);
        }
    };

    const handleStudentUpdate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (processing) return;

        if (student.is_completed) {
            put(route('update.student', student.id), {
                preserveScroll: true,
                onSuccess: () => {
                    clearErrors();
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

            return;
        }

        put(route('update.student.inc', student.id), {
            preserveScroll: true,
            onSuccess: () => {
                clearErrors();
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

    //IMAGE UPLOADING
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [newImage, setNewImage] = useState<File | null>(null);
    const [isBgRemoving, setIsBgRemoving] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [updatingPicture, setUpdatingPicture] = useState(false);

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsBgRemoving(true);
        setProgress(0);

        try {
            // 1. Remove background → transparent PNG
            setProgress(10);
            const removedBlob: Blob = await removeBackground(file);

            // 2. Convert transparent → white background
            setProgress(30);
            const whiteBgBlob: Blob = await applyWhiteBackground(removedBlob);

            // 3. Resize + auto-center on face
            setProgress(60);
            const centeredBlob: Blob = await resizeWithFaceCentering(
                whiteBgBlob,
                320,
                378,
            );

            // 4. Compress final image
            setProgress(90);
            const finalBlob: Blob = await (imageConversion.compress as any)(
                centeredBlob,
                {
                    type: 'image/jpg',
                    quality: centeredBlob.size > 2 * 1024 * 1024 ? 0.7 : 0.95,
                },
            );

            setProgress(100);
            const filename = `${student.id_number}.jpg`;

            setNewImage(new File([finalBlob], filename, { type: 'image/jpg' }));
        } catch (err) {
            console.error('Background removal failed', err);
            toast.error('Failed to process image. Please try again.');
            setNewImage(null);
        } finally {
            setIsBgRemoving(false);
            setProgress(0);
        }
    };

    const handlePictureUpdate = () => {
        if (updatingPicture) return;

        router.post(
            route('update.student.picture', student.id),
            {
                picture: newImage,
            },
            {
                onSuccess: () => {
                    setUpdatingPicture(false);
                    setNewImage(null);
                },
                onError: (err) => {
                    console.log('Error updating picture', err);
                },
            },
        );
    };

    //SIGNATURE UPLOADING
    const [newSignature, setNewSignature] = useState<File | null>(null);
    const [updatingSignature, setUpdatingSignature] = useState(false);

    const handleSaveSignature = (file: File) => {
        setNewSignature(file);
    };

    const handleSignatureUpdate = () => {
        if (updatingSignature) return;

        router.post(
            route('update.student.picture', student.id),
            {
                picture: newImage,
            },
            {
                onSuccess: () => {
                    setUpdatingPicture(false);
                },
                onError: (err) => {
                    console.log('Error updating picture', err);
                },
            },
        );
    };

    // Show loading while initializing
    if (isInitializing && student?.province) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Student - Edit" />
                <div className="flex h-full flex-1 items-center justify-center">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        <p>Loading student data...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Student - Edit" />
            {isBgRemoving && (
                <div className="fixed top-0 left-0 z-20 flex h-full w-full items-center justify-center overflow-hidden bg-black/70">
                    <div className="relative flex h-80 w-80 items-center justify-center">
                        <div className="z-10 flex flex-col items-center gap-5">
                            <img
                                src="/logo.webp"
                                className="h-18 w-18 md:h-20 md:w-20"
                                alt="CHMSU Logo"
                                loading="eager"
                            />
                            <h1 className="text-center text-white">
                                Processing Picture...
                            </h1>
                            <div className="w-full max-w-xs">
                                <Progress value={progress} className="w-full" />
                                <p className="mt-2 text-center text-sm text-white">
                                    {progress}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid gap-10 xl:grid-cols-12">
                    <div className="space-y-3 xl:col-span-4">
                        <Heading
                            title="Account Management"
                            description="Review and update the student's personal, academic, and contact information."
                        />

                        {student.is_completed && (
                            <>
                                <div className="relative space-y-3">
                                    {newImage ? (
                                        <img
                                            src={URL.createObjectURL(newImage)}
                                            alt="Student Picture"
                                            className="h-auto w-full rounded-md"
                                        />
                                    ) : (
                                        <img
                                            src={`/storage/${student.picture}`}
                                            alt="Student Picture"
                                            className="h-auto w-full rounded-md shadow-lg"
                                        />
                                    )}

                                    <Button
                                        type="button"
                                        className="absolute top-3 right-3"
                                        disabled={updatingPicture}
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                    >
                                        <ImagePlusIcon />
                                    </Button>

                                    {newImage && (
                                        <Button
                                            type="button"
                                            variant="default"
                                            className="w-full"
                                            onClick={() => {
                                                setUpdatingPicture(true);
                                                handlePictureUpdate();
                                            }}
                                            disabled={updatingPicture}
                                        >
                                            {updatingPicture ? (
                                                <>
                                                    Updating... <Spinner />
                                                </>
                                            ) : (
                                                <>
                                                    Update Picture <ImageIcon />
                                                </>
                                            )}
                                        </Button>
                                    )}

                                    <Input
                                        ref={fileInputRef}
                                        type="file"
                                        id="picture"
                                        accept="image/jpeg,image/png"
                                        hidden
                                        onChange={handleFileChange}
                                    />
                                </div>

                                {newSignature ? (
                                    <img
                                        src={URL.createObjectURL(newSignature)}
                                        alt="Student Picture"
                                        className="h-auto w-full rounded-md"
                                    />
                                ) : (
                                    <img
                                        src={`/storage/${student.e_signature}`}
                                        alt="Student Signature"
                                        className="h-auto w-full rounded-md shadow-lg"
                                    />
                                )}
                            </>
                        )}
                    </div>
                    <form
                        className="space-y-5 xl:col-span-8"
                        onSubmit={handleStudentUpdate}
                    >
                        <Heading
                            title="Personal Information"
                            description="Provide your basic personal details as they will appear on your ID."
                        />
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="id_number">Student ID Number</Label>
                            <Input
                                type="text"
                                placeholder="Enter ID Number"
                                value={student.id_number}
                                disabled
                            />
                        </div>

                        <div className="grid gap-3 md:grid-cols-12">
                            <div className="col-span-4 flex w-full grow flex-col gap-2">
                                <Label htmlFor="first_name">
                                    First Name{' '}
                                    <AsteriskIcon size={12} color="red" />
                                </Label>
                                <Input
                                    type="text"
                                    id="first_name"
                                    value={data.first_name}
                                    maxLength={25}
                                    onChange={(e) => {
                                        setData(
                                            'first_name',
                                            e.target.value.toUpperCase(),
                                        );
                                    }}
                                />
                                <InputError message={errors.first_name} />
                            </div>
                            <div className="col-span-auto flex w-full flex-col gap-2">
                                <Label htmlFor="middle_init">M.I.</Label>
                                <Input
                                    type="text"
                                    id="middle_init"
                                    placeholder="Enter Middle Initial"
                                    value={data.middle_init ?? ''}
                                    onInput={(e) => {
                                        const v =
                                            e.currentTarget.value.toUpperCase();
                                        e.currentTarget.value = v.slice(0, 1);
                                    }}
                                    onChange={(e) =>
                                        setData(
                                            'middle_init',
                                            e.currentTarget.value === ''
                                                ? null
                                                : e.currentTarget.value.toUpperCase(),
                                        )
                                    }
                                />
                                <InputError message={errors.middle_init} />
                            </div>
                            <div className="col-span-4 flex w-full grow flex-col gap-2">
                                <Label htmlFor="last_name">
                                    Last Name{' '}
                                    <AsteriskIcon size={12} color="red" />
                                </Label>
                                <Input
                                    type="text"
                                    id="last_name"
                                    value={data.last_name}
                                    maxLength={25}
                                    onChange={(e) => {
                                        setData(
                                            'last_name',
                                            e.target.value.toUpperCase(),
                                        );
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
                                    <SelectTrigger className="">
                                        <SelectValue placeholder="Choose an option">
                                            {data.suffix ?? 'Choose an option'}
                                        </SelectValue>
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
                                                <SelectItem
                                                    key={key}
                                                    value={item}
                                                >
                                                    {item}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.emergency_suffix} />
                            </div>
                        </div>

                        {student.is_completed && (
                            <>
                                <Heading
                                    title="College & Program Information"
                                    description="Select your college, program, and major to proceed."
                                />
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="flex flex-col gap-2">
                                        <Label>
                                            Campus{' '}
                                            <AsteriskIcon
                                                size={12}
                                                color="red"
                                            />
                                        </Label>
                                        <Select
                                            value={data.campus}
                                            onValueChange={(value) => {
                                                setData('campus', value);
                                            }}
                                        >
                                            <SelectTrigger className="">
                                                <SelectValue placeholder="Choose an option">
                                                    {data.campus ||
                                                        'Choose an option'}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent className="w-full">
                                                <SelectGroup>
                                                    {[
                                                        'Talsay',
                                                        'Alijis',
                                                        'Fortune Towne',
                                                        'Binalbagan',
                                                    ].map((item, key) => (
                                                        <SelectItem
                                                            key={key}
                                                            value={item}
                                                        >
                                                            {item}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label>
                                            College
                                            <AsteriskIcon
                                                size={12}
                                                color="red"
                                            />
                                        </Label>
                                        <Select
                                            value={
                                                data.college &&
                                                data.college_name
                                                    ? JSON.stringify({
                                                          value: data.college,
                                                          name: data.college_name,
                                                      })
                                                    : undefined
                                            }
                                            onValueChange={(val) => {
                                                const parsed = JSON.parse(val);
                                                setData(
                                                    'college',
                                                    parsed.value,
                                                );
                                                setData(
                                                    'college_name',
                                                    parsed.name,
                                                );
                                                resetForCollegeChange();
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Choose an option">
                                                    {data.college
                                                        ? `${data.college} - ${data.college_name}`
                                                        : 'Choose an option'}
                                                </SelectValue>
                                            </SelectTrigger>

                                            <SelectContent>
                                                <SelectGroup>
                                                    {collegeArrFiltered?.map(
                                                        (item, key) => (
                                                            <SelectItem
                                                                key={key}
                                                                value={JSON.stringify(
                                                                    {
                                                                        value: item.value,
                                                                        name: item.name,
                                                                    },
                                                                )}
                                                            >
                                                                {item.value} -{' '}
                                                                {item.name}
                                                            </SelectItem>
                                                        ),
                                                    )}
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
                                            <AsteriskIcon
                                                size={12}
                                                color="red"
                                            />
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
                                                <SelectValue placeholder="Choose an option">
                                                    {data.program ||
                                                        'Choose an option'}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {programArrFiltered?.map(
                                                        (item, key) => (
                                                            <SelectItem
                                                                key={key}
                                                                value={
                                                                    item.name
                                                                }
                                                            >
                                                                {item.name}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.program} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label>
                                            Major{' '}
                                            {data.hasMajor ? (
                                                <AsteriskIcon
                                                    size={12}
                                                    color="red"
                                                />
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
                                                isMajorDisabled ||
                                                !data.hasMajor ||
                                                majorArrFiltered?.length === 0
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Choose an option">
                                                    {data.major ||
                                                        'Choose an option'}
                                                </SelectValue>
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
                                        <InputError message={errors.major} />
                                    </div>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="zip_code">
                                                Section
                                                <AsteriskIcon
                                                    size={12}
                                                    color="red"
                                                />
                                            </Label>
                                            <span className="text-xs text-muted-foreground">
                                                (ex: A, B, C, D, A1, A2, etc.)
                                            </span>
                                        </div>
                                        <Input
                                            type="text"
                                            maxLength={
                                                data.college === 'CIT' ? 2 : 1
                                            }
                                            disabled={!data.college}
                                            placeholder="Enter Section"
                                            value={data.section}
                                            onChange={(e) => {
                                                setData(
                                                    'section',
                                                    e.target.value.toUpperCase(),
                                                );
                                            }}
                                        />
                                        <InputError message={errors.section} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label>
                                            Year Level
                                            <AsteriskIcon
                                                size={12}
                                                color="red"
                                            />
                                        </Label>
                                        <Select
                                            value={data.year}
                                            onValueChange={(value) => {
                                                setData('year', value);
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Choose an option">
                                                    {data.year ||
                                                        'Choose an option'}
                                                </SelectValue>
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
                                                        <SelectItem
                                                            key={key}
                                                            value={item}
                                                        >
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
                                            <AsteriskIcon
                                                size={12}
                                                color="red"
                                            />
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
                                        <InputError
                                            message={
                                                errors.emergency_first_name
                                            }
                                        />
                                    </div>
                                    <div className="col-span-auto flex w-full flex-col gap-2">
                                        <Label htmlFor="emergency_middle_init">
                                            M.I.
                                        </Label>
                                        <Input
                                            type="text"
                                            name="emergency_middle_init"
                                            id="emergency_middle_init"
                                            placeholder="Enter Middle Initial"
                                            value={
                                                data.emergency_middle_init ?? ''
                                            }
                                            onInput={(e) => {
                                                const v =
                                                    e.currentTarget.value.toUpperCase();
                                                e.currentTarget.value = v.slice(
                                                    0,
                                                    1,
                                                );
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
                                        <InputError
                                            message={
                                                errors.emergency_middle_init
                                            }
                                        />
                                    </div>
                                    <div className="col-span-4 flex w-full grow flex-col gap-2">
                                        <Label htmlFor="emergency_last_name">
                                            Emergency Last Name
                                            <AsteriskIcon
                                                size={12}
                                                color="red"
                                            />
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
                                        <InputError
                                            message={errors.emergency_last_name}
                                        />
                                    </div>
                                    <div className="col-span-4 flex flex-col gap-2 md:col-span-3">
                                        <Label htmlFor="emergency_suffix">
                                            Suffix
                                        </Label>
                                        <Select
                                            value={data.emergency_suffix ?? ''}
                                            onValueChange={(value) => {
                                                if (value === 'None') {
                                                    setData(
                                                        'emergency_suffix',
                                                        null,
                                                    );
                                                    return;
                                                }
                                                setData(
                                                    'emergency_suffix',
                                                    value,
                                                );
                                            }}
                                        >
                                            <SelectTrigger className="">
                                                <SelectValue placeholder="Choose an option">
                                                    {data.emergency_suffix ||
                                                        'Choose an option'}
                                                </SelectValue>
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
                                                        <SelectItem
                                                            key={key}
                                                            value={item}
                                                        >
                                                            {item}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={errors.emergency_suffix}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="flex flex-col gap-2">
                                        <Label>
                                            Relationship
                                            <AsteriskIcon
                                                size={12}
                                                color="red"
                                            />
                                        </Label>
                                        <Select
                                            value={data.relationship}
                                            onValueChange={(value) =>
                                                setData('relationship', value)
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Choose an option">
                                                    {data.relationship ||
                                                        'Choose an option'}
                                                </SelectValue>
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
                                                        <SelectItem
                                                            key={key}
                                                            value={relation}
                                                        >
                                                            {relation}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={errors.relationship}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="contact_number">
                                                Contact Number
                                                <AsteriskIcon
                                                    size={12}
                                                    color="red"
                                                />
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
                                                value={
                                                    data.contact_number?.toString() ??
                                                    ''
                                                }
                                                onInput={(e) => {
                                                    if (
                                                        e.currentTarget.value
                                                            .length > 10
                                                    ) {
                                                        e.currentTarget.value =
                                                            e.currentTarget.value.slice(
                                                                0,
                                                                10,
                                                            );
                                                    }

                                                    setData(
                                                        'contact_number',
                                                        e.currentTarget.value
                                                            ? Number(
                                                                  e
                                                                      .currentTarget
                                                                      .value,
                                                              )
                                                            : null,
                                                    );
                                                }}
                                            />
                                        </div>
                                        <InputError
                                            message={errors.contact_number}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="flex flex-col gap-2">
                                        <Label>
                                            Province
                                            <AsteriskIcon
                                                size={12}
                                                color="red"
                                            />
                                        </Label>

                                        <Popover
                                            open={openProvince}
                                            onOpenChange={setOpenProvince}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openProvince}
                                                    className="justify-between"
                                                >
                                                    {data.province ||
                                                        'Choose an option'}
                                                    <ChevronsUpDown className="opacity-50" />
                                                </Button>
                                            </PopoverTrigger>

                                            <PopoverContent
                                                className="p-0"
                                                align="start"
                                            >
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
                                                                (p, index) => (
                                                                    <CommandItem
                                                                        key={
                                                                            index
                                                                        }
                                                                        value={
                                                                            p.province_name
                                                                        }
                                                                        onSelect={() => {
                                                                            setData(
                                                                                'province',
                                                                                p.province_name,
                                                                            );
                                                                            setOpenProvince(
                                                                                false,
                                                                            );
                                                                            setSelectedProvinceId(
                                                                                p.province_id,
                                                                            );

                                                                            resetForProvinceChange();
                                                                            fetchCities(
                                                                                p.province_id,
                                                                            );
                                                                        }}
                                                                    >
                                                                        {
                                                                            p.province_name
                                                                        }

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
                                                                ),
                                                            )}
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
                                            <AsteriskIcon
                                                size={12}
                                                color="red"
                                            />
                                        </Label>

                                        <Popover
                                            open={openCities}
                                            onOpenChange={setOpenCities}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openCities}
                                                    className="justify-between"
                                                    disabled={
                                                        selectedProvinceId ===
                                                        null
                                                    }
                                                >
                                                    {data.city ||
                                                        'Choose an option'}
                                                    <ChevronsUpDown className="opacity-50" />
                                                </Button>
                                            </PopoverTrigger>

                                            <PopoverContent
                                                className="p-0"
                                                align="start"
                                            >
                                                <Command>
                                                    <CommandInput
                                                        placeholder="Search cities/municipalities..."
                                                        className="h-9"
                                                    />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            No city/municipality
                                                            found.
                                                        </CommandEmpty>

                                                        <CommandGroup>
                                                            {cities.map(
                                                                (c, index) => (
                                                                    <CommandItem
                                                                        key={
                                                                            index
                                                                        }
                                                                        value={
                                                                            c.municipality_name
                                                                        }
                                                                        onSelect={() => {
                                                                            setData(
                                                                                'city',
                                                                                c.municipality_name,
                                                                            );
                                                                            setSelectedCityId(
                                                                                c.municipality_id,
                                                                            );

                                                                            fetchBrgys(
                                                                                c.municipality_id,
                                                                            );
                                                                            setOpenCities(
                                                                                false,
                                                                            );
                                                                            resetForCityChange();
                                                                        }}
                                                                    >
                                                                        {
                                                                            c.municipality_name
                                                                        }

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
                                                                ),
                                                            )}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>

                                        <InputError message={errors.city} />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Label>
                                            Barangay
                                            <AsteriskIcon
                                                size={12}
                                                color="red"
                                            />
                                        </Label>

                                        <Popover
                                            open={openBrgys}
                                            onOpenChange={setOpenBrgys}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openBrgys}
                                                    className="justify-between"
                                                    disabled={
                                                        selectedCityId === null
                                                    }
                                                >
                                                    {data.barangay ||
                                                        'Choose an option'}
                                                    <ChevronsUpDown className="opacity-50" />
                                                </Button>
                                            </PopoverTrigger>

                                            <PopoverContent
                                                className="p-0"
                                                align="start"
                                            >
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
                                                            {brgys.map(
                                                                (b, index) => (
                                                                    <CommandItem
                                                                        key={
                                                                            index
                                                                        }
                                                                        value={
                                                                            b.barangay_name
                                                                        }
                                                                        onSelect={() => {
                                                                            setData(
                                                                                'barangay',
                                                                                b.barangay_name,
                                                                            );
                                                                            setOpenBrgys(
                                                                                false,
                                                                            );
                                                                        }}
                                                                    >
                                                                        {
                                                                            b.barangay_name
                                                                        }

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
                                                                ),
                                                            )}
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
                                                <AsteriskIcon
                                                    size={12}
                                                    color="red"
                                                />
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
                                                if (
                                                    e.currentTarget.value
                                                        .length > 4
                                                ) {
                                                    e.currentTarget.value =
                                                        e.currentTarget.value.slice(
                                                            0,
                                                            4,
                                                        );
                                                }
                                            }}
                                            onChange={(e) =>
                                                setData(
                                                    'zip_code',
                                                    e.target.value,
                                                )
                                            }
                                        />

                                        <InputError message={errors.zip_code} />
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="flex items-center justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.history.back()}
                            >
                                Back
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? (
                                    <>
                                        <Spinner /> Loading...{' '}
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
