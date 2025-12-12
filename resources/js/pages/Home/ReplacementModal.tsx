import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export function ReplacementModal({ isOpen, onClose }: ModalProps) {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const handleCheckboxChange = () => {
        localStorage.setItem('skipReplacementModal', dontShowAgain.toString());
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>ID Replacement Requirements</DialogTitle>
                    <DialogDescription>
                        Please follow the steps below to complete your ID
                        replacement request.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 grid gap-4">
                    <div className="flex gap-3">
                        <span className="text-main-color font-bold">1.</span>
                        <p>
                            Secure an <strong>Affidavit of Loss</strong> for
                            your lost ID. You will be required to upload a clear
                            photo of this document when submitting the form.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <span className="text-main-color font-bold">2.</span>
                        <p>
                            Visit the{' '}
                            <strong>Business Affairs Office (BAO)</strong> to
                            obtain an <strong>Order of Payment</strong>{' '}
                            specifically for ID replacement.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <span className="text-main-color font-bold">3.</span>
                        <p>
                            Proceed to the cashier and settle the required
                            payment using the Order of Payment. You will also
                            upload a photo of the
                            <strong> payment receipt</strong> in this form.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <span className="text-main-color font-bold">4.</span>
                        <p>
                            After successfully submitting the form and uploading
                            the required documents, visit the{' '}
                            <strong>ICT-MIS Office</strong> during office hours
                            to finalize and claim your ID replacement.
                        </p>
                    </div>

                    {/* Checkbox */}
                    <div className="mt-4 flex items-center gap-2">
                        <Checkbox
                            id="dont-show-again"
                            checked={dontShowAgain}
                            onCheckedChange={(checked) => {
                                const value = checked === true;
                                setDontShowAgain(value);
                            }}
                            className="accent-green-600"
                        />
                        <Label htmlFor="dont-show-again">
                            Do not show this message again
                        </Label>
                    </div>
                </div>

                <DialogFooter className="mt-6">
                    <DialogClose asChild>
                        <Button
                            variant="default"
                            onClick={handleCheckboxChange}
                        >
                            Confirm
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
