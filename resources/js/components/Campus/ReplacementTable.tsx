import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import { StudentReplacement } from '@/lib/custom-types';
import { router } from '@inertiajs/react';
import dayjs from 'dayjs';
import {
    CheckCheckIcon,
    ClockIcon,
    EllipsisIcon,
    PrinterIcon,
} from 'lucide-react';
import { route } from 'ziggy-js';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface ReplacementTableProps {
    replacements: StudentReplacement[];
    total?: number;
    from?: number;
    to?: number;
    links?: PaginationLink[];
    onPageChange: (page: string) => void;
    isLoading?: boolean;
    onPrint?: (studentId: number) => void;
    onChangeStatus: () => void;
}

export function ReplacementTable({
    replacements,
    total = 0,
    from = 0,
    to = 0,
    links = [],
    onPageChange,
    isLoading = false,
    onPrint,
    onChangeStatus,
}: ReplacementTableProps) {
    const headers = [
        '#',
        'Name',
        'Campus / Department',
        'Program / Major',
        'Year Level',
        'Reason',
        'Status',
        'Date',
        'Action',
    ];

    if (isLoading) {
        return (
            <div className="relative mt-3 overflow-x-auto md:shadow-md lg:border">
                <div className="flex h-64 items-center justify-center">
                    <div className="text-center">
                        <div className="mb-4 text-4xl">⏳</div>
                        <p className="text-muted-foreground">
                            Loading replacement requests...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const getInitials = useInitials();

    const handleStatus = (status: 'pending' | 'printed', id: number) => {
        router.put(
            route('update.student.rep.status', {
                status,
                id,
            }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    onChangeStatus();
                },
            },
        );
    };

    return (
        <div className="relative mt-3 overflow-x-auto md:shadow-md lg:border">
            <table className="table w-full text-left text-xs text-foreground">
                <thead className="lg:border-b">
                    <tr>
                        {headers.map((header) => (
                            <th
                                key={header}
                                scope="col"
                                className="p-2 whitespace-nowrap"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="lg:border-b">
                    {replacements.length === 0 ? (
                        <tr>
                            <td
                                colSpan={headers.length}
                                className="border p-3 text-center"
                            >
                                No replacement requests found.
                            </td>
                        </tr>
                    ) : (
                        replacements.map((r, index) => {
                            const fullName = [
                                r.student?.first_name,
                                r.student?.middle_init,
                                r.student?.last_name,
                                r.student?.suffix,
                            ]
                                .filter(Boolean)
                                .join(' ');

                            return (
                                <tr key={r.id} className="hover:bg-muted/50">
                                    <td
                                        className="p-2 whitespace-nowrap"
                                        data-label="#"
                                    >
                                        {r.id}
                                    </td>

                                    <td
                                        className="p-2 whitespace-nowrap"
                                        data-label="Name"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Avatar className="size-8 overflow-hidden rounded-full">
                                                <AvatarImage
                                                    src={
                                                        r.student?.picture
                                                            ? route(
                                                                  'gdrive.image',
                                                                  r.student
                                                                      .picture,
                                                              )
                                                            : undefined
                                                    }
                                                    className="object-cover"
                                                    alt={fullName}
                                                />
                                                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                                    {getInitials(fullName)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h4 className="font-medium uppercase">
                                                    {fullName || '—'}
                                                </h4>
                                                <small className="text-muted-foreground">
                                                    {r.student?.id_number ??
                                                        '—'}
                                                </small>
                                            </div>
                                        </div>
                                    </td>

                                    <td
                                        className="p-2 whitespace-nowrap"
                                        data-label="Campus"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">
                                                {r.student?.campus ?? '—'}
                                            </span>
                                            {r.student?.college_name && (
                                                <span className="text-xs text-muted-foreground">
                                                    {r.student.college_name}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td
                                        className="p-2 whitespace-nowrap"
                                        data-label="Program"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">
                                                {r.student?.program ?? '—'}
                                            </span>
                                            {r.student?.major ? (
                                                <span className="text-xs text-muted-foreground">
                                                    {r.student.major}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    --
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td
                                        className="p-2 whitespace-nowrap"
                                        data-label="Year Level"
                                    >
                                        {r.student?.year ?? '—'}
                                    </td>

                                    <td
                                        className="max-w-[180px] truncate p-2"
                                        data-label="Reason"
                                    >
                                        {r.reason ?? '—'}
                                    </td>

                                    <td
                                        className="p-2 whitespace-nowrap"
                                        data-label="Status"
                                    >
                                        {r.is_printed ? (
                                            <Badge>
                                                <CheckCheckIcon /> Printed
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">
                                                <ClockIcon /> Pending
                                            </Badge>
                                        )}
                                    </td>

                                    <td className="p-2 text-[10px]! whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-14 shrink-0 font-medium text-muted-foreground">
                                                    Created
                                                </span>
                                                <span className="text-foreground">
                                                    {r.created_at
                                                        ? dayjs(
                                                              r.created_at,
                                                          ).format(
                                                              'MMM D, YYYY · h:mm A',
                                                          )
                                                        : '—'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <span className="w-14 shrink-0 font-medium text-muted-foreground">
                                                    Printed
                                                </span>
                                                {r.printed_at ? (
                                                    <span className="font-medium text-green-600 dark:text-green-500">
                                                        {dayjs(
                                                            r.printed_at,
                                                        ).format(
                                                            'MMM D, YYYY · h:mm A',
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground italic">
                                                        Not yet printed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="p-2 whitespace-nowrap">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    aria-label="Actions"
                                                >
                                                    <EllipsisIcon />
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent
                                                className="w-48"
                                                align="end"
                                            >
                                                <DropdownMenuLabel>
                                                    Actions
                                                </DropdownMenuLabel>

                                                {onPrint && r.student?.id && (
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            onPrint(
                                                                r.student!.id,
                                                            )
                                                        }
                                                    >
                                                        <PrinterIcon />
                                                        Preview & Print ID
                                                    </DropdownMenuItem>
                                                )}

                                                {r.is_printed ? (
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleStatus(
                                                                'pending',
                                                                r.id,
                                                            )
                                                        }
                                                    >
                                                        <ClockIcon />
                                                        Mark as Pending
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleStatus(
                                                                'printed',
                                                                r.id,
                                                            )
                                                        }
                                                    >
                                                        <CheckCheckIcon />
                                                        Mark as Printed
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>

                {links.length > 0 && (
                    <tfoot>
                        <tr>
                            <td colSpan={headers.length} className="px-6 py-4">
                                <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                                    <p className="text-sm text-muted-foreground">
                                        Showing{' '}
                                        <span className="font-medium">
                                            {from}
                                        </span>
                                        –
                                        <span className="font-medium">
                                            {to}
                                        </span>{' '}
                                        of{' '}
                                        <span className="font-medium">
                                            {total}
                                        </span>
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {links.map((link, idx) => {
                                            let page: string | null = null;
                                            if (link.url) {
                                                const url = new URL(link.url);
                                                page =
                                                    url.searchParams.get(
                                                        'page',
                                                    );
                                            }
                                            return (
                                                <button
                                                    key={idx}
                                                    disabled={
                                                        !link.url ||
                                                        !onPageChange
                                                    }
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (
                                                            page &&
                                                            onPageChange
                                                        ) {
                                                            onPageChange(page);
                                                        }
                                                    }}
                                                    className={`rounded px-3 py-1 ${
                                                        link.active
                                                            ? 'bg-primary text-white dark:text-black'
                                                            : 'bg-muted text-muted-foreground hover:bg-muted/70'
                                                    }`}
                                                    type="button"
                                                >
                                                    <span
                                                        dangerouslySetInnerHTML={{
                                                            __html: link.label,
                                                        }}
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
}
