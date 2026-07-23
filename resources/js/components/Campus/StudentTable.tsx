import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StudentProps } from '@/lib/custom-types';
import { Link, router } from '@inertiajs/react';
import dayjs from 'dayjs';
import {
    CheckCheckIcon,
    ClockIcon,
    EyeIcon,
    PencilIcon,
    PrinterIcon,
    SlidersHorizontalIcon,
    UserCogIcon,
} from 'lucide-react';
import { route } from 'ziggy-js';

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
        '#',
        'ID Number',
        'Name',
        'Campus',
        'College',
        'Program',
        'Year Level',
        'Status',
        'Date Updated',
        'Date Printed',
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

    return (
        <>
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
                                        data-label="#"
                                    >
                                        {row.id}
                                    </td>
                                    <td
                                        className="p-2 whitespace-nowrap"
                                        data-label="ID Number"
                                    >
                                        {row.id_number}
                                    </td>
                                    <td
                                        className="p-2 whitespace-nowrap"
                                        data-label="Name"
                                    >
                                        {`${row.first_name} ${row.middle_init ? row.middle_init + '.' : ''} ${row.last_name} ${row.suffix ? row.suffix + '.' : ''}`}
                                    </td>
                                    <td
                                        className="p-2 whitespace-nowrap"
                                        data-label="Campus"
                                    >
                                        {row.campus}
                                    </td>
                                    <td
                                        className="p-2 whitespace-nowrap"
                                        data-label="College"
                                    >
                                        {row.college}
                                    </td>
                                    <td
                                        className="p-2 whitespace-nowrap"
                                        data-label="Program"
                                    >
                                        {row.program}
                                    </td>
                                    <td
                                        className="p-2 whitespace-nowrap"
                                        data-label="Year Level"
                                    >
                                        {row.year}
                                    </td>

                                    <td
                                        className="p-2 whitespace-nowrap"
                                        data-label="Status"
                                    >
                                        {row.printed_exists ? (
                                            <Badge>Printed</Badge>
                                        ) : (
                                            <Badge variant="outline">
                                                Pending
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="p-2 whitespace-nowrap">
                                        {row.updated_at
                                            ? dayjs(row.updated_at).format(
                                                  'MMM D, YYYY - h:mm A',
                                              )
                                            : ''}
                                    </td>
                                    <td className="p-2 whitespace-nowrap">
                                        {row.printed?.created_at
                                            ? dayjs(
                                                  row.printed?.created_at,
                                              ).format('MMM D, YYYY - h:mm A')
                                            : ''}
                                    </td>
                                    <td className="p-2 whitespace-nowrap">
                                        <div className="flex flex-wrap gap-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="icon-sm"
                                                    >
                                                        <SlidersHorizontalIcon />
                                                    </Button>
                                                </DropdownMenuTrigger>

                                                <DropdownMenuContent
                                                    className="w-max"
                                                    align="center"
                                                >
                                                    {onPrint && (
                                                        <DropdownMenuItem
                                                            disabled={
                                                                !row.is_completed
                                                            }
                                                            onClick={() =>
                                                                onPrint(row.id)
                                                            }
                                                        >
                                                            <PrinterIcon className="mr-2 h-4 w-4" />
                                                            Print
                                                        </DropdownMenuItem>
                                                    )}

                                                    <DropdownMenuSeparator />

                                                    {row.printed_exists ? (
                                                        <DropdownMenuItem
                                                            disabled={
                                                                !row.is_completed
                                                            }
                                                            onClick={() => {
                                                                handleStatus(
                                                                    'pending',
                                                                    row.id_number,
                                                                );
                                                            }}
                                                        >
                                                            <ClockIcon className="mr-2 h-4 w-4" />
                                                            Mark as Pending
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            disabled={
                                                                !row.is_completed
                                                            }
                                                            onClick={() => {
                                                                handleStatus(
                                                                    'printed',
                                                                    row.id_number,
                                                                );
                                                            }}
                                                        >
                                                            <CheckCheckIcon className="mr-2 h-4 w-4" />
                                                            Mark as Printed
                                                        </DropdownMenuItem>
                                                    )}

                                                    {/* <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>
                                                            <CheckCheckIcon className="mr-2 h-4 w-4" />
                                                            Status
                                                        </DropdownMenuSubTrigger>

                                                        <DropdownMenuSubContent>
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    handleStatus(
                                                                        'pending',
                                                                        row.id_number,
                                                                    );
                                                                }}
                                                                disabled={
                                                                    !row.printed_exists
                                                                }
                                                            >
                                                                <ClockIcon className="mr-2 h-4 w-4" />
                                                                Pending
                                                            </DropdownMenuItem>

                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    handleStatus(
                                                                        'printed',
                                                                        row.id_number,
                                                                    );
                                                                }}
                                                                disabled={
                                                                    row.printed_exists
                                                                }
                                                            >
                                                                <CheckIcon className="mr-2 h-4 w-4" />
                                                                Printed
                                                            </DropdownMenuItem>
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuSub> */}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="icon-sm"
                                                    >
                                                        <UserCogIcon />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    className="w-max"
                                                    align="end"
                                                >
                                                    {row.is_completed ? (
                                                        <Link
                                                            href={route(
                                                                'campus.view.student',
                                                                row.id,
                                                            )}
                                                        >
                                                            <DropdownMenuItem>
                                                                <EyeIcon /> View
                                                            </DropdownMenuItem>
                                                        </Link>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            disabled
                                                        >
                                                            <EyeIcon /> View
                                                        </DropdownMenuItem>
                                                    )}
                                                    {row.is_completed ? (
                                                        <Link
                                                            href={route(
                                                                'campus.edit.student',
                                                                row.id,
                                                            )}
                                                        >
                                                            <DropdownMenuItem>
                                                                <PencilIcon />{' '}
                                                                Edit
                                                            </DropdownMenuItem>
                                                        </Link>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            disabled
                                                        >
                                                            <PencilIcon /> Edit
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
