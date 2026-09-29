import {
    CheckCircle2,
    Circle,
    FileSpreadsheet,
    Loader2,
    XCircle,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';

export type ExportPhase =
    | 'idle'
    | 'fetching'
    | 'downloading'
    | 'done'
    | 'error';

interface ExportStatusDialogProps {
    open: boolean;
    phase: ExportPhase;
    receivedBytes: number;
    errorMessage: string | null;
    onClose: () => void;
}

const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

type StepState = 'pending' | 'active' | 'done' | 'error';

function Step({
    state,
    label,
    detail,
}: {
    state: StepState;
    label: string;
    detail?: string;
}) {
    return (
        <li className="flex items-start gap-3">
            <span className="mt-0.5">
                {state === 'done' && (
                    <CheckCircle2 className="size-5 text-green-600" />
                )}
                {state === 'active' && (
                    <Loader2 className="size-5 animate-spin text-primary" />
                )}
                {state === 'error' && (
                    <XCircle className="size-5 text-destructive" />
                )}
                {state === 'pending' && (
                    <Circle className="size-5 text-muted-foreground/40" />
                )}
            </span>
            <span className="flex flex-col">
                <span
                    className={
                        state === 'pending'
                            ? 'text-sm text-muted-foreground'
                            : 'text-sm font-medium'
                    }
                >
                    {label}
                </span>
                {detail && (
                    <span className="text-xs text-muted-foreground">
                        {detail}
                    </span>
                )}
            </span>
        </li>
    );
}

export function ExportStatusDialog({
    open,
    phase,
    receivedBytes,
    errorMessage,
    onClose,
}: ExportStatusDialogProps) {
    const isRunning = phase === 'fetching' || phase === 'downloading';

    // Step 1 covers fetching the student data and generating the Excel file.
    // Both happen on the server before the first byte arrives, so they're
    // shown as one step.
    const step1: StepState =
        phase === 'fetching'
            ? 'active'
            : phase === 'error' && receivedBytes === 0
              ? 'error'
              : 'done';

    const step2: StepState =
        phase === 'downloading'
            ? 'active'
            : phase === 'done'
              ? 'done'
              : phase === 'error' && receivedBytes > 0
                ? 'error'
                : 'pending';

    const title =
        phase === 'done'
            ? 'Export complete'
            : phase === 'error'
              ? 'Export failed'
              : 'Exporting student status';

    const description =
        phase === 'done'
            ? 'Your Excel file has been downloaded.'
            : phase === 'error'
              ? (errorMessage ?? 'Something went wrong. Please try again.')
              : 'Please keep this window open until the download finishes.';

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                // Can't be dismissed while the export is still running.
                if (!next && !isRunning) onClose();
            }}
        >
            <DialogContent
                className="sm:max-w-md"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => {
                    if (isRunning) e.preventDefault();
                }}
            >
                <DialogHeader>
                    <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-green-600/10">
                        <FileSpreadsheet className="size-6 text-green-600" />
                    </div>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <ul className="flex flex-col gap-4 py-2">
                    <Step
                        state={step1}
                        label="Fetching student data and generating Excel file"
                        detail={
                            phase === 'fetching'
                                ? 'This can take a while for large campuses.'
                                : undefined
                        }
                    />
                    <Step
                        state={step2}
                        label="Downloading file"
                        detail={
                            receivedBytes > 0
                                ? `${formatBytes(receivedBytes)} received`
                                : undefined
                        }
                    />
                </ul>

                {(phase === 'done' || phase === 'error') && (
                    <DialogFooter>
                        <Button
                            variant={phase === 'error' ? 'outline' : 'default'}
                            onClick={onClose}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
