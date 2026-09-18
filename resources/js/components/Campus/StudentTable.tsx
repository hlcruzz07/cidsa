import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import { StudentProps } from '@/lib/custom-types';
import { ChangeLogsModal } from '@/pages/Campus/Modal/ChangeLogsModal';
import { StudentEditModal } from '@/pages/Campus/Modal/StudentEditModal';
import { router } from '@inertiajs/react';
import dayjs from 'dayjs';
import {
    CheckCheckIcon,
    CheckIcon,
    ClockIcon,
    EllipsisIcon,
    HistoryIcon,
    PrinterIcon,
    UserSearch,
} from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface StudentTableProps {
    students: StudentProps[];
    total?: number;
    from?: number;
    to?: number;
    links?: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    onPageChange?: (page: string) => void;
    isLoading?: boolean;
    onChangeStatus: () => void;
    onPrint?: (id: number) => void;
}

export function StudentTable({
    students,
    total = 0,
    from = 0,
    to = 0,
    links = [],
    onPageChange,
    isLoading = false,
    onPrint,
    onChangeStatus,
}: StudentTableProps) {
    const headers = [
        'Name',
        'Campus / Department',
        'Program / Major',
        'Year Level',
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
                            Loading students...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const getInitials = useInitials();

    const handleStatus = (status: 'pending' | 'printed', id_number: string) => {
        router.put(
            route('update.student.new.status', {
                status,
                id_number,
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

    const [selectedStudent, setSelectedStudent] = useState<StudentProps | null>(
        null,
    );
    const [editOpen, setEditOpen] = useState(false);

    // Change-logs modal state kept separate from selectedStudent/editOpen
    // above so opening one doesn't affect the other — a row action can
    // trigger either modal independently.
    const [logsStudent, setLogsStudent] = useState<StudentProps | null>(null);
    const [logsOpen, setLogsOpen] = useState(false);

    return (
        <>
            <StudentEditModal
                student={selectedStudent}
                open={editOpen}
                onOpenChange={setEditOpen}
                onSuccess={onChangeStatus}
            />

            <ChangeLogsModal
                student={logsStudent}
                open={logsOpen}
                onOpenChange={setLogsOpen}
            />

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
                        {students.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={headers.length}
                                    className="border p-3 text-center"
                                >
                                    No records found.
                                </td>
                            </tr>
                        ) : (
                            students.map((row, index) => (
                                <tr key={index} className="hover:bg-muted/50">
                                    <td
                                        className="p-2 whitespace-nowrap"
                                        data-label="Name"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                {row.printed ? (
                                                    <CheckIcon className="absolute -top-1 -right-2 z-10 size-3.5 rounded-full border bg-primary p-0.5 text-white" />
                                                ) : (
                                                    <ClockIcon className="absolute -top-1 -right-2 z-10 size-3.5 rounded-full border bg-muted p-0.5 text-white" />
                                                )}

                                                <Avatar className="size-8 overflow-hidden rounded-full">
                                                    <AvatarImage
                                                        src={route(
                                                            'gdrive.image',
                                                            row.picture,
                                                        )}
                                                        className="object-cover"
                                                        loading="lazy"
                                                        decoding="async"
                                                        alt={[
                                                            row.first_name,
                                                            row.middle_init,
                                                            row.last_name,
                                                            row.suffix,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' ')}
                                                    />
                                                    <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                                        {getInitials(
                                                            [
                                                                row.first_name,
                                                                row.middle_init,
                                                                row.last_name,
                                                                row.suffix,
                                                            ]
                                                                .filter(Boolean)
                                                                .join(' '),
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>

                                            <div>
                                                <h4 className="font-medium">
                                                    {[
                                                        row.first_name,
                                                        row.middle_init,
                                                        row.last_name,
                                                        row.suffix,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' ')}
                                                </h4>

                                                <div className="flex items-center gap-2">
                                                    <small className="text-muted-foreground">
                                                        {row.id_number}
                                                    </small>

                                                    <small className="text-muted-foreground">
                                                        •
                                                    </small>

                                                    <small
                                                        className={`font-bold ${row.printed ? 'text-primary' : 'text-muted-foreground'}`}
                                                    >
                                                        {row.printed
                                                            ? 'Printed'
                                                            : 'Pending'}
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td
                                        className="p-2 whitespace-nowrap"
                                        data-label="Campus"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">
                                                {row.campus}
                                            </span>
                                            {row.college_name && (
                                                <span className="text-xs text-muted-foreground">
                                                    {row.college_name}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td
                                        className="p-2 whitespace-nowrap"
                                        data-label="Program"
                                    >
                                        <div className="flex max-w-[300px] flex-col">
                                            <span
                                                className="truncate font-medium text-foreground"
                                                title={row.program}
                                            >
                                                {row.program}
                                            </span>
                                            {row.major ? (
                                                <span
                                                    className="truncate text-xs text-muted-foreground"
                                                    title={row.major}
                                                >
                                                    {row.major}
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
                                        {row.year}
                                    </td>

                                    <td className="p-2 text-[10px]! whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-14 shrink-0 font-medium text-muted-foreground">
                                                    Created
                                                </span>
                                                <span className="text-foreground">
                                                    {row.created_at
                                                        ? dayjs(
                                                              row.created_at,
                                                          ).format(
                                                              'MMM D, YYYY · h:mm A',
                                                          )
                                                        : '—'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-14 shrink-0 font-medium text-muted-foreground">
                                                    Updated
                                                </span>

                                                <span
                                                    className={
                                                        row.updated_at &&
                                                        row.created_at &&
                                                        !dayjs(
                                                            row.updated_at,
                                                        ).isSame(
                                                            dayjs(
                                                                row.created_at,
                                                            ),
                                                        )
                                                            ? 'text-amber-600 dark:text-amber-400'
                                                            : 'text-foreground'
                                                    }
                                                >
                                                    {row.updated_at
                                                        ? dayjs(
                                                              row.updated_at,
                                                          ).format(
                                                              'MMM D, YYYY · h:mm A',
                                                          )
                                                        : '—'}
                                                </span>
                                            </div>

                                            {row.printed?.created_at && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-14 shrink-0 font-medium text-muted-foreground">
                                                        Printed
                                                    </span>
                                                    <span className="font-medium text-green-600 dark:text-green-500">
                                                        {dayjs(
                                                            row.printed
                                                                .created_at,
                                                        ).format(
                                                            'MMM D, YYYY · h:mm A',
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td className="p-2 whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                aria-label="View / Edit student"
                                                disabled={!row.is_completed}
                                                onClick={() => {
                                                    setSelectedStudent(row);
                                                    setEditOpen(true);
                                                }}
                                            >
                                                <UserSearch />
                                            </Button>

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

                                                    {onPrint && (
                                                        <DropdownMenuItem
                                                            disabled={
                                                                !row.is_completed
                                                            }
                                                            onClick={() =>
                                                                onPrint(row.id)
                                                            }
                                                        >
                                                            <PrinterIcon />
                                                            Print
                                                        </DropdownMenuItem>
                                                    )}

                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setLogsStudent(row);
                                                            setLogsOpen(true);
                                                        }}
                                                    >
                                                        <HistoryIcon />
                                                        View Change Logs
                                                    </DropdownMenuItem>

                                                    {row.printed_exists ? (
                                                        <DropdownMenuItem
                                                            disabled={
                                                                !row.is_completed
                                                            }
                                                            onClick={() =>
                                                                handleStatus(
                                                                    'pending',
                                                                    row.id_number,
                                                                )
                                                            }
                                                        >
                                                            <ClockIcon />
                                                            Mark as Pending
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            disabled={
                                                                !row.is_completed
                                                            }
                                                            onClick={() =>
                                                                handleStatus(
                                                                    'printed',
                                                                    row.id_number,
                                                                )
                                                            }
                                                        >
                                                            <CheckCheckIcon />
                                                            Mark as Printed
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {links.length > 0 && (
                        <tfoot>
                            <tr>
                                <td
                                    colSpan={headers.length}
                                    className="px-6 py-4"
                                >
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
                                                    const url = new URL(
                                                        link.url,
                                                    );
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
                                                                onPageChange(
                                                                    page,
                                                                );
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
        </>
    );
}
