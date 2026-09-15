import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle2 } from 'lucide-react';

type SuccessModalProps = {
    open: boolean;
    idNumber?: string | null;
};

export function SuccessModal({ open, idNumber }: SuccessModalProps) {
    return (
        <Dialog open={open}>
            <DialogContent className="sm:max-w-md" showCloseButton={false}>
                <DialogHeader className="items-center text-center">
                    <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                        <CheckCircle2 className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <DialogTitle className="text-xl">
                        Request Submitted!
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        Your student ID request has been received and is now
                        being processed.
                    </DialogDescription>
                </DialogHeader>

                {idNumber && (
                    <div className="rounded-xl border border-dashed border-border bg-muted/40 p-3 text-center">
                        <p className="text-xs text-muted-foreground">
                            ID Number
                        </p>
                        <p className="font-mono text-base font-semibold text-foreground">
                            {idNumber}
                        </p>
                    </div>
                )}

                <p className="text-center text-xs text-muted-foreground">
                    You&apos;ll be notified once your ID is ready for pickup or
                    printing. Keep your ID number handy for reference.
                </p>

                <DialogFooter className="sm:justify-center">
                    <Button
                        onClick={() => (window.location.href = '/')}
                        className="w-full sm:w-auto"
                    >
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
