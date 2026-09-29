import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { InventoryReceiptProps } from '@/lib/custom-types';
import dayjs from 'dayjs';
import { CheckIcon, ClockIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface InventoryReceiptDetailsDialogProps {
    receipt: InventoryReceiptProps | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const formatDateTime = (value: string | null | undefined) =>
    value ? dayjs(value).format('MMM D, YYYY · h:mm A') : '—';

function Detail({
    label,
    children,
    className = '',
}: {
    label: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            <dt className="text-xs font-medium text-muted-foreground">
                {label}
            </dt>
            <dd className="text-sm break-words text-foreground">{children}</dd>
        </div>
    );
}

export function InventoryReceiptDetailsDialog({
    receipt,
    open,
    onOpenChange,
}: InventoryReceiptDetailsDialogProps) {
    const isReceived = !!receipt?.received_at;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {receipt?.ref_no ?? 'Receipt Details'}
                        {receipt &&
                            (isReceived ? (
                                <Badge>
                                    <CheckIcon className="h-2.5 w-2.5" />{' '}
                                    Received
                                </Badge>
                            ) : (
                                <Badge variant="outline">
                                    <ClockIcon className="h-2.5 w-2.5" />{' '}
                                    Pending
                                </Badge>
                            ))}
                    </DialogTitle>
                    <DialogDescription>
                        Full details of this inventory receipt.
                    </DialogDescription>
                </DialogHeader>

                {receipt && (
                    <div className="flex flex-col gap-4">
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <Detail label="Reference No.">
                                <span className="font-medium">
                                    {receipt.ref_no}
                                </span>
                            </Detail>
                            <Detail label="Campus">
                                {receipt.stock?.campus ?? '—'}
                            </Detail>
                            <Detail label="Quantity">
                                <span className="font-medium tabular-nums">
                                    {receipt.quantity.toLocaleString()}
                                </span>
                            </Detail>
                            <Detail label="Delivered By">
                                {receipt.delivered_by ?? '—'}
                            </Detail>
                        </dl>

                        <Separator />

                        <dl className="grid gap-4 sm:grid-cols-2">
                            <Detail label="Received By">
                                {receipt.receiver?.name ?? '—'}
                            </Detail>
                            <Detail label="Received At">
                                <span
                                    className={
                                        isReceived
                                            ? 'font-medium text-green-600 dark:text-green-500'
                                            : ''
                                    }
                                >
                                    {formatDateTime(receipt.received_at)}
                                </span>
                            </Detail>
                            <Detail label="Created">
                                {formatDateTime(receipt.created_at)}
                            </Detail>
                            <Detail label="Last Updated">
                                {formatDateTime(receipt.updated_at)}
                            </Detail>
                        </dl>

                        <Separator />

                        <dl>
                            <Detail label="Remarks">
                                {receipt.remarks ? (
                                    <span className="block max-h-40 overflow-y-auto whitespace-pre-wrap">
                                        {receipt.remarks}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">
                                        No remarks.
                                    </span>
                                )}
                            </Detail>
                        </dl>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
