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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { StudentProps } from '@/lib/custom-types';
import axios from 'axios';
import { AsteriskIcon, DownloadIcon, EyeIcon } from 'lucide-react';
import { useState } from 'react';
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
    const [isExporting, setIsExporting] = useState(false);

    const [exportLimit, setExportLimit] = useState<number | null>(null);
    const [fileName, setFileName] = useState('');

    const resetAll = () => {
        setFileName('');
        setExportLimit(null);
        setIsPreviewing(false);
        setIsExporting(false);

        setIsOpen(false);

        onLoad();
    };

    /*
    |--------------------------------------------------------------------------
    | Validation
    |--------------------------------------------------------------------------
    */
    const validate = () => {
        if (!students || students.length === 0) {
            toast.error('Students not found');
            return false;
        }

        if (students.length <= 1) {
            toast.error('Students required for export is up to 2-100');
            return false;
        }

        if (!fileName.trim()) {
            toast.error('Please enter file name');
            return false;
        }

        if (!exportLimit) {
            toast.error('Please set limit first');
            return false;
        }

        if (exportLimit <= 1) {
            toast.error('Limit should be more than 1');
            return false;
        }

        if (exportLimit > 100) {
            toast.error('Limit should not exceed 100');
            return false;
        }

        return true;
    };

    /*
    |--------------------------------------------------------------------------
    | Export Students
    |--------------------------------------------------------------------------
    */
    const exportStudents = async () => {
        if (!validate()) return;

        let toastId: string | number | null = null;

        try {
            setIsExporting(true);

            const payload = {
                student_ids: students!.slice(0, exportLimit!).map((s) => s.id),
                file_name: fileName,
            };

            /*
        |--------------------------------------------------------------------------
        | API Request
        |--------------------------------------------------------------------------
        */
            toastId = toast.loading('Starting export...');

            const response = await axios.post(
                route('export.students'),
                payload,
            );

            const exportId = response.data.export_id;

            if (!exportId) {
                setIsExporting(false);

                toast.error('Export ID not found.', {
                    id: toastId ?? undefined,
                });

                return;
            }

            /*
        |--------------------------------------------------------------------------
        | Polling
        |--------------------------------------------------------------------------
        */
            const poll = setInterval(async () => {
                try {
                    const res = await axios.get(
                        route('exports.status', exportId),
                    );

                    const exportData = res.data;

                    /*
                |--------------------------------------------------------------------------
                | COMPLETED
                |--------------------------------------------------------------------------
                */
                    if (exportData.status === 'completed') {
                        clearInterval(poll);

                        toast.success('Export completed successfully.', {
                            id: toastId ?? undefined,
                        });

                        setIsExporting(false);

                        resetAll();

                        setTimeout(() => {
                            window.location.href = route(
                                'exports.download',
                                exportId,
                            );
                        }, 1000);

                        return;
                    }

                    /*
                |--------------------------------------------------------------------------
                | FAILED
                |--------------------------------------------------------------------------
                */
                    if (exportData.status === 'failed') {
                        clearInterval(poll);

                        setIsExporting(false);

                        toast.error(
                            exportData.error_message ?? 'Export failed.',
                            {
                                id: toastId ?? undefined,
                            },
                        );

                        return;
                    }
                } catch (error) {
                    clearInterval(poll);

                    setIsExporting(false);

                    console.error(error);

                    toast.error('Failed checking export status.', {
                        id: toastId ?? undefined,
                    });
                }
            }, 3000);
        } catch (error) {
            console.error(error);

            setIsExporting(false);

            toast.error('Export failed.', {
                id: toastId ?? undefined,
            });
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Preview
    |--------------------------------------------------------------------------
    */
    const previewStudents = async () => {
        if (!validate()) return;

        try {
            setIsPreviewing(true);

            await new Promise((resolve) => setTimeout(resolve, 1000));

            onPreview(students!.slice(0, exportLimit!));
        } finally {
            setIsPreviewing(false);
        }
    };

    return (
        <Dialog open={isOpen || isExporting} onOpenChange={setIsOpen}>
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
                            value={fileName}
                            placeholder="Enter File Name"
                            maxLength={25}
                            disabled={isPreviewing || isExporting}
                            onChange={(e) => {
                                setFileName(e.target.value);
                            }}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <Label>
                            Enter Limit (2-100)
                            <AsteriskIcon color="red" size={12} />
                        </Label>

                        <Input
                            type="number"
                            value={exportLimit ?? ''}
                            placeholder="Enter Student Limit"
                            min={2}
                            disabled={isPreviewing || isExporting}
                            max={100}
                            onChange={(e) => {
                                let value = e.target.value;

                                if (value.length > 3) return;

                                let num = Number(value);

                                if (num > 100) {
                                    num = 100;
                                }

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
                        <Button
                            variant="outline"
                            disabled={isPreviewing || isExporting}
                        >
                            Close
                        </Button>
                    </DialogClose>

                    <Button
                        onClick={previewStudents}
                        disabled={
                            isPreviewing ||
                            isExporting ||
                            students?.length === 0
                        }
                        variant="secondary"
                    >
                        {isPreviewing ? (
                            <>
                                Loading...
                                <Spinner />
                            </>
                        ) : (
                            <>
                                Preview
                                <EyeIcon />
                            </>
                        )}
                    </Button>

                    <Button
                        onClick={exportStudents}
                        disabled={
                            isPreviewing ||
                            isExporting ||
                            students?.length === 0
                        }
                    >
                        {isExporting ? (
                            <>
                                Exporting...
                                <Spinner />
                            </>
                        ) : (
                            <>
                                Download
                                <DownloadIcon />
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
