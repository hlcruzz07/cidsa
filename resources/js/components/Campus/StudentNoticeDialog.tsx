import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { StudentProps } from '@/lib/custom-types';
import { NOTICE_TEMPLATES } from '@/lib/notice-templates';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { CheckIcon, ChevronDownIcon, Loader2, SendIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

const MAX_LENGTH = 250;
const DATE_FORMAT = 'MMM D, YYYY · h:mm A';

type Notice = NonNullable<StudentProps['notices']>[number];

interface StudentNoticeModalProps {
    student: StudentProps | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: string;
    onSuccess?: () => void;
    /** Overrides the printed check. Replacement requests pass their own
     *  is_printed, since the student's original ID is already printed. */
    printed?: boolean;
}

function SectionLabel({
    children,
    aside,
}: {
    children: React.ReactNode;
    aside?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                {children}
            </h3>
            {aside}
        </div>
    );
}

function PostedBy({ notice }: { notice: Notice }) {
    return (
        <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
                {notice.user?.name ?? 'Unknown user'}
            </span>
            {notice.user?.role && (
                <span className="capitalize"> ({notice.user.role})</span>
            )}
            {notice.created_at && (
                <> · {dayjs(notice.created_at).format(DATE_FORMAT)}</>
            )}
        </p>
    );
}

export function StudentNoticeDialog({
    student,
    open,
    onOpenChange,
    type,
    onSuccess,
    printed,
}: StudentNoticeModalProps) {
    const [resolvingId, setResolvingId] = useState<number | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    // Notices resolved in this session (id -> resolved time). They leave the
    // active list and join the history immediately, without waiting on the
    // parent's refetch. Ids are never reused, so this never needs a reset.
    const [resolvedNow, setResolvedNow] = useState<Record<number, string>>({});

    const { data, setData, post, processing, errors, reset, transform } =
        useForm({
            id_number: '',
            type,
            message: '',
        });

    const activeNotices = (student?.notices ?? []).filter(
        (n) =>
            !n.deleted_at &&
            n.type === type &&
            !(n.id !== undefined && n.id in resolvedNow),
    );

    // Server-side resolved notices + the ones resolved in this session.
    const history: Notice[] = [
        ...(student?.notices ?? [])
            .filter((n) => n.id !== undefined && n.id in resolvedNow)
            .map((n) => ({ ...n, deleted_at: resolvedNow[n.id!] })),
        ...(student?.resolved_notices ?? []).filter(
            (n) =>
                n.type === type && !(n.id !== undefined && n.id in resolvedNow),
        ),
    ].sort(
        (a, b) => dayjs(b.deleted_at).valueOf() - dayjs(a.deleted_at).valueOf(),
    );

    const hasActiveNotice = activeNotices.length > 0;
    const isPrinted = printed ?? !!student?.printed;

    const fullName = student
        ? [
              student.first_name,
              student.middle_init,
              student.last_name,
              student.suffix,
          ]
              .filter(Boolean)
              .join(' ')
              .toUpperCase()
        : '';

    const status = hasActiveNotice
        ? { label: 'On hold', variant: 'destructive' as const }
        : isPrinted
          ? { label: 'Printed', variant: 'secondary' as const }
          : { label: 'Clear', variant: 'outline' as const };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!student || isPrinted || hasActiveNotice || !data.message.trim())
            return;

        transform((d) => ({
            ...d,
            id_number: student.id_number,
            type,
            message: d.message.trim(),
        }));

        post(route('student-notices.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset('message');
                onOpenChange(false);
                onSuccess?.();
            },
            onError: (errs) => {
                toast.error(errs.message ?? 'Failed to send the notice.');
            },
        });
    };

    const handleResolve = (id?: number) => {
        if (!id) return;
        setResolvingId(id);

        router.delete(route('student-notices.destroy', id), {
            preserveScroll: true,
            onSuccess: () => {
                setResolvedNow((prev) => ({
                    ...prev,
                    [id]: new Date().toISOString(),
                }));
                onSuccess?.();
            },
            onError: () => toast.error('Failed to resolve the notice.'),
            onFinish: () => setResolvingId(null),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] gap-6 overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center justify-between gap-3 pr-6">
                        <DialogTitle>Notices</DialogTitle>
                        <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <DialogDescription>
                        <span className="font-medium text-foreground">
                            {fullName}
                        </span>
                        {student?.id_number && (
                            <span> · {student.id_number}</span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {/* Active notice */}
                {hasActiveNotice && (
                    <section className="space-y-2">
                        <SectionLabel>Active notice</SectionLabel>
                        {activeNotices.map((notice) => (
                            <div
                                key={notice.id}
                                className="space-y-4 rounded-lg border bg-muted/30 p-4"
                            >
                                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                                    {notice.message}
                                </p>
                                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                                    <PostedBy notice={notice} />
                                    <Button
                                        type="button"
                                        size="sm"
                                        title="Mark as resolved (allows printing again)"
                                        disabled={resolvingId === notice.id}
                                        onClick={() => handleResolve(notice.id)}
                                    >
                                        {resolvingId === notice.id ? (
                                            <Loader2 className="animate-spin" />
                                        ) : (
                                            <CheckIcon />
                                        )}
                                        Mark as resolved
                                    </Button>
                                </div>
                            </div>
                        ))}
                        <p className="text-xs text-muted-foreground">
                            Printing and batch selection stay disabled until
                            this notice is resolved.
                        </p>
                    </section>
                )}

                {/* Send form */}
                {!hasActiveNotice && !isPrinted && (
                    <form onSubmit={handleSend} className="space-y-2">
                        <SectionLabel
                            aside={
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {data.message.length}/{MAX_LENGTH}
                                </span>
                            }
                        >
                            New notice
                        </SectionLabel>

                        {/* Quick templates */}
                        <div className="space-y-2 rounded-lg border p-3">
                            {NOTICE_TEMPLATES.map((group) => (
                                <div
                                    key={group.group}
                                    className="flex flex-wrap items-center gap-1.5"
                                >
                                    <span className="w-20 shrink-0 text-[11px] font-medium text-muted-foreground">
                                        {group.group}
                                    </span>
                                    {group.items.map((item) => (
                                        <button
                                            key={item.label}
                                            type="button"
                                            disabled={processing}
                                            onClick={() =>
                                                setData(
                                                    'message',
                                                    item.message.slice(
                                                        0,
                                                        MAX_LENGTH,
                                                    ),
                                                )
                                            }
                                            className={cn(
                                                'rounded-md border px-2 py-1 text-xs transition-colors hover:bg-muted',
                                                data.message === item.message &&
                                                    'border-primary bg-muted font-medium',
                                            )}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>

                        <Textarea
                            value={data.message}
                            onChange={(e) => setData('message', e.target.value)}
                            placeholder="Pick a template above or describe what the student needs to fix."
                            maxLength={MAX_LENGTH}
                            rows={4}
                            disabled={processing || !student}
                            aria-invalid={!!errors.message}
                        />
                        {errors.message && (
                            <p className="text-sm text-destructive">
                                {errors.message}
                            </p>
                        )}
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-muted-foreground">
                                Appears on the student's SIS digital ID page.
                            </p>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={
                                    processing ||
                                    !student ||
                                    !data.message.trim()
                                }
                            >
                                {processing ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <SendIcon />
                                )}
                                Send notice
                            </Button>
                        </div>
                    </form>
                )}

                {/* Printed: sending is locked */}
                {!hasActiveNotice && isPrinted && (
                    <p className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                        This student's ID has already been printed. Notices can
                        only be sent before printing.
                    </p>
                )}

                {/* Resolved history */}
                <section className="space-y-2">
                    <button
                        type="button"
                        onClick={() => setShowHistory((v) => !v)}
                        aria-expanded={showHistory}
                        className="flex w-full items-center justify-between"
                    >
                        <SectionLabel>
                            Resolved history ({history.length})
                        </SectionLabel>
                        <ChevronDownIcon
                            className={cn(
                                'size-4 text-muted-foreground transition-transform',
                                showHistory && 'rotate-180',
                            )}
                        />
                    </button>

                    {showHistory &&
                        (history.length === 0 ? (
                            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                                No resolved notices.
                            </p>
                        ) : (
                            <ul className="divide-y rounded-lg border">
                                {history.map((notice) => (
                                    <li
                                        key={notice.id}
                                        className="space-y-1.5 p-3"
                                    >
                                        <p className="text-sm break-words whitespace-pre-wrap">
                                            {notice.message}
                                        </p>
                                        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                                            <PostedBy notice={notice} />
                                            {notice.deleted_at && (
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    Resolved{' '}
                                                    {dayjs(
                                                        notice.deleted_at,
                                                    ).format(DATE_FORMAT)}
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ))}
                </section>
            </DialogContent>
        </Dialog>
    );
}
