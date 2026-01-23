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
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { route } from 'ziggy-js';
type ConfirmModalProp = {
    open: boolean;
    onClose: () => void;
};
export function CancelModal({ open, onClose }: ConfirmModalProp) {
    const [processing, setProcessing] = useState(false);
    const handleConfirm = () => {
        setProcessing(true);

        router.post(
            route('student.cancel'),
            {},
            {
                onError: (err) => {
                    setProcessing(false);
                    console.error('Error cancelling submission:', err);
                },
            },
        );
    };
    return (
        <AlertDialog open={open || processing} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Submission?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to cancel your submission? Any
                        information you have entered will be discarded, and you
                        will need to start over if you wish to submit again.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={processing}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        type="submit"
                        disabled={processing}
                    >
                        {processing ? (
                            <>
                                <Spinner /> Loading...
                            </>
                        ) : (
                            'Confirm'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
