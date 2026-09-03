import { Card } from '@/components/ui/card';
import { StudentProps } from '@/lib/custom-types';
import JsBarcode from 'jsbarcode';
import { useEffect, useRef, useState } from 'react';

export type StudentIdCardData = StudentProps;

const formatEmergencyNumber = (num?: string | null) => {
    if (!num) return '—';
    let digits = num.replace(/\D/g, '');
    if (!digits) return '—';

    if (digits.startsWith('63')) {
        digits = digits.substring(2);
    }
    if (digits.startsWith('0')) {
        digits = digits.substring(1);
    }

    if (digits.length > 10) {
        digits = digits.slice(-10);
    } else if (digits.length < 10) {
        digits = digits.padStart(10, '0');
    }

    const fullNum = '0' + digits;
    return `${fullNum.substring(0, 4)}-${fullNum.substring(4)}`;
};

function FillBarcode({ value }: { value: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const render = () => {
            const container = containerRef.current;
            const svg = svgRef.current;
            if (!container || !svg) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            if (w === 0 || h === 0) return;
            JsBarcode(svg, value, {
                format: 'CODE128',
                displayValue: false,
                background: 'transparent',
                lineColor: '#000',
                margin: 0,
                width: 2,
                height: h,
            });

            const svgWidth = svg.getAttribute('width');
            const svgHeight = svg.getAttribute('height');
            if (svgWidth && svgHeight) {
                svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
                svg.setAttribute('width', '100%');
                svg.setAttribute('height', '100%');
                svg.setAttribute('preserveAspectRatio', 'none');
            }
        };
        render();
        const observer = new ResizeObserver(render);
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [value]);

    return (
        <div ref={containerRef} className="h-full w-full">
            <svg
                ref={svgRef}
                style={{ width: '100%', height: '100%', display: 'block' }}
            />
        </div>
    );
}

function AutoFitText({
    text,
    className,
}: {
    text: string;
    className?: string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const container = containerRef.current;
        const textEl = textRef.current;
        if (!container || !textEl) return;

        let rafId: number;
        let cancelled = false;

        const measure = () => {
            if (cancelled) return;

            const containerWidth = container.getBoundingClientRect().width;
            // scrollWidth reflects the element's natural (pre-transform) width —
            // transform: scale() never affects this, so it's always accurate.
            const textWidth = textEl.scrollWidth;

            if (!containerWidth || !textWidth) {
                // Layout not ready yet (e.g. still mounting, off-screen render) — retry.
                rafId = requestAnimationFrame(measure);
                return;
            }

            const nextScale =
                textWidth > containerWidth ? containerWidth / textWidth : 1;
            setScale(nextScale);
        };

        rafId = requestAnimationFrame(measure);

        const observer = new ResizeObserver(() => measure());
        observer.observe(container);

        document.fonts?.ready
            ?.then(() => {
                if (!cancelled) measure();
            })
            .catch(() => {});

        const timer1 = setTimeout(measure, 100);
        const timer2 = setTimeout(measure, 400);

        return () => {
            cancelled = true;
            cancelAnimationFrame(rafId);
            observer.disconnect();
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [text, className]);

    return (
        <div
            ref={containerRef}
            className="flex w-full items-center justify-center overflow-hidden"
        >
            <div
                ref={textRef}
                style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    whiteSpace: 'nowrap',
                    display: 'inline-block',
                    fontWeight: 'bold',
                }}
                className={className}
            >
                {text}
            </div>
        </div>
    );
}

interface StudentIdCardProps {
    data: StudentIdCardData;
    isFlipped: boolean;
}

export function StudentIdCard({ data, isFlipped }: StudentIdCardProps) {
    const avatarUrl = data.picture;

    const signatureUrl = data.e_signature;

    return (
        <div
            className="relative h-full w-full transition-transform duration-700"
            style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
        >
            {/* Front Side */}
            <Card
                data-slot="card"
                className="!min-w-none absolute inset-0 flex h-full w-full !max-w-none items-center justify-center overflow-hidden rounded-lg border-0 bg-white p-0 shadow-md"
                style={{ backfaceVisibility: 'hidden' }}
            >
                {/* ID Header */}
                <div className="absolute top-0 left-0 flex w-full items-center gap-1.5 px-3 py-3">
                    <img src="/logo.webp" alt="logo" className="w-14" />
                    <div className="flex flex-col leading-[1.1]">
                        <h4 className="font-arial text-[15.2px] font-extrabold whitespace-nowrap text-blue-900">
                            CARLOS HILADO MEMORIAL STATE UNIVERSITY
                        </h4>
                        <p className="font-arial text-[8.825px] font-medium whitespace-nowrap text-black">
                            Alijis Campus ∙ Binalbagan Campus ∙ Fortune-Towne
                            Campus ∙ Talisay (Main) Campus
                        </p>
                    </div>
                </div>

                {/* ID Body */}
                <div className="absolute top-19 right-3 bottom-13 left-3 grid grid-cols-[1fr_auto] gap-2">
                    <div className="font-arial relative w-full overflow-hidden text-center text-black">
                        {/* ID Student Full Name */}
                        <div className="w-full pt-18.75">
                            <AutoFitText
                                text={[
                                    data.first_name,
                                    data.middle_init
                                        ? `${data.middle_init}.`
                                        : null,
                                    data.last_name,
                                    data.suffix,
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                                className="text-center text-lg font-bold tracking-[-0.525] uppercase"
                            />
                        </div>
                        <div className="-mt-1 w-full">
                            {/* ID Program */}
                            <AutoFitText
                                text={data.program}
                                className="text-[10.5px] font-bold"
                            />
                            {/* ID College */}
                            <div className="-mt-1">
                                <AutoFitText
                                    text={data.college_name}
                                    className="text-[10.5px] font-bold"
                                />
                            </div>
                        </div>
                        {signatureUrl && (
                            <div className="absolute inset-0 mt-6 flex w-full justify-center">
                                <img
                                    src={signatureUrl}
                                    alt="Signature"
                                    className="h-16 w-[75%] object-contain mix-blend-multiply"
                                />
                            </div>
                        )}
                    </div>
                    <div className="aspect-square max-h-[154.06px] max-w-[154.06px] overflow-hidden rounded-sm border-4 border-green-700">
                        {/* ID Student Pro  file Picture */}
                        <img
                            src={avatarUrl}
                            className="h-full w-full rounded-none object-cover"
                        />
                    </div>
                </div>

                {/* ID Footer */}
                <div className="absolute right-0 bottom-0 left-0 grid grid-cols-[1fr_auto] gap-2">
                    <div className="absolute bottom-0 left-0 h-17.75 w-18.75 skew-x-27 bg-blue-900"></div>
                    <div className="absolute bottom-0 left-0 h-15.5 w-37.5 skew-x-27 bg-green-700"></div>
                    <div className="absolute bottom-0 left-0 h-10.5 w-104.5 skew-x-27 bg-neutral-300"></div>
                    <div className="absolute bottom-0 left-0 h-13 w-63.5 skew-x-27 bg-orange-400"></div>
                    <div className="absolute right-0 bottom-0 left-0 h-8.25 w-full overflow-hidden border-t border-black bg-white">
                        <div className="absolute bottom-0 -left-3 h-full w-51.25 skew-x-27 bg-green-700"></div>
                        <div className="absolute bottom-0 left-50.25 h-full w-5 skew-x-27 bg-green-700"></div>
                        <div className="absolute bottom-0 left-57 h-full w-3.5 skew-x-27 bg-green-700"></div>
                        <div className="absolute right-14 bottom-0 h-full w-3.5 skew-x-27 bg-blue-900"></div>
                        <div className="absolute right-8.5 bottom-0 h-full w-3.5 skew-x-27 bg-orange-400"></div>
                        <div className="absolute right-3 bottom-0 h-full w-3.5 skew-x-27 bg-green-700"></div>
                        <div className="absolute bottom-0 grid h-full items-center justify-center pl-4.25">
                            <h1 className="font-arial text-[30px] leading-0 font-black tracking-[3] text-white">
                                STUDENT
                            </h1>
                        </div>
                        <div className="font-arial absolute right-15.5 flex h-full w-38 flex-col pt-0.5 text-center font-bold text-black">
                            <p className="text-[7px]">ID NUMBER</p>
                            <p className="mt-0 text-[11px] tracking-[1px]">
                                {data.id_number}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Back Side */}
            <Card
                data-slot="card"
                className="min-w-none! absolute inset-0 flex h-full w-full max-w-none! items-center justify-center overflow-hidden rounded-lg bg-white p-0 shadow-md"
                style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                }}
            >
                {/* ID Body */}
                <div className="absolute top-0 right-0 bottom-8.25 left-0 grid grid-cols-[1fr_97.5px] gap-3.5 px-5.5 py-3.5">
                    <div className="h-full w-full">
                        <div>
                            <p className="font-arial text-[11px] leading-3.5 tracking-[0.55] text-black">
                                The bearer whose picture and signature appear
                                herein is a bonafide student at this university.
                                <br />
                                This card must always be worn inside the campus.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-arial mt-2 mb-0.5 text-[15px] font-bold tracking-[0.45] text-red-600">
                                In case of emergency, please contact
                            </h3>
                            <>
                                <h2 className="font-arial font-bold text-black uppercase">
                                    {[
                                        data.emergency_first_name,
                                        data.emergency_middle_init
                                            ? `${data.emergency_middle_init}.`
                                            : null,
                                        data.emergency_last_name,
                                        data.emergency_suffix,
                                    ]
                                        .filter(Boolean)
                                        .join(' ')}
                                </h2>
                                <div className="leading-3.25">
                                    <p className="font-arial text-[13px] text-black">
                                        Brgy.{' '}
                                        {`${data.barangay}, ${data.city}, ${data.zip_code}`}
                                    </p>
                                </div>
                                <p className="font-arial mt-0.25 text-[13px] font-bold text-black">
                                    {formatEmergencyNumber(
                                        data.contact_number as any,
                                    )}
                                </p>
                            </>
                        </div>
                        <div>
                            <h4 className="font-arial mt-1 text-[11px] font-semibold text-red-600">
                                If found, please return ID card to
                            </h4>
                            <div className="font-arial text-[10px] leading-2.75 text-black">
                                <p className="mt-0.5 text-[10.75px] font-bold uppercase">
                                    Carlos Hilado Memorial State University
                                </p>
                                <p className="font-bold">
                                    Office for Student Affairs and Services
                                </p>
                                <p>
                                    Mabini Street, Barangay Zone 1, Talisay City
                                </p>
                                <p>Negros Occidental</p>
                                <p>(034) 712 0005 local 132</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative h-full w-full">
                        <div className="absolute top-0 right-[97.5px] grid h-[97.5px] w-[155px] origin-top-right -rotate-90 grid-rows-[80px_auto]">
                            <FillBarcode value={data.id_number} />
                            <p className="-mt-[0.5px] text-center text-[13.5px] text-black">
                                {data.id_number}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status Box */}
                <div className="absolute right-5 bottom-9 flex h-16.75 w-29 flex-col items-center justify-center border-2 border-dashed border-black px-3">
                    <p className="text-center text-[7px] text-black">
                        provision for
                        <br />
                        validity sticker
                    </p>
                </div>

                {/* Back ID Footer */}
                <div className="absolute right-0 bottom-0 left-0 grid grid-cols-[1fr_auto] gap-2">
                    <div className="absolute right-0 bottom-0 left-0 h-8.25 w-full overflow-hidden bg-white">
                        <div className="absolute bottom-0 -left-3 h-full w-18.75 skew-x-27 bg-green-700"></div>
                        <div className="absolute bottom-0 left-17.5 h-full w-6 skew-x-27 bg-orange-400"></div>
                        <div className="absolute bottom-0 left-25.25 h-full w-3.75 skew-x-27 bg-blue-900"></div>
                        <div className="font-arial absolute right-0 left-30 flex h-full items-center justify-center text-center font-bold whitespace-nowrap text-blue-900">
                            <h1 className="-skew-x-8 text-2xl tracking-[-0.5px]">
                                <span className="text-green-700">GREEN</span>{' '}
                                CHMSU{' '}
                                <span className="text-orange-400">
                                    ExCELSIOR
                                </span>
                                !
                            </h1>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export function IdCardFront({ data }: { data: StudentIdCardData }) {
    const avatarUrl = data.picture;

    const signatureUrl = data.e_signature;

    return (
        <Card className="!min-w-none relative flex h-full w-full !max-w-none items-center justify-center overflow-hidden rounded-lg border-0 bg-white p-0 shadow-md">
            {/* ID Header */}
            <div className="absolute top-0 left-0 flex w-full items-center gap-1.5 px-3 py-3">
                <img src="/logo.webp" alt="logo" className="w-14" />
                <div className="flex flex-col leading-[1.1]">
                    <h4 className="font-arial text-[15.2px] font-extrabold whitespace-nowrap text-blue-900">
                        CARLOS HILADO MEMORIAL STATE UNIVERSITY
                    </h4>
                    <p className="font-arial text-[8.825px] font-medium whitespace-nowrap text-black">
                        Alijis Campus ∙ Binalbagan Campus ∙ Fortune-Towne Campus
                        ∙ Talisay (Main) Campus
                    </p>
                </div>
            </div>

            {/* ID Body */}
            <div className="absolute top-19 right-3 bottom-13 left-3 grid grid-cols-[1fr_auto] gap-2">
                <div className="font-arial relative w-full overflow-hidden text-center text-black">
                    <div className="w-full pt-18.75">
                        <AutoFitText
                            text={[
                                data.first_name,
                                data.middle_init
                                    ? `${data.middle_init}.`
                                    : null,
                                data.last_name,
                                data.suffix,
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            className="text-center text-lg font-bold tracking-[-0.525] uppercase"
                        />
                    </div>
                    <div className="-mt-1 w-full">
                        <AutoFitText
                            text={data.program || 'Program Title'}
                            className="text-[10.5px] font-bold"
                        />
                        <div className="-mt-1">
                            <AutoFitText
                                text={
                                    data.college_name || 'College Description'
                                }
                                className="text-[10.5px] font-bold"
                            />
                        </div>
                    </div>
                    {signatureUrl && (
                        <div className="absolute inset-0 mt-6 flex w-full justify-center">
                            <img
                                src={signatureUrl}
                                alt="Signature"
                                className="h-16 w-[75%] object-contain mix-blend-multiply"
                            />
                        </div>
                    )}
                </div>
                <div className="aspect-square max-h-[154.06px] max-w-[154.06px] overflow-hidden rounded-sm border-4 border-green-700">
                    <img
                        src={avatarUrl}
                        className="h-full w-full rounded-none object-cover"
                    />
                </div>
            </div>

            {/* ID Footer */}
            <div className="absolute right-0 bottom-0 left-0 grid grid-cols-[1fr_auto] gap-2">
                <div className="absolute bottom-0 left-0 h-17.75 w-18.75 skew-x-27 bg-blue-900"></div>
                <div className="absolute bottom-0 left-0 h-15.5 w-37.5 skew-x-27 bg-green-700"></div>
                <div className="absolute bottom-0 left-0 h-10.5 w-104.5 skew-x-27 bg-neutral-300"></div>
                <div className="absolute bottom-0 left-0 h-13 w-63.5 skew-x-27 bg-orange-400"></div>
                <div className="absolute right-0 bottom-0 left-0 h-8.25 w-full overflow-hidden border-t border-black bg-white">
                    <div className="absolute bottom-0 -left-3 h-full w-51.25 skew-x-27 bg-green-700"></div>
                    <div className="absolute bottom-0 left-50.25 h-full w-5 skew-x-27 bg-green-700"></div>
                    <div className="absolute bottom-0 left-57 h-full w-3.5 skew-x-27 bg-green-700"></div>
                    <div className="absolute right-14 bottom-0 h-full w-3.5 skew-x-27 bg-blue-900"></div>
                    <div className="absolute right-8.5 bottom-0 h-full w-3.5 skew-x-27 bg-orange-400"></div>
                    <div className="absolute right-3 bottom-0 h-full w-3.5 skew-x-27 bg-green-700"></div>
                    <div className="absolute bottom-0 grid h-full items-center justify-center pl-4.25">
                        <h1 className="font-arial text-[30px] leading-0 font-black tracking-[3] text-white">
                            STUDENT
                        </h1>
                    </div>
                    <div className="font-arial absolute right-15.5 flex h-full w-38 flex-col pt-0.5 text-center font-bold text-black">
                        <p className="text-[7px]">ID NUMBER</p>
                        <p className="mt-0 text-[11px] tracking-[1px]">
                            {data.id_number || '00000000'}
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
}

export function IdCardBack({ data }: { data: StudentIdCardData }) {
    return (
        <Card className="!min-w-none relative flex h-full w-full !max-w-none items-center justify-center overflow-hidden rounded-lg bg-white p-0 shadow-md">
            {/* ID Body */}
            <div className="absolute top-0 right-0 bottom-8.25 left-0 grid grid-cols-[1fr_97.5px] gap-3.5 px-5.5 py-3.5">
                <div className="h-full w-full">
                    <div>
                        <p className="font-arial text-[11px] leading-3.5 tracking-[0.55] text-black">
                            The bearer whose picture and signature appear herein
                            is a bonafide student at this university.
                            <br />
                            This card must always be worn inside the campus.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-arial mt-2 mb-0.5 text-[15px] font-bold tracking-[0.45] text-red-600">
                            In case of emergency, please contact
                        </h3>
                        <>
                            <h2 className="font-arial font-bold text-black uppercase">
                                {[
                                    data.emergency_first_name,
                                    data.emergency_middle_init
                                        ? `${data.emergency_middle_init}.`
                                        : null,
                                    data.emergency_last_name,
                                    data.emergency_suffix,
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                            </h2>
                            <div className="leading-3.25">
                                <p className="font-arial text-[13px] text-black">
                                    Brgy.{' '}
                                    {`${data.barangay}, ${data.city}, ${data.zip_code}`}
                                </p>
                            </div>
                            <p className="font-arial mt-0.25 text-[13px] font-bold text-black">
                                {formatEmergencyNumber(
                                    data.contact_number as any,
                                )}
                            </p>
                        </>
                    </div>
                    <div>
                        <h4 className="font-arial mt-1 text-[11px] font-semibold text-red-600">
                            If found, please return ID card to
                        </h4>
                        <div className="font-arial text-[10px] leading-2.75 text-black">
                            <p className="mt-0.5 text-[10.75px] font-bold uppercase">
                                Carlos Hilado Memorial State University
                            </p>
                            <p className="font-bold">
                                Office for Student Affairs and Services
                            </p>
                            <p>Mabini Street, Barangay Zone 1, Talisay City</p>
                            <p>Negros Occidental</p>
                            <p>(034) 712 0005 local 132</p>
                        </div>
                    </div>
                </div>
                <div className="relative h-full w-full">
                    <div className="absolute top-0 right-[97.5px] grid h-[97.5px] w-[155px] origin-top-right -rotate-90 grid-rows-[80px_auto]">
                        <FillBarcode value={data.id_number || '00000000'} />
                        <p className="-mt-[0.5px] text-center text-[13.5px] text-black">
                            {data.id_number || '00000000'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Status Box */}
            <div className="absolute right-5 bottom-9 flex h-16.75 w-29 flex-col items-center justify-center border-2 border-dashed border-black px-3">
                <p className="text-center text-[7px] text-black">
                    provision for
                    <br />
                    validity sticker
                </p>
            </div>

            {/* Back ID Footer */}
            <div className="absolute right-0 bottom-0 left-0 grid grid-cols-[1fr_auto] gap-2">
                <div className="absolute right-0 bottom-0 left-0 h-8.25 w-full overflow-hidden bg-white">
                    <div className="absolute bottom-0 -left-3 h-full w-18.75 skew-x-27 bg-green-700"></div>
                    <div className="absolute bottom-0 left-17.5 h-full w-6 skew-x-27 bg-orange-400"></div>
                    <div className="absolute bottom-0 left-25.25 h-full w-3.75 skew-x-27 bg-blue-900"></div>
                    <div className="font-arial absolute right-0 left-30 flex h-full items-center justify-center text-center font-bold whitespace-nowrap text-blue-900">
                        <h1 className="-skew-x-8 text-2xl tracking-[-0.5px]">
                            <span className="text-green-700">GREEN</span> CHMSU{' '}
                            <span className="text-orange-400">ExCELSIOR</span>!
                        </h1>
                    </div>
                </div>
            </div>
        </Card>
    );
}
