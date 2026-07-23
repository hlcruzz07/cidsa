import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { StudentProps } from '@/lib/custom-types';
import dayjs from 'dayjs';
import { CheckCheckIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AlertReplacementProps {
    data: {
        id: number;
        reason: string | null;
        created_at: string;
        student: StudentProps;
    };
    open: boolean;
    setOpen: (open: boolean) => void;
}

export default function AlertReplacement({
    data,
    open,
    setOpen,
}: AlertReplacementProps) {
    const [disabled, setDisabled] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDisabled(false);
        }, 5000);

        return () => clearTimeout(timer);
    }, []);
    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="sm:max-w-lg">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Previous Replacement Request Found
                    </AlertDialogTitle>

                    <AlertDialogDescription asChild>
                        <div className="space-y-4 text-sm text-muted-foreground">
                            <p>
                                Hello <strong>{data.student.first_name}</strong>
                                , our records show that you have previously
                                applied for a replacement ID, and your
                                replacement ID has already been printed.
                            </p>

                            <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
                                <div className="flex justify-between">
                                    <span className="font-medium">
                                        ID Number
                                    </span>
                                    <span>{data.student.id_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Name</span>
                                    <span>
                                        {[
                                            data.student.first_name,
                                            data.student.middle_init
                                                ? data.student.middle_init + '.'
                                                : '',
                                            data.student.last_name,
                                            data.student.suffix
                                                ? data.student.suffix + '.'
                                                : '',
                                        ]
                                            .filter(Boolean)
                                            .join(' ')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Campus</span>
                                    <span>{data.student.campus} Campus</span>
                                </div>
                                {data.reason && (
                                    <div className="flex justify-between">
                                        <span className="font-medium">
                                            Previous Request Reason
                                        </span>
                                        <span className="truncate">
                                            {data.reason}
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    <span className="font-medium">
                                        Date Printed Request
                                    </span>
                                    <span>
                                        {dayjs(data.created_at).format(
                                            'MMM D, YYYY - h:mm A',
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-md border border-border bg-accent p-3 text-accent-foreground">
                                You are eligible to submit another replacement
                                request if your ID has been lost, damaged, or
                                requires replacement for another valid reason.
                                Please ensure that you provide the required
                                supporting documents before proceeding.
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogAction
                        onClick={() => setOpen(false)}
                        disabled={disabled}
                    >
                        <CheckCheckIcon /> Yes, I Understand
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
