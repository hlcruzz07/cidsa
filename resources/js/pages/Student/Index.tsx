import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import ThemeButton from '@/components/ThemeButton';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm, usePage } from '@inertiajs/react';
import { AsteriskIcon, HelpCircle, IdCard, LogInIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { ReplacementGuide } from './Form/Modal/ReplacementGuide';
import { SuccessModal } from './Form/Modal/SucessModal';

type FlashMessages = {
    success?: string | null;
    error?: string | null;
    info?: string | null;
    warning?: string | null;
    id_request_success?: boolean | null;
    id_number?: string | null;
};

const CAMPUSES = ['TALISAY', 'ALIJIS', 'FORTUNE TOWNE', 'BINALBAGAN'];

// Employee validation flow is not ready yet. Flip this to `true`
// once the backend + flow are ready to re-enable the tab. Nothing else
// needs to change — the form, handler, and route call are left intact.
const STAFF_FORM_ENABLED = false;

// Shown whenever either the student or staff form is mid-request. Kept
// simple/non-dismissible (no close button, no onOpenChange) since a
// credential check is a brief, uninterruptible action — the dialog just
// closes itself once `processing` flips back to false.
function ValidatingModal({ open }: { open: boolean }) {
    return (
        <Dialog open={open}>
            <DialogContent
                className="sm:max-w-sm [&>button]:hidden"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader className="items-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <Spinner className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="mt-2">
                        Checking your credentials
                    </DialogTitle>
                    <DialogDescription>
                        Please wait while we verify your information. This will
                        only take a moment.
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}

export default function Index() {
    const page = usePage();
    const flash: FlashMessages = page.props.flash || {};

    // Both the boolean flag and the id_number live under `flash` — that's
    // where HandleInertiaRequests::share() actually puts them. They are
    // NOT top-level page props, so don't destructure them off usePage()
    // directly or they'll always read as undefined.
    const [showSuccess, setShowSuccess] = useState(false);
    const [submittedIdNumber, setSubmittedIdNumber] = useState<string | null>(
        null,
    );

    useEffect(() => {
        if (!flash) return;
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
        if (flash.info) toast.info(flash.info);
        if (flash.warning) toast.warning(flash.warning);
    }, [flash]);

    useEffect(() => {
        if (flash.id_request_success) {
            setSubmittedIdNumber(flash.id_number ?? null);
            setShowSuccess(true);
        }
    }, [flash.id_request_success, flash.id_number]);

    const [openGuide, setOpenGuide] = useState(false);

    const studentForm = useForm({
        id_number: '',
        campus: '',
        lname: '',
        birthdate: '',
    });

    const staffForm = useForm({
        digital_id: '',
    });

    const isValidating = studentForm.processing || staffForm.processing;

    const handleStudentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (studentForm.processing) return;

        studentForm.post(route('validate.student'), {
            preserveScroll: true,
            onError: (err) => {
                console.error('Error validating student', err);
            },
        });
    };

    const handleStaffSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Safety net alongside the disabled UI below — the staff flow
        // isn't ready yet, so block submission even if the disabled
        // attribute is bypassed (e.g. via devtools).
        if (!STAFF_FORM_ENABLED) return;
        if (staffForm.processing) return;

        staffForm.post(route('validate.staff'), {
            preserveScroll: true,
            onError: (err) => {
                console.error('Error validating staff', err);
            },
        });
    };

    return (
        <>
            <ValidatingModal open={isValidating} />
            <SuccessModal open={showSuccess} idNumber={submittedIdNumber} />
            <ReplacementGuide open={openGuide} setOpen={setOpenGuide} />
            <ThemeButton />

            <div className="flex min-h-dvh items-center justify-center border-2 bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_1.35fr]">
                    <aside className="relative hidden overflow-hidden rounded-[28px] border border-[var(--border)] bg-primary p-6 text-[var(--primary-foreground)] shadow-[0_30px_80px_-30px_rgba(15,23,42,0.6)] sm:p-8 md:block lg:p-10">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),transparent_32%)]" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3">
                                <img
                                    src="/logo.webp"
                                    className="h-14 w-14 rounded-full border border-[var(--primary-foreground)]/15 bg-[var(--primary-foreground)]/5 p-1 shadow-lg"
                                    alt="CHMSU Logo"
                                    loading="lazy"
                                />
                                <div>
                                    <p className="text-[10px] font-semibold tracking-[0.28em] text-[var(--primary-foreground)]/80 uppercase">
                                        CHMSU
                                    </p>
                                    <p className="text-sm font-medium text-[var(--primary-foreground)]/95">
                                        Identity Access Portal
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 space-y-5">
                                <span className="inline-flex rounded-full border border-[var(--primary-foreground)]/15 bg-[var(--primary-foreground)]/5 px-3 py-1 text-[10px] font-semibold tracking-[0.24em] text-[var(--primary-foreground)]/90 uppercase">
                                    Campus Access Activation
                                </span>

                                <div>
                                    <h1 className="text-2xl leading-tight font-black uppercase sm:text-3xl">
                                        Carlos Hilado Memorial
                                        <span className="mt-2 block text-[var(--primary-foreground)]/90">
                                            State University
                                        </span>
                                    </h1>
                                </div>

                                <p className="max-w-md text-sm leading-6 text-[var(--primary-foreground)]/75">
                                    Secure your official identification card and
                                    campus access by completing the registration
                                    form below. This helps the university
                                    maintain accurate records and ensure smooth
                                    entry to campus services.
                                </p>
                            </div>

                            <div className="mt-8 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-[var(--primary-foreground)]/15 bg-[var(--primary-foreground)]/5 p-4 backdrop-blur-sm">
                                    <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--primary-foreground)]/75 uppercase">
                                        For
                                    </p>
                                    <p className="mt-2 text-lg font-semibold text-[var(--primary-foreground)]">
                                        Students
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-[var(--primary-foreground)]/15 bg-[var(--primary-foreground)]/5 p-4 backdrop-blur-sm">
                                    <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--primary-foreground)]/75 uppercase">
                                        Access
                                    </p>
                                    <p className="mt-2 text-lg font-semibold text-[var(--primary-foreground)]">
                                        Faculty & Staff
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 rounded-2xl border border-[var(--primary-foreground)]/15 bg-[var(--primary-foreground)]/5 p-4 text-sm text-[var(--primary-foreground)]/90">
                                <div className="flex items-center gap-2 font-medium">
                                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--primary-foreground)]" />
                                    Required for ID printing and secure campus
                                    entry
                                </div>
                            </div>
                        </div>
                    </aside>

                    <main className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-5 text-[var(--card-foreground)] shadow-[0_24px_80px_-30px_rgba(15,23,42,0.35)] sm:p-7 lg:p-8">
                        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-5">
                            <div>
                                <p className="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
                                    Registration
                                </p>
                                <Heading
                                    title="Student / Staff Information Form"
                                    description="Complete this form to provide the required information for CHMSU ID printing and secure campus access."
                                />
                            </div>
                        </div>

                        <Tabs defaultValue="student" className="mt-6">
                            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-[var(--muted)] p-1">
                                <TabsTrigger
                                    value="student"
                                    className="rounded-lg"
                                >
                                    Student
                                </TabsTrigger>
                                <TabsTrigger
                                    value="staff"
                                    className="rounded-lg"
                                >
                                    Staff
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="student" className="mt-6">
                                <form
                                    onSubmit={handleStudentSubmit}
                                    className="space-y-5"
                                >
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label className="text-sm font-medium text-[var(--foreground)]">
                                                Student ID Number{' '}
                                                <AsteriskIcon
                                                    size={12}
                                                    color="red"
                                                />
                                            </Label>
                                            <Input
                                                type="text"
                                                placeholder="Enter ID Number"
                                                value={
                                                    studentForm.data.id_number
                                                }
                                                aria-invalid={
                                                    !!studentForm.errors
                                                        .id_number
                                                }
                                                onChange={(e) => {
                                                    studentForm.setData(
                                                        'id_number',
                                                        e.target.value.toUpperCase(),
                                                    );
                                                }}
                                                maxLength={25}
                                                className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] text-base text-[var(--foreground)] focus-visible:ring-[var(--ring)]"
                                            />
                                            <InputError
                                                message={
                                                    studentForm.errors.id_number
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label className="text-sm font-medium text-[var(--foreground)]">
                                                Last Name
                                                <AsteriskIcon
                                                    size={12}
                                                    color="red"
                                                />
                                            </Label>
                                            <Input
                                                type="text"
                                                placeholder="Enter Last Name"
                                                value={studentForm.data.lname}
                                                aria-invalid={
                                                    !!studentForm.errors.lname
                                                }
                                                onChange={(e) => {
                                                    studentForm.setData(
                                                        'lname',
                                                        e.target.value.toUpperCase(),
                                                    );
                                                }}
                                                maxLength={25}
                                                className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] text-base text-[var(--foreground)] focus-visible:ring-[var(--ring)]"
                                            />
                                            <InputError
                                                message={
                                                    studentForm.errors.lname
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-sm font-medium text-[var(--foreground)]">
                                                Birthdate
                                                <AsteriskIcon
                                                    size={12}
                                                    color="red"
                                                />
                                            </Label>
                                            <Input
                                                type="date"
                                                value={
                                                    studentForm.data.birthdate
                                                }
                                                aria-invalid={
                                                    !!studentForm.errors
                                                        .birthdate
                                                }
                                                onChange={(e) => {
                                                    studentForm.setData(
                                                        'birthdate',
                                                        e.target.value,
                                                    );
                                                }}
                                                className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] text-base text-[var(--foreground)] focus-visible:ring-[var(--ring)]"
                                            />
                                            <InputError
                                                message={
                                                    studentForm.errors.birthdate
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label className="text-sm font-medium text-[var(--foreground)]">
                                                Campus{' '}
                                                <AsteriskIcon
                                                    size={12}
                                                    color="red"
                                                />
                                            </Label>
                                            <Select
                                                value={studentForm.data.campus}
                                                onValueChange={(value) => {
                                                    studentForm.setData(
                                                        'campus',
                                                        value,
                                                    );
                                                }}
                                            >
                                                <SelectTrigger
                                                    aria-invalid={
                                                        !!studentForm.errors
                                                            .campus
                                                    }
                                                    className="h-11 w-full rounded-xl border-[var(--border)] bg-[var(--background)] text-left text-[var(--foreground)]"
                                                >
                                                    <SelectValue placeholder="Choose an option" />
                                                </SelectTrigger>
                                                <SelectContent className="w-full">
                                                    <SelectGroup>
                                                        {CAMPUSES.map(
                                                            (item) => (
                                                                <SelectItem
                                                                    key={item}
                                                                    value={item}
                                                                >
                                                                    {item}{' '}
                                                                    {item ===
                                                                        'TALISAY' &&
                                                                        '(MAIN CAMPUS)'}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            <InputError
                                                message={
                                                    studentForm.errors.campus
                                                }
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-[var(--primary-foreground)] shadow-lg transition hover:bg-primary/90"
                                        disabled={studentForm.processing}
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            Submit
                                            {studentForm.processing ? (
                                                <Spinner />
                                            ) : (
                                                <LogInIcon className="h-4 w-4" />
                                            )}
                                        </span>
                                    </Button>
                                </form>

                                <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-4">
                                    <button
                                        type="button"
                                        onClick={() => setOpenGuide(true)}
                                        className="flex w-full items-center justify-center gap-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:text-primary"
                                    >
                                        <HelpCircle className="h-4 w-4 shrink-0" />
                                        Lost your ID or need to update your
                                        info?
                                    </button>

                                    <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
                                        If your <strong>Information</strong>{' '}
                                        does not match our records, please
                                        message us on{' '}
                                        <a
                                            href="https://www.facebook.com/people/CHMSU-ICT-MIS-Support/61561132092022"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-primary underline underline-offset-4"
                                        >
                                            CHMSU ICT MIS Support
                                        </a>{' '}
                                        or visit our office during our office
                                        hours for assistance.
                                    </p>
                                </div>
                            </TabsContent>

                            <TabsContent value="staff" className="mt-6">
                                <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-200">
                                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <div className="text-sm leading-5">
                                        <p className="font-semibold">
                                            Under Development
                                        </p>
                                        <p className="mt-1 text-amber-800/90 dark:text-amber-200/80">
                                            Employee ID form isn't available
                                            yet. Please check back later.
                                        </p>
                                    </div>
                                </div>

                                <form
                                    onSubmit={handleStaffSubmit}
                                    className="space-y-5"
                                    aria-disabled={!STAFF_FORM_ENABLED}
                                >
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-medium text-[var(--foreground)]">
                                            Employee Digital ID Number{' '}
                                            <AsteriskIcon
                                                size={12}
                                                color="red"
                                            />
                                        </Label>
                                        <Input
                                            type="text"
                                            placeholder="Enter Digital ID Number"
                                            value={staffForm.data.digital_id}
                                            disabled={!STAFF_FORM_ENABLED}
                                            onChange={(e) => {
                                                staffForm.setData(
                                                    'digital_id',
                                                    e.target.value.toUpperCase(),
                                                );
                                            }}
                                            maxLength={25}
                                            className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] text-base text-[var(--foreground)] focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-60"
                                        />
                                        <InputError
                                            message={
                                                staffForm.errors.digital_id
                                            }
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-[var(--primary-foreground)] shadow-lg transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                                        disabled={
                                            !STAFF_FORM_ENABLED ||
                                            staffForm.processing
                                        }
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            Submit
                                            {staffForm.processing ? (
                                                <Spinner />
                                            ) : (
                                                <IdCard className="h-4 w-4" />
                                            )}
                                        </span>
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </main>
                </div>
            </div>
        </>
    );
}
