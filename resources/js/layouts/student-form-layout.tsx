import AppearanceToggleTab from '@/components/appearance-tabs';
import { Toaster } from '@/components/ui/sonner';
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
        <>
            <Toaster richColors position="bottom-left" closeButton />
            <div className="overflow-hidden bg-cover bg-fixed bg-center bg-no-repeat dark:bg-black">
                <div className="flex min-h-96 flex-col items-center justify-center gap-5 bg-[var(--main-color)] py-20 text-white dark:bg-green-900 dark:text-gray-100">
                    <div className="flex flex-col items-center gap-5 md:flex-row">
                        <img
                            src="/logo.webp"
                            className="h-22 w-22 md:h-25 md:w-25"
                            alt="CHMSU Logo"
                            loading="lazy"
                        />
                        <h1 className="text-5xl font-extrabold md:text-7xl">
                            CIDSA
                        </h1>
                    </div>
                    <h1 className="text-center text-xl md:text-3xl">
                        CHMSU Identification Card & Security Access Activation
                        Form
                    </h1>
                    <div className="max-w-3xl space-y-5 px-2 text-center text-sm md:px-0 md:text-base">
                        <p>
                            The CHMSU CIDSA Identification Card & Security
                            Access Activation Form allows students, faculty, and
                            staff to obtain official campus identification. It
                            ensures every member is properly registered in the
                            university’s system, enabling accurate records,
                            efficient management, and seamless access to
                            services like libraries and support facilities.
                        </p>
                        <p>
                            The form also activates a secure access system that
                            manages permissions for campus facilities. Through
                            the system, members can access classrooms,
                            laboratories, libraries, offices, and other
                            restricted areas. This helps CHMSU maintain
                            security, monitor access efficiently, and ensure a
                            safe and organized campus environment.
                        </p>
                    </div>
                </div>
                <div className="mt-5 flex items-center justify-center">
                    <AppearanceToggleTab />
                </div>

                <div className="relative z-10 mx-auto block max-w-5xl rounded-xl bg-white p-5 dark:bg-black dark:text-gray-100">
                    {children}
                </div>
            </div>
        </>
    );
}
