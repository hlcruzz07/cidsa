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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useForm } from '@inertiajs/react';
import { AsteriskIcon } from 'lucide-react';
import { route } from 'ziggy-js';
type ImportModalProps = {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    campus: string;
};
export function AddStudentModal({
    isOpen,
    setIsOpen,
    campus,
}: ImportModalProps) {
    const { data, setData, processing, errors, post, clearErrors, reset } =
        useForm({
            id_number: '',
            first_name: '',
            middle_init: null as string | null,
            last_name: '',
            suffix: null as string | null,
            campus: campus as string | null,
        });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (processing) return;

        post(route('campus.add.student'), {
            onSuccess: () => {
                setIsOpen(false);
                clearErrors();
                reset();
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
                        <DialogTitle>Add {campus} Student</DialogTitle>
                        <DialogDescription>
                            Fill out the form below to add a new student.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="my-5 grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="id_number">
                                Student ID Number
                                <AsteriskIcon size={12} color="red" />
                            </Label>
                            <Input
                                type="text"
                                id="id_number"
                                value={data.id_number}
                                maxLength={25}
                                placeholder="Enter Student ID Number"
                                onChange={(e) =>
                                    setData(
                                        'id_number',
                                        e.target.value.toUpperCase(),
                                    )
                                }
                            />
                            <InputError message={errors.id_number} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="first_name">
                                First Name{' '}
                                <AsteriskIcon size={12} color="red" />
                            </Label>
                            <Input
                                type="text"
                                id="first_name"
                                placeholder="Enter First Name"
                                value={data.first_name}
                                maxLength={25}
                                onChange={(e) => {
                                    setData(
                                        'first_name',
                                        e.target.value.toUpperCase(),
                                    );
                                }}
                            />
                            <InputError message={errors.first_name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="middle_init">Middle Initial</Label>
                            <Input
                                type="text"
                                id="middle_init"
                                placeholder="Enter Middle Initial"
                                value={data.middle_init ?? ''}
                                onInput={(e) => {
                                    const v =
                                        e.currentTarget.value.toUpperCase();
                                    e.currentTarget.value = v.slice(0, 1);
                                }}
                                onChange={(e) =>
                                    setData(
                                        'middle_init',

                                        e.currentTarget.value === ''
                                            ? null
                                            : e.currentTarget.value.toUpperCase(),
                                    )
                                }
                            />
                            <InputError message={errors.middle_init} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="last_name">
                                Last Name <AsteriskIcon size={12} color="red" />
                            </Label>
                            <Input
                                type="text"
                                id="last_name"
                                placeholder="Enter Last Name"
                                value={data.last_name}
                                maxLength={25}
                                onChange={(e) => {
                                    setData(
                                        'last_name',
                                        e.target.value.toUpperCase(),
                                    );
                                }}
                            />
                            <InputError message={errors.last_name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="suffix">Suffix</Label>
                            <Select
                                value={data.suffix ?? ''}
                                onValueChange={(value) => {
                                    if (value === 'None') {
                                        setData('suffix', null);
                                        return;
                                    }
                                    setData('suffix', value);
                                }}
                            >
                                <SelectTrigger className="">
                                    <SelectValue placeholder="Choose an option" />
                                </SelectTrigger>
                                <SelectContent className="w-full md:w-10">
                                    <SelectGroup>
                                        {[
                                            'JR',
                                            'SR',
                                            'II',
                                            'III',
                                            'IV',
                                            'V',
                                            'None',
                                        ].map((item, key) => (
                                            <SelectItem key={key} value={item}>
                                                {item}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.suffix} />
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
