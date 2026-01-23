import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CircleCheck } from 'lucide-react';

interface SuccessModalProps {
    open: boolean;
    onClose?: () => void;
}

export default function SuccessModal({ open }: SuccessModalProps) {
    return (
        <Dialog open={open}>
            <DialogContent className="max-w-xl">
                <DialogHeader className="flex flex-col items-center gap-4">
                    <CircleCheck
                        className="text-[var(--main-color)] dark:text-green-500"
                        size={60}
                    />
                    <DialogTitle className="text-center text-2xl font-medium text-[var(--main-color)] dark:text-green-500">
                        Student Info Submitted
                    </DialogTitle>
                </DialogHeader>

                <DialogDescription className="text-center text-[var(--text-color)] dark:text-[var(--text-color-dark)]">
                    The updates to your <b>Student ID</b> information have been
                    successfully saved in our system. Please retain this
                    confirmation for your records.
                </DialogDescription>

                <p className="text-center text-sm text-[var(--text-color)] dark:text-[var(--text-color-dark)]">
                    If you have any questions or concerns, feel free to contact
                    our office through our official Facebook page{' '}
                    <a
                        href="https://www.facebook.com/people/CHMSU-ICT-MIS-Support/61561132092022/"
                        target="_blank"
                        className="text-[var(--main-color)] underline dark:text-green-500"
                    >
                        CHMSU ICT MIS Support
                    </a>{' '}
                    or visit us directly during office hours.
                </p>

                <DialogFooter>
                    <Button asChild className="mx-auto">
                        <a href="/">Confirm</a>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
