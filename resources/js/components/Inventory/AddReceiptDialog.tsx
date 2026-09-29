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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import apiService from '@/services/apiService';
import { Loader2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import InputError from '../input-error';

interface StockOption {
    id: number;
    campus: string;
}

interface AddReceiptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    stocks: StockOption[];
    onSuccess: () => void;
}

type FieldErrors = Record<string, string[]>;

export function AddReceiptDialog({
    open,
    onOpenChange,
    stocks,
    onSuccess,
}: AddReceiptDialogProps) {
    const [stockId, setStockId] = useState<string>('');
    const [quantity, setQuantity] = useState('');
    const [deliveredBy, setDeliveredBy] = useState('');
    const [remarks, setRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<FieldErrors>({});

    // Fresh form every time the dialog opens.
    useEffect(() => {
        if (!open) return;
        setStockId('');
        setQuantity('');
        setDeliveredBy('');
        setRemarks('');
        setErrors({});
    }, [open]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        try {
            await apiService.post(route('inventory.receipts.store'), {
                inventory_stock_id: stockId ? Number(stockId) : null,
                quantity: quantity ? Number(quantity) : null,
                delivered_by: deliveredBy.trim() || null,
                remarks: remarks.trim() || null,
            });

            toast.success('Receipt added. Waiting for the campus to confirm.');
            onOpenChange(false);
            onSuccess();
        } catch (err: any) {
            if (err?.response?.status === 422) {
                setErrors(err.response.data?.errors ?? {});
            } else {
                console.error('Error adding receipt:', err);
                toast.error(
                    err?.response?.data?.message ??
                        'Failed to add receipt. Please try again.',
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
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add Receipt</DialogTitle>
                    <DialogDescription>
                        Record a delivery for a campus. It stays pending until a
                        user from that campus confirms it and sets the received
                        date. The reference number is generated automatically.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="receipt-campus">Campus</Label>
                        <Select value={stockId} onValueChange={setStockId}>
                            <SelectTrigger id="receipt-campus">
                                <SelectValue placeholder="Select campus" />
                            </SelectTrigger>
                            <SelectContent>
                                {stocks.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        {s.campus}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <InputError message={errors.inventory_stock_id?.[0]} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="receipt-quantity">Quantity</Label>
                            <Input
                                id="receipt-quantity"
                                type="number"
                                min={1}
                                placeholder="e.g. 200"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />

                            <InputError message={errors.quantity?.[0]} />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="receipt-delivered">
                                Delivered By
                            </Label>
                            <Input
                                id="receipt-delivered"
                                placeholder="Supplier / courier"
                                value={deliveredBy}
                                onChange={(e) => setDeliveredBy(e.target.value)}
                            />

                            <InputError message={errors.delivered_by?.[0]} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="receipt-remarks">Remarks</Label>
                        <Textarea
                            id="receipt-remarks"
                            rows={3}
                            placeholder="Optional notes about this delivery"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                        />

                        <InputError message={errors.remarks?.[0]} />
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
                            Save Receipt
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
