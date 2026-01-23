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
type ConfirmModalProp = {
    open: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    processing?: boolean; // optional
};
export function ConfirmModal({
    open,
    onClose,
    onConfirm,
    processing = false,
}: ConfirmModalProp) {
    return (
        <AlertDialog open={open || processing} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to submit this step? Once
                        submitted, you cannot go back to edit this information.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={processing}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        type="submit"
                        disabled={processing}
                    >
                        {processing ? (
                            <>
                                <Spinner /> Loading...
                            </>
                        ) : (
                            'Submit'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
