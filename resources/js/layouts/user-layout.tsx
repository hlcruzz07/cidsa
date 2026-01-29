import { Toaster } from '@/components/ui/sonner';
import { usePage } from '@inertiajs/react';
import { ReactNode, useEffect } from 'react';
import { toast } from 'sonner';

interface AppLayoutProps {
    children: ReactNode;
}
type FlashMessages = {
    success?: string | null;
    error?: string | null;
    info?: string | null;
    warning?: string | null;
};
export default function UserLayout({ children }: AppLayoutProps) {
    const page = usePage();
    const flash: FlashMessages = page.props.flash || {};

    useEffect(() => {
        if (!flash) return;
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
        if (flash.info) toast.info(flash.info);
        if (flash.warning) toast.warning(flash.warning);
    }, [flash]);

    return (
        <>
            <Toaster richColors position="top-right" closeButton />
            <div className="flex h-screen justify-center bg-[var(--main-color)] text-white lg:items-center dark:bg-green-900 dark:text-gray-100">
                {children}
            </div>
        </>
    );
}
