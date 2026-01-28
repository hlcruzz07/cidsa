import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
type ImportModalProps = {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    campus: string;
    reload: () => void;
};
export function ImportModal({
    isOpen,
    setIsOpen,
    campus,
    reload,
}: ImportModalProps) {
    const { data, setData, processing, errors, post, clearErrors, reset } =
        useForm({
            students_file: null as File | null,
            campus: campus || null,
        });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (processing) return;

        post(route('import.students'), {
            onSuccess: () => {
                setIsOpen(false);
                clearErrors();
                reset();
                reload();
            },
            onError: (error) => {
                console.log('Error importing students', error);
            },
        });
    };

    return (
        <Dialog open={isOpen || processing} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            Import {campus} Students Data{' '}
                        </DialogTitle>
                        <DialogDescription>
                            Upload a CSV file containing student records.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="my-5 grid gap-4">
                        <div className="grid gap-3">
                            <Label>Students CSV File</Label>
                            <Input
                                disabled={processing}
                                type="file"
                                name="students_file"
                                accept=".csv"
                                onChange={(e) =>
                                    setData(
                                        'students_file',
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                                required
                            />

                            <InputError message={errors.students_file} />
                        </div>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                disabled={processing}
                                type="button"
                                variant="outline"
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing}>
                            {processing ? (
                                <>
                                    Loading... <Spinner />
                                </>
                            ) : (
                                <>Submit</>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
