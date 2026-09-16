import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { StudentProps } from '@/lib/custom-types';
import { CheckCircle2, Clock3, XCircle } from 'lucide-react';

type StudentStatus =
    | { status: 'none' }
    | { status: 'unprinted' | 'printed'; student: StudentProps }
    | null;

export default function StudentStatusModal({
    open,
    setOpen,
    result,
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    result: StudentStatus;
}) {
    if (!result) return null;

    const config = {
        none: {
            icon: XCircle,
            iconClass: 'bg-destructive/10 text-destructive',
            title: 'No Record Found',
        },
        unprinted: {
            icon: Clock3,
            iconClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            title: 'Pending Request',
        },
        printed: {
            icon: CheckCircle2,
            iconClass:
                'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            title: 'ID Printed',
        },
    } as const;

    const { icon: Icon, iconClass, title } = config[result.status];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="border-border bg-background text-foreground sm:max-w-md">
                <DialogHeader className="items-center text-center">
                    <div
                        className={`flex h-14 w-14 items-center justify-center rounded-full ${iconClass}`}
                    >
                        <Icon className="h-7 w-7" />
                    </div>
                    <DialogTitle className="mt-3 text-lg font-semibold tracking-tight text-foreground">
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <DialogDescription asChild>
                    <div className="mt-2 text-sm text-muted-foreground">
                        {result.status === 'none' && (
                            <p className="text-center leading-relaxed">
                                We couldn't find a submission matching that ID
                                number and last name. Please ensure you have
                                completed the Student Information Form prior to
                                checking your status.
                            </p>
                        )}

                        {(result.status === 'unprinted' ||
                            result.status === 'printed') && (
                            <div className="space-y-4">
                                {/* Student Info Card */}
                                <div className="space-y-2 rounded-lg border border-border bg-card p-3.5 text-card-foreground shadow-sm">
                                    <div className="flex items-center justify-between border-b border-border/50 pb-2 text-xs">
                                        <span className="font-medium text-muted-foreground">
                                            ID Number
                                        </span>
                                        <span className="font-mono font-semibold text-foreground">
                                            {result.student.id_number}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-0.5 text-xs">
                                        <span className="font-medium text-muted-foreground">
                                            Student Name
                                        </span>
                                        <span className="font-medium text-foreground">
                                            {[
                                                result.student.first_name,
                                                result.student.middle_init,
                                                result.student.last_name,
                                                result.student.suffix,
                                            ]
                                                .filter(Boolean)
                                                .join(' ')}
                                        </span>
                                    </div>
                                </div>

                                {/* Unprinted State Message */}
                                {result.status === 'unprinted' && (
                                    <p className="px-2 text-center text-xs leading-relaxed text-muted-foreground">
                                        Thank you for submitting your
                                        identification document. Your request is
                                        currently being processed. Physical ID
                                        printing is pending; please check back
                                        later for updates.
                                    </p>
                                )}

                                {/* Printed State Details */}
                                {result.status === 'printed' &&
                                    result.student.printed && (
                                        <div className="rounded-lg border border-border/50 bg-muted/50 p-3 text-center">
                                            <span className="text-xs text-muted-foreground">
                                                Printed on:{' '}
                                            </span>
                                            <span className="text-xs font-medium text-foreground">
                                                {new Date(
                                                    result.student.printed.created_at,
                                                ).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                </DialogDescription>
            </DialogContent>
        </Dialog>
    );
}
