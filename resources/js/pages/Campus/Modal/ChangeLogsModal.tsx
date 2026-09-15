import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StudentProps } from '@/lib/custom-types';
import dayjs from 'dayjs';
import { HistoryIcon } from 'lucide-react';

interface ChangeLogsModalProps {
    student: StudentProps | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function formatFieldLabel(field: string) {
    return field
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function formatValue(value: unknown) {
    if (value === null || value === undefined || value === '') {
        return '—';
    }
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }
    return String(value);
}

export function ChangeLogsModal({
    student,
    open,
    onOpenChange,
}: ChangeLogsModalProps) {
    const logs = student?.change_logs ?? [];

    const fullName = student
        ? [
              student.first_name,
              student.middle_init ? student.middle_init + '.' : '',
              student.last_name,
              student.suffix ? student.suffix + '.' : '',
          ]
              .filter(Boolean)
              .join(' ')
        : '';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <HistoryIcon className="h-4 w-4" />
                        Information Update History
                    </DialogTitle>
                    <DialogDescription>
                        {student
                            ? `Record of edits made to ${fullName}'s submission.`
                            : 'Record of edits made to this submission.'}
                    </DialogDescription>
                </DialogHeader>

                {logs.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        No changes have been recorded for this student.
                    </p>
                ) : (
                    <ScrollArea className="max-h-[60vh] pr-3">
                        <div className="flex flex-col gap-4">
                            {logs
                                .slice()
                                .sort(
                                    (a, b) =>
                                        dayjs(b.created_at).valueOf() -
                                        dayjs(a.created_at).valueOf(),
                                )
                                .map((log) => (
                                    <div
                                        key={log.id}
                                        className="rounded-lg border p-3"
                                    >
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {dayjs(log.created_at).format(
                                                    'MMM D, YYYY · h:mm A',
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            {log.changed_fields.map((field) => (
                                                <div
                                                    key={field}
                                                    className="text-xs"
                                                >
                                                    <span className="font-medium text-foreground">
                                                        {formatFieldLabel(
                                                            field,
                                                        )}
                                                    </span>
                                                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                                        <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-red-600 line-through dark:text-red-400">
                                                            {formatValue(
                                                                log
                                                                    .previous_values[
                                                                    field
                                                                ],
                                                            )}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            →
                                                        </span>
                                                        <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-green-600 dark:text-green-400">
                                                            {formatValue(
                                                                log.new_values[
                                                                    field
                                                                ],
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    );
}
