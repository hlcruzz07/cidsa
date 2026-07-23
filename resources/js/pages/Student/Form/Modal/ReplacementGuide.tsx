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
import { cn } from '@/lib/utils';
import {
    AlertTriangle,
    Building2,
    CheckCheckIcon,
    CheckCircle2,
    Clock,
    CreditCard,
    FileText,
    IdCard,
    MapPin,
    Pencil,
    Receipt,
    Upload,
} from 'lucide-react';
import { useState } from 'react';

type Reason = 'lost' | 'info';
type Campus = 'external' | 'main';

interface Step {
    icon: React.ReactNode;
    label: string;
    description: string;
    variant?: 'default' | 'warning' | 'success' | 'danger';
}

const STEP_COLORS: Record<
    NonNullable<Step['variant']>,
    { bg: string; text: string; numBg: string; numText: string }
> = {
    default: {
        bg: 'bg-blue-50 dark:bg-blue-950',
        text: 'text-blue-700 dark:text-blue-300',
        numBg: 'bg-blue-100 dark:bg-blue-900',
        numText: 'text-blue-700 dark:text-blue-300',
    },
    warning: {
        bg: 'bg-amber-50 dark:bg-amber-950',
        text: 'text-amber-700 dark:text-amber-300',
        numBg: 'bg-amber-100 dark:bg-amber-900',
        numText: 'text-amber-700 dark:text-amber-300',
    },
    success: {
        bg: 'bg-green-50 dark:bg-green-950',
        text: 'text-green-700 dark:text-green-300',
        numBg: 'bg-green-100 dark:bg-green-900',
        numText: 'text-green-700 dark:text-green-300',
    },
    danger: {
        bg: 'bg-red-50 dark:bg-red-950',
        text: 'text-red-700 dark:text-red-300',
        numBg: 'bg-red-100 dark:bg-red-900',
        numText: 'text-red-700 dark:text-red-300',
    },
};

// ─── Step data ────────────────────────────────────────────────────────────────

const AOF_STEP: Step = {
    icon: <FileText className="h-4 w-4" />,
    label: 'Secure an affidavit of loss (AOF)',
    description:
        'Obtain a notarized affidavit of loss before proceeding. This is required for all campuses.',
    variant: 'danger',
};

const EXTERNAL_STEPS: Step[] = [
    {
        icon: <CreditCard className="h-4 w-4" />,
        label: 'Pay at the cashier',
        description:
            'Proceed to your campus cashier and pay the ID replacement fee.',
        variant: 'default',
    },
    {
        icon: <Receipt className="h-4 w-4" />,
        label: 'Take a photo of the receipt',
        description:
            "You'll need to upload this photo when submitting your replacement request on the CIDSA website.",
        variant: 'default',
    },
    {
        icon: <Upload className="h-4 w-4" />,
        label: 'Submit on CIDSA & give AOF to ICT',
        description:
            'Submit your replacement request online via the CIDSA website (with the receipt photo), and hand your original AOF to your campus ICT department.',
        variant: 'default',
    },
    {
        icon: <Clock className="h-4 w-4" />,
        label: 'Wait for your ICT office announcement',
        description:
            'An assigned staff member will travel to the main campus to collect replacement IDs. Your ICT office will announce when your ID is ready for pickup.',
        variant: 'warning',
    },
];

const MAIN_STEPS: Step[] = [
    {
        icon: <Building2 className="h-4 w-4" />,
        label: 'Get an order of payment from BAO',
        description:
            'Proceed to the Business Affairs Office (BAO) to obtain an order of payment form for the ID replacement fee.',
        variant: 'default',
    },
    {
        icon: <CreditCard className="h-4 w-4" />,
        label: 'Pay at the cashier using the order of payment',
        description:
            'Bring your order of payment form to the cashier and settle the replacement fee.',
        variant: 'default',
    },
    {
        icon: <Receipt className="h-4 w-4" />,
        label: "Take a photo of the cashier's receipt",
        description:
            "You'll need to upload this photo when submitting your replacement request on the CIDSA website.",
        variant: 'default',
    },
    {
        icon: <Upload className="h-4 w-4" />,
        label: 'Submit your request on CIDSA',
        description:
            "Submit your replacement request online via the CIDSA website, uploading the photo of your cashier's receipt.",
        variant: 'default',
    },
    {
        icon: <CheckCircle2 className="h-4 w-4" />,
        label: 'Submit AOF & claim your replacement ID',
        description:
            'Bring your original AOF to the ICT-MIS Office during office hours to claim your replacement ID.',
        variant: 'success',
    },
];

const INFO_STEPS: Step[] = [
    {
        icon: <CreditCard className="h-4 w-4" />,
        label: 'Pay at the cashier',
        description:
            "Proceed to your campus cashier and pay the ID replacement fee. No affidavit of loss is needed since the ID itself isn't lost.",
        variant: 'default',
    },
    {
        icon: <Receipt className="h-4 w-4" />,
        label: 'Take a photo of the receipt',
        description:
            "Photograph your cashier's receipt — you'll need to upload it when submitting your request on the CIDSA website.",
        variant: 'default',
    },
    {
        icon: <CheckCircle2 className="h-4 w-4" />,
        label: 'Submit your request on CIDSA',
        description:
            "Log in to the CIDSA website and submit a replacement request, uploading the receipt photo. That's it — no office visit needed.",
        variant: 'success',
    },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepItem({
    step,
    index,
    isLast,
}: {
    step: Step;
    index: number;
    isLast: boolean;
}) {
    const variant = step.variant ?? 'default';
    const colors = STEP_COLORS[variant];

    return (
        <div className="flex gap-3">
            {/* Number + connector */}
            <div className="flex flex-col items-center">
                <div
                    className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                        colors.numBg,
                    )}
                >
                    <span className={cn('text-xs font-medium', colors.numText)}>
                        {index + 1}
                    </span>
                </div>
                {!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
            </div>

            {/* Content */}
            <div className={cn('mb-4 flex-1', isLast && 'mb-0')}>
                <div
                    className={cn(
                        'flex items-start gap-2.5 rounded-lg border p-3',
                        colors.bg,
                        'border-transparent',
                    )}
                >
                    <span className={cn('mt-0.5 shrink-0', colors.text)}>
                        {step.icon}
                    </span>
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            {step.label}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                            {step.description}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepList({ steps }: { steps: Step[] }) {
    return (
        <div className="pt-1">
            {steps.map((step, i) => (
                <StepItem
                    key={i}
                    step={step}
                    index={i}
                    isLast={i === steps.length - 1}
                />
            ))}
        </div>
    );
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

interface IdReplacementGuideDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
}

export function ReplacementGuide({
    open,
    setOpen,
}: IdReplacementGuideDialogProps) {
    const [reason, setReason] = useState<Reason>('lost');
    const [campus, setCampus] = useState<Campus>('external');

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="w-full max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <IdCard className="h-5 w-5" />
                        Student ID Replacement Guide
                    </DialogTitle>
                    <DialogDescription>
                        Follow the steps for your situation below.
                    </DialogDescription>
                </DialogHeader>

                <div className="no-scrollbar -mx-4 max-h-[60vh] overflow-y-auto px-4">
                    <div className="flex flex-col gap-4">
                        {/* ── Reason tabs ── */}
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant={
                                    reason === 'lost' ? 'default' : 'outline'
                                }
                                size="sm"
                                className="justify-start gap-2"
                                onClick={() => setReason('lost')}
                            >
                                <AlertTriangle className="h-4 w-4" />
                                Lost ID
                            </Button>
                            <Button
                                variant={
                                    reason === 'info' ? 'default' : 'outline'
                                }
                                size="sm"
                                className="justify-start gap-2"
                                onClick={() => setReason('info')}
                            >
                                <Pencil className="h-4 w-4" />
                                Info change only
                            </Button>
                        </div>

                        {/* ── Lost ID flow ── */}
                        {reason === 'lost' && (
                            <div className="flex flex-col gap-4">
                                {/* AOF — all Campuses */}
                                <div className="rounded-lg border bg-card p-4">
                                    <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        All Campuses — first step
                                    </p>
                                    <StepList steps={[AOF_STEP]} />
                                </div>

                                {/* Campus selector */}
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant={
                                            campus === 'external'
                                                ? 'secondary'
                                                : 'outline'
                                        }
                                        size="sm"
                                        className="justify-start gap-2"
                                        onClick={() => setCampus('external')}
                                    >
                                        <MapPin className="h-4 w-4" />
                                        External Campuses
                                    </Button>
                                    <Button
                                        variant={
                                            campus === 'main'
                                                ? 'secondary'
                                                : 'outline'
                                        }
                                        size="sm"
                                        className="justify-start gap-2"
                                        onClick={() => setCampus('main')}
                                    >
                                        <Building2 className="h-4 w-4" />
                                        Main campus
                                    </Button>
                                </div>

                                {/* External steps */}
                                {campus === 'external' && (
                                    <div className="rounded-lg border bg-card p-4">
                                        <div className="mb-3 flex items-center gap-2">
                                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                Alijis · Binalbagan ·
                                                Fortune-Towne
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className="text-[10px]"
                                            >
                                                Then continue from step 1 above
                                            </Badge>
                                        </div>
                                        <StepList steps={EXTERNAL_STEPS} />
                                    </div>
                                )}

                                {/* Main campus steps */}
                                {campus === 'main' && (
                                    <div className="rounded-lg border bg-card p-4">
                                        <div className="mb-3 flex items-center gap-2">
                                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                Talisay (Main)
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className="text-[10px]"
                                            >
                                                Then continue from step 1 above
                                            </Badge>
                                        </div>
                                        <StepList steps={MAIN_STEPS} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Info change flow ── */}
                        {reason === 'info' && (
                            <div className="rounded-lg border bg-card p-4">
                                <div className="mb-3 flex items-center gap-2">
                                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        All Campuses
                                    </p>
                                    <Badge
                                        variant="secondary"
                                        className="text-[10px]"
                                    >
                                        No AOF required
                                    </Badge>
                                </div>
                                <StepList steps={INFO_STEPS} />
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button className="w-full" onClick={() => setOpen(false)}>
                        <CheckCheckIcon /> Yes, I Understand
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
