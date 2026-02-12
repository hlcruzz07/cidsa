import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

type SubmittingModalProps = {
    open: boolean;
    progress?: number; // 0 - 100
    status?: string;
};

export function SubmittingModal({
    open,
    progress = 0,
    status = 'Uploading files to Google Drive…',
}: SubmittingModalProps) {
    return (
        <Dialog open={open}>
            <DialogContent
                className="sm:max-w-md"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>Submitting Form</DialogTitle>

                    <DialogDescription className="space-y-4">
                        <p>{status}</p>

                        <Progress value={progress} />

                        <p className="text-sm text-muted-foreground">
                            Please don’t close this window. This may take a
                            moment depending on your internet connection.
                        </p>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}
