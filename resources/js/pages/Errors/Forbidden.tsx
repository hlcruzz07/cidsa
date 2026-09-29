// resources/js/pages/Errors/Forbidden.tsx

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeftIcon,
    LayoutDashboardIcon,
    LifeBuoyIcon,
    MapPinIcon,
    UserCogIcon,
} from 'lucide-react';

type Props = {
    message?: string | null;
};

const DEFAULT_MESSAGE =
    'Your account does not have permission to view this page.';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Access denied',
        href: '#',
    },
];

const hints = [
    {
        icon: UserCogIcon,
        title: 'Check your role',
        text: 'Some pages are only for admins or super admins.',
    },
    {
        icon: MapPinIcon,
        title: 'Check your campus',
        text: 'Admins can only open records for their own campus.',
    },
    {
        icon: LifeBuoyIcon,
        title: 'Ask for access',
        text: 'A super admin can update your role or campus.',
    },
];

/**
 * Decorative vector illustration: a padlocked shield.
 * Uses theme tokens (fill-*, stroke-*) so it follows light/dark mode.
 */
function LockedShieldIllustration() {
    return (
        <svg
            viewBox="0 0 320 260"
            className="h-auto w-full max-w-[280px]"
            aria-hidden="true"
            focusable="false"
        >
            {/* Ground shadow */}
            <ellipse cx="160" cy="236" rx="86" ry="9" className="fill-muted" />

            {/* Orbit rings */}
            <circle
                cx="160"
                cy="126"
                r="108"
                fill="none"
                strokeWidth="1.5"
                strokeDasharray="3 7"
                strokeLinecap="round"
                className="stroke-border"
            />
            <circle
                cx="160"
                cy="126"
                r="82"
                fill="none"
                strokeWidth="1"
                className="stroke-border/60"
            />

            {/* Floating accents */}
            <circle cx="46" cy="70" r="6" className="fill-primary/20" />
            <circle cx="278" cy="176" r="8" className="fill-destructive/20" />
            <circle
                cx="264"
                cy="58"
                r="3.5"
                className="fill-muted-foreground/40"
            />
            <circle
                cx="58"
                cy="184"
                r="3.5"
                className="fill-muted-foreground/40"
            />
            <rect
                x="20"
                y="126"
                width="12"
                height="12"
                rx="3"
                transform="rotate(20 26 132)"
                className="fill-none stroke-muted-foreground/40"
                strokeWidth="2"
            />
            <path
                d="M286 108v14M279 115h14"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="stroke-primary/40"
            />
            <path
                d="M92 34l8 8M100 34l-8 8"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="stroke-destructive/40"
            />

            {/* Shield: offset back layer, then front */}
            <path
                d="M166 40l72 28v58c0 46-30 80-72 100-42-20-72-54-72-100V68z"
                className="fill-muted"
            />
            <path
                d="M160 34l72 28v58c0 46-30 80-72 100-42-20-72-54-72-100V62z"
                strokeWidth="3"
                strokeLinejoin="round"
                className="fill-card stroke-foreground"
            />
            {/* Inner shield outline */}
            <path
                d="M160 50l56 22v48c0 36-23 64-56 80-33-16-56-44-56-80V72z"
                strokeWidth="1.5"
                strokeLinejoin="round"
                className="fill-destructive/5 stroke-destructive/30"
            />

            {/* Pulsing ring behind the lock */}
            <circle
                cx="160"
                cy="134"
                r="36"
                fill="none"
                strokeWidth="2"
                className="stroke-destructive/30 motion-safe:animate-pulse"
            />

            {/* Padlock shackle */}
            <path
                d="M143 122v-14a17 17 0 0 1 34 0v14"
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                className="stroke-destructive"
            />
            {/* Padlock body */}
            <rect
                x="130"
                y="120"
                width="60"
                height="46"
                rx="9"
                className="fill-destructive"
            />
            {/* Keyhole */}
            <circle cx="160" cy="139" r="6" className="fill-card" />
            <rect
                x="157.5"
                y="141"
                width="5"
                height="13"
                rx="2.5"
                className="fill-card"
            />
        </svg>
    );
}

export default function Forbidden({ message }: Props) {
    const { url } = usePage();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="403 - Access denied" />

            <div className="relative flex min-h-[75vh] items-center justify-center overflow-hidden p-4">
                {/* Dotted grid background, faded toward the edges */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 text-border"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle, currentColor 1px, transparent 1px)',
                        backgroundSize: '22px 22px',
                        maskImage:
                            'radial-gradient(ellipse at center, black 30%, transparent 75%)',
                        WebkitMaskImage:
                            'radial-gradient(ellipse at center, black 30%, transparent 75%)',
                    }}
                />

                {/* Oversized watermark number */}
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute text-[9rem] leading-none font-black tracking-tighter text-muted-foreground/10 select-none sm:text-[16rem]"
                >
                    403
                </span>

                <div className="relative flex w-full max-w-xl flex-col items-center gap-6 text-center">
                    <LockedShieldIllustration />

                    <div className="space-y-2">
                        <p className="text-sm font-medium text-destructive">
                            Error 403
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                            You don&apos;t have access to this page
                        </h1>
                        <p className="mx-auto max-w-md text-sm text-muted-foreground">
                            {message || DEFAULT_MESSAGE}
                        </p>
                    </div>

                    <code
                        className="max-w-full rounded-md border bg-muted px-2.5 py-1 text-xs break-all text-muted-foreground"
                        title="The page you tried to open"
                    >
                        {url}
                    </code>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button asChild>
                            <Link href="/dashboard">
                                <LayoutDashboardIcon />
                                Go to dashboard
                            </Link>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeftIcon />
                            Go back
                        </Button>
                    </div>

                    <div className="grid w-full gap-3 pt-2 text-left sm:grid-cols-3">
                        {hints.map(({ icon: Icon, title, text }) => (
                            <div
                                key={title}
                                className="rounded-lg border bg-card/70 p-3 backdrop-blur-sm"
                            >
                                <div className="mb-2 flex size-8 items-center justify-center rounded-md bg-muted text-foreground">
                                    <Icon
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                </div>
                                <h2 className="text-sm font-medium">{title}</h2>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
