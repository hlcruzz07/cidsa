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
import { AsteriskIcon, DownloadIcon, EyeIcon } from 'lucide-react';
import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { StudentProps } from '@/lib/student-types';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

type ExportModalProps = {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onPreview: (student: StudentProps[]) => void;
    students: StudentProps[] | null;
    onLoad: () => void;
};

export default function ExportModal({
    isOpen,
    setIsOpen,
    onPreview,
    students,
    onLoad,
}: ExportModalProps) {
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [exportLimit, setExportLimit] = useState<number | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const resetAll = () => {
        setFileName(null);
        setExportLimit(null);
        setIsPreviewing(false);
        setIsOpen(false);
        onLoad();
    };

    const exportStudents = () => {
        if (!students || students.length === 0) {
            toast.error('Students not found');
            return;
        }

        if (students.length <= 1) {
            toast.error('Students required for export is up to 2-100');
            return;
        }

        if (!fileName) {
            toast.error('Please Enter File Name');
            return;
        }

        if (!exportLimit) {
            toast.error('Please set limit first');
            return;
        }

        if (exportLimit <= 1) {
            toast.error('Limit should be more than 1');
            return;
        }

        if (exportLimit > 100) {
            toast.error('Limit should be more than 1');
            return;
        }

        window.location.href = route('export.students', {
            students: students.slice(0, exportLimit),
            file_name: fileName,
        });

        resetAll();
    };
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Export Students Modal</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                        <Label>
                            Enter File Name
                            <AsteriskIcon color="red" size={12} />
                        </Label>
                        <Input
                            type="text"
                            value={fileName ?? ''}
                            placeholder="Enter File Name"
                            maxLength={25}
                            onChange={(e) => {
                                setFileName(e.target.value);
                            }}
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        <Label>
                            Enter Limit (2-100){' '}
                            <AsteriskIcon color="red" size={12} />
                        </Label>
                        <Input
                            type="text"
                            value={exportLimit ?? ''}
                            placeholder="Enter Student Limit"
                            min={1}
                            max={150}
                            onChange={(e) => {
                                let value = e.target.value;

                                // limit to 3 digits
                                if (value.length > 3) return;

                                let num = Number(value);

                                // enforce max 150
                                if (num > 100) num = 100;

                                setExportLimit(value ? num : null);
                            }}
                        />
                    </div>
                    <p className="text-center text-sm whitespace-nowrap">
                        Ready for exporting:
                        <Badge>
                            {Number(students?.length || 0).toLocaleString()}
                        </Badge>
                    </p>
                </div>

                <DialogFooter className="pt-4">
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                    <Button
                        onClick={() => {
                            if (!students || students.length === 0) return;
                            if (!exportLimit) return;
                             if (!students || students.length === 0) {
                                 toast.error('Students not found');
                                 return;
                             }

                             if (students.length <= 1) {
                                 toast.error(
                                     'Students required for export is up to 2-100',
                                 );
                                 return;
                             }

                             if (!fileName) {
                                 toast.error('Please Enter File Name');
                                 return;
                             }

                             if (!exportLimit) {
                                 toast.error('Please set limit first');
                                 return;
                             }

                             if (exportLimit <= 1) {
                                 toast.error('Limit should be more than 1');
                                 return;
                             }

                             if (exportLimit > 100) {
                                 toast.error('Limit should be more than 1');
                                 return;
                             }
                            setIsPreviewing(true);
                            setTimeout(() => {
                                onPreview(students.slice(0, exportLimit));

                                setIsPreviewing(false);
                            }, 2000);
                        }}
                        disabled={
                            isPreviewing ||
                            students?.length === 0 ||
                            !exportLimit ||
                            exportLimit <= 1
                        }
                        variant="secondary"
                    >
                        {isPreviewing ? (
                            <>
                                Loading... <Spinner />
                            </>
                        ) : (
                            <>
                                Preview <EyeIcon />
                            </>
                        )}
                    </Button>
                    <Button
                        disabled={
                            isPreviewing ||
                            students?.length === 0 ||
                            !exportLimit ||
                            exportLimit <= 1
                        }
                        onClick={exportStudents}
                    >
                        Download <DownloadIcon />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
