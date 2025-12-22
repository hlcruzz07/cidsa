import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';
import { Head } from '@inertiajs/react';
import { route } from 'ziggy-js';

export default function Login() {
    return (
        <AuthLayout
            title="CIDSA Administrator Login"
            description="Sign in using your authorized account"
        >
            <Head title="Log in" />

            <a href={route('google.redirect')} className="mx-auto block">
                <Button
                    type="button"
                    className="w-full cursor-pointer"
                    variant="outline"
                >
                    <img src="/google-logo.webp" className="h-5 w-5" />
                    Sign in with Google
                </Button>
            </a>
        </AuthLayout>
    );
}
