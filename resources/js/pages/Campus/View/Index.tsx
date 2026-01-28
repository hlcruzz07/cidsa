import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { StudentProps } from '@/lib/student-types';
import { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';

type PageProps = {
    student: StudentProps;
};

export default function Index() {
    const { student } = usePage<PageProps>().props;
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: `Student - View`,
            href: `/campus/student/view/${student.id}`,
        },
    ];

    // Format year level display
    const formatYearLevel = (year: string) => {
        if (!year) return '';
        return year.replace('Year', '').trim();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Student - View" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid gap-10 xl:grid-cols-12">
                    <div className="space-y-3 xl:col-span-4">
                        <Heading
                            title="Account Management"
                            description="View the student's personal, academic, and contact information."
                        />

                        {student.is_completed && (
                            <>
                                <div className="space-y-3">
                                    <img
                                        src={`/storage/${student.picture}`}
                                        alt="Student Picture"
                                        className="h-auto w-full rounded-md shadow-lg"
                                    />

                                    <img
                                        src={`/storage/${student.e_signature}`}
                                        alt="Student Signature"
                                        className="h-auto w-full rounded-md shadow-lg"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="space-y-5 xl:col-span-8">
                        <Heading
                            title="Personal Information"
                            description="Student's basic personal details as they appear on the ID."
                        />
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="id_number">Student ID Number</Label>
                            <Input
                                type="text"
                                placeholder="ID Number"
                                value={student.id_number}
                                disabled
                            />
                        </div>

                        <div className="grid gap-3 md:grid-cols-12">
                            <div className="col-span-4 flex w-full grow flex-col gap-2">
                                <Label htmlFor="first_name">First Name</Label>
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
                                    placeholder="Middle Initial"
                                    value={student.middle_init ?? ''}
                                    disabled
                                />
                            </div>
                            <div className="col-span-4 flex w-full grow flex-col gap-2">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input
                                    type="text"
                                    id="last_name"
                                    value={student.last_name}
                                    disabled
                                />
                            </div>
                            <div className="col-span-4 flex flex-col gap-2 md:col-span-3">
                                <Label htmlFor="suffix">Suffix</Label>
                                <Input
                                    type="text"
                                    value={student.suffix ?? ''}
                                    disabled
                                />
                            </div>
                        </div>

                        {student.is_completed && (
                            <>
                                <Heading
                                    title="College & Program Information"
                                    description="Student's college, program, and major information."
                                />
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="flex flex-col gap-2">
                                        <Label>Campus</Label>
                                        <Input
                                            type="text"
                                            value={student.campus || ''}
                                            disabled
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label>College</Label>
                                        <Input
                                            type="text"
                                            value={
                                                student.college
                                                    ? `${student.college} - ${student.college_name}`
                                                    : ''
                                            }
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="flex flex-col gap-2">
                                        <Label>Program</Label>
                                        <Input
                                            type="text"
                                            value={student.program || ''}
                                            disabled
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label>Major</Label>
                                        <Input
                                            type="text"
                                            value={student.major || ''}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="zip_code">
                                            Section
                                        </Label>
                                        <Input
                                            type="text"
                                            placeholder="Section"
                                            value={student.section}
                                            disabled
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label>Year Level</Label>
                                        <Input
                                            type="text"
                                            value={student.year || ''}
                                            disabled
                                        />
                                    </div>
                                </div>

                                <Heading
                                    title="In-Case of Emergency Contact Information"
                                    description="Details of a person to contact during emergencies."
                                />
                                <div className="grid gap-3 md:grid-cols-12">
                                    <div className="col-span-4 flex w-full grow flex-col gap-2">
                                        <Label htmlFor="emergency_first_name">
                                            Emergency First Name
                                        </Label>
                                        <Input
                                            type="text"
                                            name="emergency_first_name"
                                            id="emergency_first_name"
                                            placeholder="First Name"
                                            value={student.emergency_first_name}
                                            disabled
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
                                            placeholder="Middle Initial"
                                            value={
                                                student.emergency_middle_init ??
                                                ''
                                            }
                                            disabled
                                        />
                                    </div>
                                    <div className="col-span-4 flex w-full grow flex-col gap-2">
                                        <Label htmlFor="emergency_last_name">
                                            Emergency Last Name
                                        </Label>
                                        <Input
                                            type="text"
                                            name="emergency_last_name"
                                            id="emergency_last_name"
                                            placeholder="Last Name"
                                            value={student.emergency_last_name}
                                            disabled
                                        />
                                    </div>
                                    <div className="col-span-4 flex flex-col gap-2 md:col-span-3">
                                        <Label htmlFor="emergency_suffix">
                                            Suffix
                                        </Label>
                                        <Input
                                            type="text"
                                            value={
                                                student.emergency_suffix ?? ''
                                            }
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="flex flex-col gap-2">
                                        <Label>Relationship</Label>
                                        <Input
                                            type="text"
                                            value={student.relationship || ''}
                                            disabled
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="contact_number">
                                            Contact Number
                                        </Label>
                                        <div className="relative">
                                            <span className="absolute left-2 flex h-full items-center justify-center text-sm">
                                                +63
                                            </span>
                                            <Input
                                                type="text"
                                                name="contact_number"
                                                id="contact_number"
                                                placeholder="Contact Number"
                                                className="ps-9"
                                                value={
                                                    student.contact_number?.toString() ??
                                                    ''
                                                }
                                                disabled
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="flex flex-col gap-2">
                                        <Label>Province</Label>
                                        <Input
                                            type="text"
                                            value={student.province || ''}
                                            disabled
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Label>City / Municipality</Label>
                                        <Input
                                            type="text"
                                            value={student.city || ''}
                                            disabled
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Label>Barangay</Label>
                                        <Input
                                            type="text"
                                            value={student.barangay || ''}
                                            disabled
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="zip_code">
                                            Zip Code
                                        </Label>
                                        <Input
                                            type="text"
                                            name="zip_code"
                                            id="zip_code"
                                            placeholder="Zip Code"
                                            value={student.zip_code}
                                            disabled
                                        />
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
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
