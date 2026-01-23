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

type WarningType =
    | 'noStudents'
    | 'hasIncomplete'
    | 'hasExported'
    | 'maxExceeded';

type ModalProps = {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    warningType: WarningType;
    onConfirm?: () => void;
};

export function WarningModal({
    isOpen,
    setIsOpen,
    warningType,
    onConfirm,
}: ModalProps) {
    const warningMap: Record<WarningType, { title: string; message: string }> =
        {
            noStudents: {
                title: 'No Students Found',
                message:
                    'There are currently no students to process. Please add students before exporting.',
            },
            hasIncomplete: {
                title: 'Incomplete Student Data',
                message:
                    'Some students have incomplete information. Please review their details before proceeding.',
            },
            hasExported: {
                title: 'Students Already Exported',
                message:
                    'Some students have already been exported. Continuing may overwrite existing records.',
            },
            maxExceeded: {
                title: 'Export Limit Reached',
                message:
                    'You can only export a maximum of 500 students at a time. Please reduce your selection or export in batches.',
            },
        };

    const { title, message } = warningMap[warningType];

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{message}</AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>

                    {warningType !== 'maxExceeded' && (
                        <AlertDialogAction
                            onClick={() => {
                                onConfirm?.();
                                setIsOpen(false);
                            }}
                        >
                            Confirm
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
