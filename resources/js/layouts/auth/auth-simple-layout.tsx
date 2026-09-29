import AppLogoIcon from '@/components/app-logo-icon';
import ThemeButton from '@/components/ThemeButton';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
import { route } from 'ziggy-js';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="flex min-h-svh items-center justify-center bg-muted p-6 text-foreground md:p-10">
            <ThemeButton />

            <div className="w-full max-w-sm rounded-xl border bg-card p-8 text-card-foreground shadow-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-5 text-center">
                        <Link
                            href={route('home')}
                            className="flex size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground"
                        >
                            <AppLogoIcon className="size-8 fill-current" />
                            <span className="sr-only">CIDSA</span>
                        </Link>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {title}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
