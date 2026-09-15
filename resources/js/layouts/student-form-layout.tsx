import ThemeButton from '@/components/ThemeButton';
import { usePage } from '@inertiajs/react';
import React, { useEffect } from 'react';
import { toast } from 'sonner';

type FlashMessages = {
    success?: string | null;
    error?: string | null;
    info?: string | null;
    warning?: string | null;
};

export default function StudentFormLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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
        <div className="relative flex min-h-dvh w-full items-center justify-center bg-[url('/chmsu.webp')] bg-cover bg-fixed bg-center bg-no-repeat">
            <div className="absolute inset-0 bg-black/70" />
            <ThemeButton />
            <div className="relative z-10 mx-auto flex max-h-max w-5xl flex-col items-center rounded-xl bg-white p-5 dark:bg-black dark:text-gray-100">
                {children}
            </div>
        </div>
    );
}
