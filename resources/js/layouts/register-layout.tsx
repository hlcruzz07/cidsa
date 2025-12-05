import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/sonner';
import { usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

type FlashMessages = {
    success?: string | null;
    error?: string | null;
    info?: string | null;
    warning?: string | null;
};

export default function RegisterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const page = usePage();
    const flash: FlashMessages = page.props.flash || {};
    const [step, setStep] = useState(1);

    useEffect(() => {
        if (!flash) return;
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
        if (flash.info) toast.info(flash.info);
        if (flash.warning) toast.warning(flash.warning);
    }, [flash]);

    return (
        <>
            <Toaster closeButton richColors />
            <div className="relative flex min-h-screen justify-center overflow-hidden bg-white bg-cover bg-fixed bg-center bg-no-repeat md:bg-[url('/chmsu.webp')]">
                <div className="absolute top-0 left-0 h-full w-full md:bg-black/40"></div>

                <div className="relative z-10 rounded-xl bg-white p-5 md:my-20 md:min-w-3xl md:border md:shadow-lg">
                    <div className="flex items-center justify-center">
                        <div className="flex flex-col items-center justify-center gap-3 md:flex-row">
                            <img
                                src="/logo.webp"
                                className="h-18 w-18 md:h-20 md:w-20"
                                alt="CHMSU Logo"
                                loading="lazy"
                            />
                            <div className="flex flex-col items-center md:items-start">
                                <h1 className="text-2xl font-extrabold text-green-600 md:text-3xl">
                                    CHMSU - CIDSA
                                </h1>
                                <small className="text-xs md:text-base">
                                    IDentification Card & Security Access
                                    Activation Form
                                </small>
                            </div>
                        </div>
                    </div>

                    <Separator className="my-5" />

                    {children}
                </div>
            </div>
        </>
    );
}
