import { Toaster } from '@/components/ui/sonner';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { type ReactNode, useEffect } from 'react';
import { toast } from 'sonner'; // or react-hot-toast

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}
type FlashMessages = {
    success?: string | null;
    error?: string | null;
    info?: string | null;
    warning?: string | null;
};
export default function AppLayout({ children, breadcrumbs }: AppLayoutProps) {
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
            <Toaster richColors position="top-right" />
            <AppLayoutTemplate breadcrumbs={breadcrumbs}>
                {children}
            </AppLayoutTemplate>
        </>
    );
}
