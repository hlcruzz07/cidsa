import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePage } from '@inertiajs/react';
import { DownloadIcon } from 'lucide-react';
import { route } from 'ziggy-js';

type PageProps = {
    students: StudentProps[];
};

type StudentProps = {
    id: number;
    id_number: string;
    first_name: string;
    middle_init: string | null;
    last_name: string;
    suffix: string | null;
    program: string;
    college: string;
    college_name: string;
    year_level: string;
    campus: string;
    emergency_first_name: string;
    emergency_middle_init: string | null;
    emergency_last_name: string;
    emergency_suffix: string | null;
    barangay: string;
    city: string;
    zip_code: string;
    contact_number: string;
    province: string;
    email: string;
    created_at: string;
    updated_at: string;
};
export default function Index() {
    const { students } = usePage<PageProps>().props;

    console.log(students);

    const formatFullName = (s: StudentProps) => {
        return `${(s.first_name || '').toUpperCase()} ${s.middle_init ? ' ' + s.middle_init.toUpperCase() + '.' : ''} ${(s.last_name || '').toUpperCase()}${s.suffix ? ' ' + s.suffix.toUpperCase() + '.' : ''}`.trim();
    };

    const formatEmergencyName = (s: StudentProps) => {
        return `${(s.emergency_first_name || '').toUpperCase()}${s.emergency_middle_init ? ' ' + s.emergency_middle_init.toUpperCase() + '.' : ''} ${(s.emergency_last_name || '').toUpperCase()}${s.emergency_suffix ? ' ' + s.emergency_suffix.toUpperCase() : ''}`.trim();
    };

    const formatContact = (s: StudentProps) => {
        const n = s.contact_number || '';
        if (n.length <= 3) return n;
        return `0${n.slice(0, 3)}-${n.slice(3)}`;
    };

    const exportStudents = async () => {
        if (!students || students.length === 0) return;

        window.location.href = route('export.students.zip', {
            students,
        });
    };

    return (
        <div className="mx-auto flex h-screen max-w-10/12 flex-col overflow-hidden px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
                <h1 className="text-xl font-bold">Export Preview</h1>
                <p className="text-sm text-foreground/75">
                    Total entries: <Badge> {students.length}</Badge>
                </p>
            </div>
            <div className="relative grow overflow-auto md:shadow-md lg:border">
                <table className="table w-full text-left text-xs text-foreground">
                    <thead className="text sticky top-0 bg-white text-foreground/75 lg:border-b dark:bg-black">
                        <tr>
                            <th scope="col" className="p-3">
                                RecordID
                            </th>
                            <th scope="col" className="p-3">
                                Field1
                            </th>
                            <th scope="col" className="p-3">
                                Field2
                            </th>
                            <th scope="col" className="p-3">
                                Field3
                            </th>
                            <th scope="col" className="p-3">
                                Field4
                            </th>
                            <th scope="col" className="p-3">
                                Field5
                            </th>
                            <th scope="col" className="p-3">
                                Field6
                            </th>
                            <th scope="col" className="p-3">
                                Field7
                            </th>
                            <th scope="col" className="p-3">
                                Field8
                            </th>
                            <th scope="col" className="p-3">
                                Field9
                            </th>
                            <th scope="col" className="p-3">
                                Field10
                            </th>
                            <th scope="col" className="p-3">
                                Field11
                            </th>
                            <th scope="col" className="p-3">
                                Field12
                            </th>
                            <th scope="col" className="p-3">
                                Field13
                            </th>
                            <th scope="col" className="p-3">
                                Field14
                            </th>
                            <th scope="col" className="p-3">
                                Field15
                            </th>
                            <th scope="col" className="p-3">
                                Field16
                            </th>
                            <th scope="col" className="p-3">
                                CardColour
                            </th>
                            <th scope="col" className="p-3">
                                DateCreated
                            </th>
                            <th scope="col" className="p-3">
                                CardLayout
                            </th>
                            <th scope="col" className="p-3">
                                PrintFlag
                            </th>
                            <th scope="col" className="p-3">
                                Reprint
                            </th>
                            <th scope="col" className="p-3">
                                LastPrinted
                            </th>
                            <th scope="col" className="p-3">
                                Field17
                            </th>
                            <th scope="col" className="p-3">
                                Blank
                            </th>
                            <th scope="col" className="p-3">
                                ExternalLink
                            </th>
                            <th scope="col" className="p-3">
                                Dup
                            </th>
                            <th scope="col" className="p-3">
                                ExcludeFlag
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {(students || []).map((student, idx) => (
                            <tr className="hover:bg-muted/50" key={idx}>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="RecordID"
                                ></td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="Field1"
                                >
                                    {student.program}
                                </td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="Field2"
                                >
                                    {formatFullName(student)}
                                </td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="Field3"
                                >
                                    {student.id_number}
                                </td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="Field4"
                                ></td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="Field5"
                                >
                                    {student.college_name}
                                </td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="Field6"
                                ></td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="Field7"
                                ></td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="Field8"
                                >
                                    {formatEmergencyName(student)}
                                </td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="Field9"
                                >{`${student.barangay || ''}${student.city ? ', ' + student.city : ''}${student.zip_code ? ', ' + student.zip_code : ''}`}</td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="Field10"
                                >
                                    {formatContact(student)}
                                </td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="Field11"
                                >
                                    {student.province}
                                </td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="Field12"
                                ></td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="Field13"
                                ></td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="Field14"
                                ></td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="Field15"
                                ></td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="Field16"
                                >
                                    {student.first_name}
                                </td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="CardColour"
                                >
                                    {student.last_name}
                                </td>
                                <td
                                    className="p-3"
                                    data-label="DateCreated"
                                ></td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="CardLayout"
                                >
                                    STUDENT_ID_TALISAY
                                </td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="PrintFlag"
                                ></td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="Reprint"
                                ></td>
                                <td
                                    className="p-3"
                                    data-label="LastPrinted"
                                ></td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="Field17"
                                >
                                    {student.middle_init
                                        ? student.middle_init.toUpperCase()
                                        : ''}
                                </td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="Blank"
                                ></td>
                                <td
                                    className="p-3"
                                    data-label="ExternalLink"
                                ></td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="Dup"
                                ></td>
                                <td
                                    className="p-3 whitespace-nowrap"
                                    data-label="ExcludeFlag"
                                >
                                    0
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex justify-end gap-3">
                <Button variant="outline" onClick={() => window.history.back()}>
                    Back
                </Button>
                <Button onClick={exportStudents}>
                    Download <DownloadIcon />
                </Button>
            </div>
        </div>
    );
}
