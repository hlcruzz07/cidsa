import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { StudentReplacement } from '@/lib/custom-types';
import { ChevronLeft, ChevronRight, Loader2, Printer } from 'lucide-react';

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
    onMarkPrinted?: (replacementId: number) => void;
}

export function ReplacementTable({
    replacements,
    total,
    from,
    to,
    links,
    onPageChange,
    isLoading = false,
    onPrint,
    onMarkPrinted,
}: ReplacementTableProps) {
    const extractPage = (url: string | null) => {
        if (!url) return null;
        const match = url.match(/page=(\d+)/);
        return match ? match[1] : null;
    };

    const prevLink = links?.find((l) => l.label.includes('Previous'));
    const nextLink = links?.find((l) => l.label.includes('Next'));
    const pageLinks = links?.filter(
        (l) => !l.label.includes('Previous') && !l.label.includes('Next'),
    );

    return (
        <div className="flex flex-col gap-3">
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>ID Number</TableHead>
                            <TableHead>Program</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Receipt</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Updated</TableHead>
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={9}
                                    className="py-12 text-center text-muted-foreground"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading…
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : replacements.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={9}
                                    className="py-12 text-center text-muted-foreground"
                                >
                                    No replacement requests found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            replacements.map((r, i) => {
                                const fullName = [
                                    r.student?.first_name,
                                    r.student?.middle_init
                                        ? `${r.student.middle_init}.`
                                        : null,
                                    r.student?.last_name,
                                    r.student?.suffix,
                                ]
                                    .filter(Boolean)
                                    .join(' ');

                                return (
                                    <TableRow key={r.id}>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {(from ?? 1) + i - 1}
                                        </TableCell>
                                        <TableCell className="font-medium uppercase">
                                            {fullName || '—'}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {r.student?.id_number ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {r.student?.program ?? '—'}
                                        </TableCell>
                                        <TableCell className="max-w-[180px] truncate text-xs">
                                            {r.reason ?? '—'}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {r.receipt ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            {r.is_printed ? (
                                                <Badge
                                                    variant="default"
                                                    className="text-xs"
                                                >
                                                    Printed
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    Pending
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                                            {r.updated_at
                                                ? new Date(
                                                      r.updated_at,
                                                  ).toLocaleDateString(
                                                      'en-US',
                                                      {
                                                          year: 'numeric',
                                                          month: 'short',
                                                          day: 'numeric',
                                                      },
                                                  )
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {onPrint && r.student?.id && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            onPrint(
                                                                r.student!.id,
                                                            )
                                                        }
                                                        title="Preview & Print ID"
                                                    >
                                                        <Printer className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                {onMarkPrinted &&
                                                    !r.is_printed && (
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            onClick={() =>
                                                                onMarkPrinted(
                                                                    r.id,
                                                                )
                                                            }
                                                            title="Mark as printed"
                                                        >
                                                            Mark Printed
                                                        </Button>
                                                    )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {links && links.length > 3 && (
                <div className="flex items-center justify-between text-sm">
                    <p className="text-muted-foreground">
                        {from && to && total
                            ? `Showing ${from}–${to} of ${total.toLocaleString()} entries`
                            : ''}
                    </p>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!prevLink?.url}
                            onClick={() => {
                                const p = extractPage(prevLink?.url ?? null);
                                if (p) onPageChange(p);
                            }}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {pageLinks?.map((link) => {
                            const page = extractPage(link.url);
                            if (link.label === '...') {
                                return (
                                    <span
                                        key={link.label}
                                        className="px-1 text-muted-foreground"
                                    >
                                        …
                                    </span>
                                );
                            }
                            return (
                                <Button
                                    key={link.label}
                                    variant={
                                        link.active ? 'default' : 'outline'
                                    }
                                    size="sm"
                                    className="w-8"
                                    disabled={!page}
                                    onClick={() => page && onPageChange(page)}
                                >
                                    {link.label}
                                </Button>
                            );
                        })}

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!nextLink?.url}
                            onClick={() => {
                                const p = extractPage(nextLink?.url ?? null);
                                if (p) onPageChange(p);
                            }}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
