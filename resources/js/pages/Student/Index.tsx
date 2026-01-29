import AppearanceToggleTab from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import UserLayout from '@/layouts/user-layout';
import { useForm, usePage } from '@inertiajs/react';
import { AsteriskIcon, LogInIcon } from 'lucide-react';
import { route } from 'ziggy-js';
import SuccessModal from './Form/Modal/SucessModal';
type SuccessProp = {
    success: boolean;
};
export default function Index() {
    const { success } = usePage<SuccessProp>().props;
    const { data, setData, processing, errors, post } = useForm({
        id_number: '',
        first_name: '',
        last_name: '',
    });

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (processing) return;

        post(route('validate.student'), {
            preserveScroll: true,
            onError: (err) => {
                console.log('Error validating student', err);
            },
        });
    };

    return (
        <UserLayout>
            <SuccessModal open={success ?? false} />
            <div className="grid max-w-7xl lg:grid-cols-2">
                <div className="space-y-5 p-10">
                    <div className="flex items-center justify-center gap-3 lg:justify-start">
                        <img
                            src="/logo.webp"
                            className="h-18 w-18 md:h-20 md:w-20"
                            alt="CHMSU Logo"
                            loading="lazy"
                        />
                        <h1 className="text-xl font-extrabold uppercase md:text-3xl">
                            Carlos Hilado Memorial <br /> State University
                        </h1>
                    </div>
                    <Separator className="my-4" />
                    <h1 className="text-center text-xl font-medium">
                        CHMSU Identification Card & <br /> Security Access
                        Activation Form
                    </h1>
                    <p className="mt-5 text-center text-sm md:text-base">
                        The CHMSU CIDSA Identification Card & Security Access
                        Activation Form allows students, faculty, and staff to
                        obtain official campus identification. It ensures every
                        member is properly registered in the university’s
                        system, enabling accurate records, efficient management,
                        and seamless access to services like libraries and
                        support facilities.
                    </p>
                    <div className="mt-5 flex items-center justify-center text-black">
                        <AppearanceToggleTab />
                    </div>
                </div>
                <div className="rounded-md border bg-white p-10 text-black shadow-md dark:bg-black dark:text-gray-100">
                    <Heading
                        title="Student Information Form"
                        description="Complete this form to provide the required student information for CHMSU Student ID printing and secure campus access."
                    />

                    <form
                        onSubmit={handleFormSubmit}
                        className="mt-5 space-y-5"
                    >
                        <div className="grid gap-2">
                            <Label>
                                Student ID Number{' '}
                                <AsteriskIcon size={12} color="red" />
                            </Label>
                            <Input
                                type="text"
                                placeholder="Enter ID Number"
                                value={data.id_number}
                                onChange={(e) => {
                                    setData(
                                        'id_number',
                                        e.target.value.toUpperCase(),
                                    );
                                }}
                                maxLength={25}
                                required
                            />
                            <InputError message={errors.id_number} />
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>
                                    First Name{' '}
                                    <AsteriskIcon size={12} color="red" />
                                </Label>
                                <Input
                                    type="text"
                                    maxLength={25}
                                    placeholder="Enter First Name"
                                    value={data.first_name}
                                    onChange={(e) => {
                                        setData(
                                            'first_name',
                                            e.target.value.toUpperCase(),
                                        );
                                    }}
                                    required
                                />

                                <InputError message={errors.first_name} />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    Last Name{' '}
                                    <AsteriskIcon size={12} color="red" />
                                </Label>
                                <Input
                                    type="text"
                                    maxLength={25}
                                    placeholder="Enter Last Name"
                                    value={data.last_name}
                                    onChange={(e) => {
                                        setData(
                                            'last_name',
                                            e.target.value.toUpperCase(),
                                        );
                                    }}
                                    required
                                />

                                <InputError message={errors.last_name} />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={processing}
                        >
                            Submit {processing ? <Spinner /> : <LogInIcon />}
                        </Button>
                        <p className="text-sm text-muted-foreground">
                            If your <strong>Information</strong> does not match
                            our records, please message us on{' '}
                            <a
                                href="https://www.facebook.com/people/CHMSU-ICT-MIS-Support/61561132092022"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                            >
                                CHMSU ICT MIS Support
                            </a>{' '}
                            or visit our office during our office hours for
                            assistance.
                        </p>
                    </form>
                </div>
            </div>
        </UserLayout>
    );
}
