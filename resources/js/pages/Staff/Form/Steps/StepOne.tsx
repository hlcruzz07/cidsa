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
import { cn } from '@/lib/utils';
import {
    Briefcase,
    Building2,
    Check,
    ChevronsUpDown,
    Fingerprint,
    GraduationCap,
    IdCard,
    UserRound,
} from 'lucide-react';
import { useState } from 'react';
import { PageProps, StaffFormData } from '../types';

interface StepOneProps {
    data: StaffFormData;
    setData: (k: keyof StaffFormData, v: any) => void;
    errors: Record<string, string>;
    staff: PageProps['staff'];
    departments: PageProps['departments'];
}

const EMPLOYMENT_TYPES = [
    {
        label: 'Contractual Employee',
        designation: 'CONTRACT OF SERVICE WORKER',
        icon: Briefcase,
    },
    {
        label: 'Regular Employee',
        designation: 'GENERAL ADMINISTRATIVE & SUPPORT SERVICES',
        icon: IdCard,
    },
    {
        label: 'Full Time Faculty',
        designation: 'FACULTY',
        icon: GraduationCap,
    },
] as const;

function InfoField({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-700">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex min-w-0 flex-col">
                <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {label}
                </Label>
                <p className="truncate text-sm font-semibold text-foreground">
                    {value}
                </p>
            </div>
        </div>
    );
}
const BLOOD_TYPES = [
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-',
    'Unknown',
];
export default function StepOne({
    data,
    setData,
    errors,
    staff,
    departments,
}: StepOneProps) {
    const [openDepartment, setOpenDepartment] = useState(false);
    const departmentIsMissing = staff.department === null;

    return (
        <div className="space-y-5">
            <Heading
                title="Personal Information"
                description="Provide your basic personal details as they will appear on your ID."
            />
            <div className="grid gap-3 sm:grid-cols-2">
                <InfoField
                    icon={Fingerprint}
                    label="Digital ID Number"
                    value={staff.digital_id}
                />
                <InfoField icon={UserRound} label="Name" value={staff.name} />
            </div>

            <Heading
                title="Employment Information"
                description="Your campus and employment details."
            />
            <div className="grid gap-3 sm:grid-cols-2">
                <InfoField
                    icon={Building2}
                    label="Campus"
                    value={`${staff.campus} ${staff.campus === 'TALISAY' ? 'MAIN CAMPUS' : 'CAMPUS'}`}
                />
                {!departmentIsMissing && (
                    <InfoField
                        icon={IdCard}
                        label="Department"
                        value={staff.department as string}
                    />
                )}
            </div>

            <div className="flex flex-col gap-2">
                <Label>Employment Type</Label>
                <div
                    role="radiogroup"
                    aria-label="Employment Type"
                    className="grid gap-3 sm:grid-cols-3"
                >
                    {EMPLOYMENT_TYPES.map(
                        ({ label, designation, icon: Icon }) => {
                            const isSelected = data.designation === designation;
                            return (
                                <button
                                    key={designation}
                                    type="button"
                                    role="radio"
                                    aria-checked={isSelected}
                                    onClick={() =>
                                        setData('designation', designation)
                                    }
                                    className={cn(
                                        'group relative flex cursor-pointer flex-col items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all',
                                        isSelected
                                            ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                                            : 'border-gray-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md dark:border-gray-600 dark:bg-gray-700',
                                    )}
                                >
                                    <div className="flex w-full items-center justify-between">
                                        <div
                                            className={cn(
                                                'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                                                isSelected
                                                    ? 'bg-primary text-white'
                                                    : 'bg-primary/10 text-primary',
                                            )}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <span
                                            className={cn(
                                                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                                                isSelected
                                                    ? 'border-primary'
                                                    : 'border-gray-300 dark:border-gray-500',
                                            )}
                                        >
                                            {isSelected && (
                                                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                                            )}
                                        </span>
                                    </div>
                                    <span
                                        className={cn(
                                            'text-sm font-semibold',
                                            isSelected
                                                ? 'text-primary'
                                                : 'text-foreground',
                                        )}
                                    >
                                        {label}
                                    </span>
                                </button>
                            );
                        },
                    )}
                </div>
                <InputError message={errors.designation} />
            </div>

            {departmentIsMissing && (
                <div className="flex flex-col gap-2">
                    <Label>Department</Label>
                    <Popover
                        open={openDepartment}
                        onOpenChange={setOpenDepartment}
                    >
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className="justify-between"
                                disabled={departments.length === 0}
                            >
                                {data.department || 'Choose your department'}
                                <ChevronsUpDown className="opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" align="start">
                            <Command>
                                <CommandInput
                                    placeholder="Search department..."
                                    className="h-9"
                                />
                                <CommandList>
                                    <CommandEmpty>
                                        No department found.
                                    </CommandEmpty>
                                    <CommandGroup>
                                        {departments.map((department) => (
                                            <CommandItem
                                                key={department}
                                                value={department}
                                                onSelect={() => {
                                                    setData(
                                                        'department',
                                                        department,
                                                    );
                                                    setOpenDepartment(false);
                                                }}
                                            >
                                                {department}
                                                <Check
                                                    className={cn(
                                                        'ml-auto',
                                                        department ===
                                                            data.department
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
                    <InputError message={errors.department} />
                </div>
            )}

            <div className="flex flex-col gap-2">
                <Label>Blood Type</Label>
                <Select
                    value={data.blood_type ?? ''}
                    onValueChange={(value) => {
                        if (value === 'Unknown') {
                            setData('blood_type', null);

                            return;
                        }

                        setData('blood_type', value);
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Choose an option" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {BLOOD_TYPES.map((item) => (
                                <SelectItem key={item} value={item}>
                                    {item}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <InputError message={errors.blood_type} />
            </div>
        </div>
    );
}
