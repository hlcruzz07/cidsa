import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';
import { Head } from '@inertiajs/react';
import { route } from 'ziggy-js';

export default function Login() {
    return (
        <AuthLayout
            title="Administrator login"
            description="Sign in with your authorized Google account to continue."
        >
            <Head title="Log in" />

            <div className="flex flex-col gap-4">
                <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full cursor-pointer"
                >
                    <a href={route('google.redirect')}>
                        <img
                            src="/google-logo.webp"
                            alt=""
                            className="h-5 w-5"
                        />
                        Sign in with Google
                    </a>
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                    Only accounts approved by CIDSA can access this portal.
                </p>
            </div>
        </AuthLayout>
    );
}
