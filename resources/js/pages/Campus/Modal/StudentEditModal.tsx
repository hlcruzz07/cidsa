import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StudentProps } from '@/lib/custom-types';
import { route } from 'ziggy-js';

interface StudentEditDialogProps {
    student: StudentProps | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Kept so existing callers still compile; nothing is saved from this modal anymore. */
    onSuccess?: () => void;
}

function ReadOnlyField({
    id,
    label,
    value,
    prefix,
    hint,
    className,
}: {
    id: string;
    label: string;
    value?: string | number | null;
    prefix?: string;
    hint?: string;
    className?: string;
}) {
    return (
        <div className={`flex flex-col gap-2 ${className ?? ''}`}>
            <div className="flex items-center justify-between">
                <Label htmlFor={id}>{label}</Label>
                {hint && (
                    <span className="text-xs text-muted-foreground">
                        {hint}
                    </span>
                )}
            </div>
            <div className="relative">
                {prefix && (
                    <span className="absolute left-2 flex h-full items-center justify-center text-sm">
                        {prefix}
                    </span>
                )}
                <Input
                    id={id}
                    type="text"
                    readOnly
                    placeholder="—"
                    value={
                        value === null || value === undefined
                            ? ''
                            : String(value)
                    }
                    className={prefix ? 'ps-9' : undefined}
                />
            </div>
        </div>
    );
}

const joinName = (...parts: Array<string | null | undefined>) =>
    parts.filter(Boolean).join(' ');

export function StudentEditModal({
    student,
    open,
    onOpenChange,
}: StudentEditDialogProps) {
    if (!student) return null;

    const collegeLabel = student.college
        ? student.college_name
            ? `${student.college} - ${student.college_name}`
            : student.college
        : '';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl!">
                <DialogHeader>
                    <DialogTitle>Student Details</DialogTitle>
                    <DialogDescription>
                        Review the student's personal, academic, and contact
                        information.
                    </DialogDescription>
                </DialogHeader>

                {(student.picture || student.e_signature) && (
                    <div className="flex gap-4">
                        {student.picture && (
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-muted-foreground">
                                    Picture
                                </span>
                                <img
                                    src={route('gdrive.image', student.picture)}
                                    alt="Student Picture"
                                    className="h-32 w-28 rounded-md object-cover shadow-md"
                                    loading="lazy"
                                />
                            </div>
                        )}
                        {student.e_signature && (
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-muted-foreground">
                                    E-Signature
                                </span>
                                <img
                                    src={route(
                                        'gdrive.image',
                                        student.e_signature,
                                    )}
                                    alt="Student Signature"
                                    className="h-32 w-48 rounded-md object-contain shadow-md"
                                    loading="lazy"
                                />
                            </div>
                        )}
                    </div>
                )}

                <div className="no-scrollbar -mx-4 max-h-[50vh] space-y-5 overflow-y-auto px-4">
                    <Heading
                        title="Personal Information"
                        description="Student information."
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                        <ReadOnlyField
                            id="id_number"
                            label="Student ID Number"
                            value={student.id_number}
                        />
                        <ReadOnlyField
                            id="full_name"
                            label="Name"
                            value={joinName(
                                student.first_name,
                                student.middle_init,
                                student.last_name,
                                student.suffix,
                            )}
                        />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <ReadOnlyField
                            id="campus"
                            label="Campus"
                            value={student.campus}
                        />
                        <ReadOnlyField
                            id="college"
                            label="College"
                            value={collegeLabel}
                        />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <ReadOnlyField
                            id="program"
                            label="Program"
                            value={student.program}
                        />
                        <ReadOnlyField
                            id="major"
                            label="Major"
                            value={student.major}
                        />
                    </div>

                    <ReadOnlyField
                        id="year"
                        label="Year Level"
                        value={student.year}
                    />

                    <Heading
                        title="In-Case of Emergency Contact Information"
                        description="The person we can contact during emergencies."
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                        <ReadOnlyField
                            id="emergency_name"
                            label="Emergency Contact Name"
                            value={joinName(
                                student.emergency_first_name,
                                student.emergency_middle_init,
                                student.emergency_last_name,
                                student.emergency_suffix,
                            )}
                        />
                        <ReadOnlyField
                            id="relationship"
                            label="Relationship"
                            value={student.relationship}
                        />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <ReadOnlyField
                            id="contact_number"
                            label="Contact Number"
                            prefix="+63"
                            value={student.contact_number}
                        />
                        <ReadOnlyField
                            id="province"
                            label="Province"
                            value={student.province}
                        />
                        <ReadOnlyField
                            id="city"
                            label="City / Municipality"
                            value={student.city}
                        />
                        <ReadOnlyField
                            id="barangay"
                            label="Barangay"
                            value={student.barangay}
                        />
                        <ReadOnlyField
                            id="zip_code"
                            label="Zip Code"
                            value={student.zip_code}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
