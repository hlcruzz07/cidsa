import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InventoryReceiptProps } from '@/lib/custom-types';
import apiService from '@/services/apiService';
import dayjs from 'dayjs';
import { Loader2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface ConfirmReceiptDialogProps {
    receipt: InventoryReceiptProps | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const nowLocal = () => dayjs().format('YYYY-MM-DDTHH:mm');

export function ConfirmReceiptDialog({
    receipt,
    open,
    onOpenChange,
    onSuccess,
}: ConfirmReceiptDialogProps) {
    const [receivedAt, setReceivedAt] = useState(nowLocal());
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setReceivedAt(nowLocal());
        setError(null);
    }, [open]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!receipt) return;

        setSubmitting(true);
        setError(null);

        try {
            await apiService.patch(
                route('inventory.receipts.receive', receipt.id),
                { received_at: receivedAt || null },
            );

            toast.success('Receipt confirmed and stock updated.');
            onOpenChange(false);
            onSuccess();
        } catch (err: any) {
            if (err?.response?.status === 422) {
                setError(err.response.data?.errors?.received_at?.[0] ?? null);
            } else {
                console.error('Error confirming receipt:', err);
                toast.error(
                    err?.response?.data?.message ??
                        'Failed to confirm receipt. Please try again.',
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={submitting ? undefined : onOpenChange}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Confirm Receipt</DialogTitle>
                    <DialogDescription>
                        {receipt
                            ? `Confirm that ${receipt.quantity.toLocaleString()} item(s) under ${receipt.ref_no} were received. This adds them to your campus stock.`
                            : ''}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="confirm-received-at">Received At</Label>
                        <Input
                            id="confirm-received-at"
                            type="datetime-local"
                            max={nowLocal()}
                            value={receivedAt}
                            onChange={(e) => setReceivedAt(e.target.value)}
                        />
                        {error && (
                            <p className="text-xs text-destructive">{error}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting && (
                                <Loader2Icon className="animate-spin" />
                            )}
                            Confirm Receipt
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
