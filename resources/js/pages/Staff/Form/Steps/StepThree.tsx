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
import { capitalizeString, cn } from '@/lib/utils';
import { AsteriskIcon, Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StaffFormData } from '../types';

type ProvinceProp = { province_id: number; province_name: string }[];
type CitiesProp = {
    municipality_id: number;
    municipality_name: string;
    province_id: number;
}[];
type BrgysProp = { barangay_name: string; municipality_id: number }[];

interface StepThreeProps {
    data: StaffFormData;
    setData: (k: keyof StaffFormData, v: any) => void;
    errors: Record<string, string>;
}

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

    const [emergency_address, setEmergencyAddress] = useState({
        street: '',
        barangay: '',
        city: '',
        province: '',
        zip_code: '',
    });

    // Sync on every change (not just once all five sub-fields are filled),
    // so a partially-filled address is still saved to the one column the
    // backend actually persists (`emergency_address`).
    useEffect(() => {
        const fullAddress = [
            emergency_address.street,
            `Brgy. ${emergency_address.barangay}`,
            emergency_address.city,
            emergency_address.province,
            emergency_address.zip_code,
        ]
            .filter(Boolean)
            .join(', ');

        setData('emergency_address', fullAddress);
    }, [emergency_address]);

    useEffect(() => {
        fetch('/table_province.json')
            .then((r) => r.json())
            .then(setProvinces);
    }, []);

    const fetchCities = (id: number) => {
        fetch('/table_municipality.json')
            .then((r) => r.json())
            .then((items: CitiesProp) =>
                setCities(items.filter((c) => c.province_id === id)),
            );
    };

    const fetchBrgys = (id: number) => {
        fetch('/table_barangay.json')
            .then((r) => r.json())
            .then((items: BrgysProp) =>
                setBrgys(items.filter((b) => b.municipality_id === id)),
            );
    };

    const handleProvinceSelect = (province: ProvinceProp[number]) => {
        setSelectedProvinceId(province.province_id);
        setSelectedProvinceName(province.province_name);
        setOpenProvince(false);

        // Province changed: city + barangay selections are no longer valid
        setSelectedCityId(null);
        setSelectedCityName(null);
        setCities([]);
        setBrgys([]);

        setEmergencyAddress((prev) => ({
            ...prev,
            province: province.province_name,
            city: '',
            barangay: '',
        }));

        fetchCities(province.province_id);
    };

    const handleCitySelect = (city: CitiesProp[number]) => {
        setSelectedCityId(city.municipality_id);
        setSelectedCityName(city.municipality_name);
        setOpenCities(false);

        // City changed: barangay selection is no longer valid
        setBrgys([]);
        setEmergencyAddress((prev) => ({
            ...prev,
            city: city.municipality_name,
            barangay: '',
        }));

        fetchBrgys(city.municipality_id);
    };

    const handleBarangaySelect = (barangay: BrgysProp[number]) => {
        setEmergencyAddress((prev) => ({
            ...prev,
            barangay: barangay.barangay_name,
        }));
        setOpenBrgys(false);
    };

    return (
        <div className="space-y-5">
            <Heading
                title="In-Case of Emergency Contact Information"
                description="Enter the details of a person we can contact during emergencies."
            />
            <div className="grid gap-3 md:grid-cols-12">
                <div className="col-span-4 flex w-full grow flex-col gap-2">
                    <Label htmlFor="emergency_fname">
                        Emergency First Name{' '}
                        <AsteriskIcon size={12} color="red" />
                    </Label>
                    <Input
                        type="text"
                        id="emergency_fname"
                        name="emergency_fname"
                        placeholder="Enter First Name"
                        value={data.emergency_fname}
                        onChange={(e) =>
                            setData(
                                'emergency_fname',
                                e.target.value.toUpperCase(),
                            )
                        }
                    />
                    <InputError message={errors.emergency_fname} />
                </div>
                <div className="col-span-auto flex w-full flex-col gap-2">
                    <Label htmlFor="emergency_mname">M.I.</Label>
                    <Input
                        type="text"
                        id="emergency_mname"
                        name="emergency_mname"
                        placeholder="M.I."
                        value={data.emergency_mname ?? ''}
                        onInput={(e) => {
                            e.currentTarget.value = e.currentTarget.value
                                .toUpperCase()
                                .slice(0, 1);
                        }}
                        onChange={(e) =>
                            setData(
                                'emergency_mname',
                                e.currentTarget.value === ''
                                    ? null
                                    : e.currentTarget.value.toUpperCase() + '.',
                            )
                        }
                    />
                    <InputError message={errors.emergency_mname} />
                </div>
                <div className="col-span-4 flex w-full grow flex-col gap-2">
                    <Label htmlFor="emergency_lname">
                        Emergency Last Name{' '}
                        <AsteriskIcon size={12} color="red" />
                    </Label>
                    <Input
                        type="text"
                        id="emergency_lname"
                        name="emergency_lname"
                        placeholder="Enter Last Name"
                        value={data.emergency_lname}
                        onChange={(e) =>
                            setData(
                                'emergency_lname',
                                e.target.value.toUpperCase(),
                            )
                        }
                    />
                    <InputError message={errors.emergency_lname} />
                </div>
                <div className="col-span-4 flex flex-col gap-2 md:col-span-3">
                    <Label>Suffix</Label>
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
                                    'JR.',
                                    'SR.',
                                    'II.',
                                    'III.',
                                    'IV.',
                                    'V.',
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

            <div className="flex flex-col gap-2">
                <Label htmlFor="emergency_phone">
                    Emergency Contact Number{' '}
                    <AsteriskIcon size={12} color="red" />
                </Label>
                <div className="relative">
                    <span className="absolute left-2 flex h-full items-center justify-center text-sm">
                        +63
                    </span>
                    <Input
                        type="number"
                        id="emergency_phone"
                        name="emergency_phone"
                        placeholder="Enter Contact Number"
                        className="ps-9"
                        value={data.emergency_phone ?? ''}
                        onInput={(e) => {
                            e.currentTarget.value = e.currentTarget.value.slice(
                                0,
                                10,
                            );
                            setData('emergency_phone', e.currentTarget.value);
                        }}
                    />
                </div>
                <InputError message={errors.emergency_phone} />
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
                                                onSelect={() =>
                                                    handleProvinceSelect(
                                                        province,
                                                    )
                                                }
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
                                                onSelect={() =>
                                                    handleCitySelect(city)
                                                }
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
                                className="justify-between"
                                disabled={
                                    selectedCityId === null ||
                                    brgys.length === 0
                                }
                            >
                                {emergency_address.barangay ||
                                    'Choose an option'}
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
                                                onSelect={() =>
                                                    handleBarangaySelect(
                                                        barangay,
                                                    )
                                                }
                                            >
                                                {barangay.barangay_name}
                                                <Check
                                                    className={cn(
                                                        'ml-auto',
                                                        barangay.barangay_name ===
                                                            emergency_address.barangay
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
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="zip_code">
                        Zip Code <AsteriskIcon size={12} color="red" />
                    </Label>
                    <Input
                        type="number"
                        id="zip_code"
                        name="zip_code"
                        value={emergency_address.zip_code}
                        min={0}
                        placeholder="Enter Zip Code"
                        onInput={(e) => {
                            e.currentTarget.value = e.currentTarget.value.slice(
                                0,
                                4,
                            );
                        }}
                        onChange={(e) =>
                            setEmergencyAddress((prev) => ({
                                ...prev,
                                zip_code: e.target.value,
                            }))
                        }
                    />
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="emergency_street">
                    Street Address <AsteriskIcon size={12} color="red" />
                </Label>
                <Input
                    type="text"
                    id="emergency_street"
                    name="emergency_street"
                    placeholder="Enter Street / House No."
                    value={emergency_address.street}
                    onChange={(e) =>
                        setEmergencyAddress((prev) => ({
                            ...prev,
                            street: capitalizeString(e.target.value),
                        }))
                    }
                />

                <InputError message={errors.emergency_address} />
            </div>
        </div>
    );
}
