import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DownloadIcon } from 'lucide-react';
import { route } from 'ziggy-js';

type PreviewModalProps = {
    students: ExportedStudent[] | null;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
};

type ExportedStudent = {
    id: number;
    id_number: string;
    first_name: string;
    middle_init: string | null;
    last_name: string;
    suffix: string | null;
    program: string;
    college: string;
    college_name: string;
    campus: string;
    emergency_first_name: string;
    emergency_middle_init: string | null;
    emergency_last_name: string;
    emergency_suffix: string | null;
    is_exported: boolean;
    is_completed: boolean;
    barangay: string;
    city: string;
    zip_code: string;
    contact_number: string;
    province: string;
    created_at: string;
    updated_at: string;
};

export default function PreviewModal({
    students,
    isOpen,
    setIsOpen,
}: PreviewModalProps) {
    const formatFullName = (s: ExportedStudent) =>
        `${(s.first_name || '').toUpperCase()}${s.middle_init ? ' ' + s.middle_init.toUpperCase() : ''} ${(s.last_name || '').toUpperCase()}${s.suffix ? ' ' + s.suffix.toUpperCase() : ''}`.trim();

    const formatEmergencyName = (s: ExportedStudent) =>
        `${(s.emergency_first_name || '').toUpperCase()}${s.emergency_middle_init ? ' ' + s.emergency_middle_init.toUpperCase() : ''} ${(s.emergency_last_name || '').toUpperCase()}${s.emergency_suffix ? ' ' + s.emergency_suffix.toUpperCase() : ''}`.trim();

    const formatContact = (s: ExportedStudent) => {
        const n = s.contact_number || '';
        if (n.length <= 3) return n;
        return `0${n.slice(0, 3)}-${n.slice(3)}`;
    };

    const exportStudents = () => {
        if (!students || students.length === 0) return;

        window.location.href = route('export.students', {
            students,
        });

        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="flex max-h-10/12 flex-col sm:max-w-10/12">
                <DialogHeader>
                    <DialogTitle>Export Preview</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Total entries: <Badge>{students?.length}</Badge>
                    </p>
                </DialogHeader>

                {/* 📄 TABLE */}
                <div className="relative grow overflow-auto border">
                    <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 border-b bg-background">
                            <tr>
                                {[
                                    'RecordID',
                                    'Field1',
                                    'Field2',
                                    'Field3',
                                    'Field4',
                                    'Field5',
                                    'Field6',
                                    'Field7',
                                    'Field8',
                                    'Field9',
                                    'Field10',
                                    'Field11',
                                    'Field12',
                                    'Field13',
                                    'Field14',
                                    'Field15',
                                    'Field16',
                                    'CardColour',
                                    'DateCreated',
                                    'CardLayout',
                                    'PrintFlag',
                                    'Reprint',
                                    'LastPrinted',
                                    'Field17',
                                    'Blank',
                                    'ExternalLink',
                                    'Dup',
                                    'ExcludeFlag',
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="p-3 whitespace-nowrap"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {students?.map((student, idx) => (
                                <tr key={idx} className="hover:bg-muted/50">
                                    <td className="p-3 whitespace-nowrap"></td>
                                    <td className="p-3 whitespace-nowrap">
                                        {student.program}
                                    </td>
                                    <td className="p-3 whitespace-nowrap">
                                        {formatFullName(student)}
                                    </td>
                                    <td className="p-3 whitespace-nowrap">
                                        {student.id_number}
                                    </td>
                                    <td className="p-3 whitespace-nowrap"></td>
                                    <td className="p-3 whitespace-nowrap">
                                        {student.college_name}
                                    </td>
                                    <td className="p-3 whitespace-nowrap"></td>
                                    <td className="p-3 whitespace-nowrap"></td>
                                    <td className="p-3 whitespace-nowrap">
                                        {formatEmergencyName(student)}
                                    </td>
                                    <td className="p-3 whitespace-nowrap">
                                        {`${student.barangay || ''}${student.city ? ', ' + student.city : ''}${student.zip_code ? ', ' + student.zip_code : ''}`}
                                    </td>
                                    <td className="p-3 whitespace-nowrap">
                                        {formatContact(student)}
                                    </td>
                                    <td className="p-3 whitespace-nowrap">
                                        {student.province}
                                    </td>
                                    <td className="p-3 whitespace-nowrap"></td>
                                    <td className="p-3 whitespace-nowrap"></td>
                                    <td className="p-3 whitespace-nowrap"></td>
                                    <td className="p-3 whitespace-nowrap"></td>
                                    <td className="p-3 whitespace-nowrap">
                                        {student.first_name}
                                    </td>
                                    <td className="p-3 whitespace-nowrap">
                                        {student.last_name}
                                    </td>
                                    <td className="p-3 whitespace-nowrap"></td>
                                    <td className="p-3 whitespace-nowrap">
                                        STUDENT_ID_TALISAY
                                    </td>
                                    <td className="p-3 whitespace-nowrap"></td>
                                    <td className="p-3 whitespace-nowrap"></td>
                                    <td className="p-3 whitespace-nowrap"></td>
                                    <td className="p-3 whitespace-nowrap">
                                        {student.middle_init}
                                    </td>
                                    <td className="p-3 whitespace-nowrap"></td>
                                    <td className="p-3 whitespace-nowrap"></td>
                                    <td className="p-3 whitespace-nowrap"></td>
                                    <td className="p-3 whitespace-nowrap">0</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 🔘 FOOTER */}
                <DialogFooter className="pt-4">
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                    <Button onClick={exportStudents}>
                        Download <DownloadIcon />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
