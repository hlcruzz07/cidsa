import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';
import { useState } from 'react';
import { route } from 'ziggy-js';
type ExportModalProps = {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    name: string;
    id: number;
    onSuccess: () => void;
};
export function ConfirmExport({
    isOpen,
    setIsOpen,
    name,
    id,
    onSuccess,
}: ExportModalProps) {
    const [processing, setProcessing] = useState(false);

    const exportStudentsById = (id: number) => {
        if (processing) return;

        setProcessing(true);

        window.location.href = route('export.student.id', { id });
        setProcessing(false);
        onSuccess();
    };
    return (
        <AlertDialog open={isOpen || processing} onOpenChange={setIsOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Export Student Data </AlertDialogTitle>
                    <AlertDialogDescription>
                        {' '}
                        Are you sure you want to export for <b>{name}</b>? This
                        action will generate a zip file containing the student
                        data.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>

                    <AlertDialogAction
                        onClick={() => exportStudentsById(id)}
                        disabled={processing}
                    >
                        {processing ? (
                            <>
                                Exporting... <Spinner />
                            </>
                        ) : (
                            <>Export</>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
