// components/Student/Modal/SubmissionStatusModal.tsx
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SubmissionStatusModalProps {
    open: boolean;
    status: 'unprinted' | 'printed' | null;
    onUpdateExisting: () => void;
    onSubmitReplacement: () => void;
}

export function SubmissionStatusModal({
    open,
    status,
    onUpdateExisting,
    onSubmitReplacement,
}: SubmissionStatusModalProps) {
    if (!status) return null;

    return (
        <AlertDialog open={open}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {status === 'unprinted'
                            ? 'You already have a pending request'
                            : 'Your ID has already been printed'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {status === 'unprinted'
                            ? "It hasn't been printed yet, so you can update your existing submission instead of starting over."
                            : 'Since your ID was already printed, this form will be submitted as a replacement request.'}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    {status === 'unprinted' ? (
                        <AlertDialogAction onClick={onUpdateExisting}>
                            Update my info
                        </AlertDialogAction>
                    ) : (
                        <AlertDialogAction onClick={onSubmitReplacement}>
                            Continue as replacement
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
