import ResponsiveTabs from '@/layouts/responsive-tabs-layout';
import {
    PaginateStudentReplacement,
    PaginateStudents,
    PrintType,
    StudentProps,
} from '@/lib/custom-types';
import { campusDirectoryArr } from '@/lib/utils';
import apiService from '@/services/apiService';
import { usePage } from '@inertiajs/react';
import { Clock, Printer, Users, WrenchIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import Heading from '../heading';
import { Badge } from '../ui/badge';
import { BatchIdPreviewDialog } from './BatchIdPreviewDialog';
import { ExportPhase, ExportStatusDialog } from './ExportStatusDialog';
import { ExportStatusOptions, FilterBar } from './FilterBar';
import { IdPreviewDialog } from './Preview';
import { ReplacementFilterBar } from './ReplacementFilterBar';
import { ReplacementTable } from './ReplacementTable';
import { StudentTable } from './StudentTable';
import Widget from './Widget';

type DateRange = { from: Date; to?: Date };
type DateField = 'created_at' | 'updated_at';
interface CampusStudentManagerProps {
    campus: string;
    onFilterChange?: (params: any) => void;
}

export function CampusStudentManager({
    campus,
    onFilterChange,
}: CampusStudentManagerProps) {
    const { counts } = usePage<any>().props;

    const collegeTalArr = campusDirectoryArr.find((c) =>
        c.campus.includes(campus),
    )?.colleges;

    const startOfDay = (d?: Date) =>
        d ? new Date(d.setHours(0, 0, 0, 0)).toISOString() : null;
    const endOfDay = (d?: Date) =>
        d ? new Date(d.setHours(23, 59, 59, 999)).toISOString() : null;

    const [students, setStudents] = useState<PaginateStudents | null>(null);
    const [studentsLoading, setStudentsLoading] = useState(false);

    // Every student we've loaded so far, keyed by id_number. The selection is
    // kept across pages, so the batch preview can't rely on the current page
    // alone — this lets it resolve selected students from earlier pages
    // without fetching them again. Re-fetching a page refreshes its entries.
    const studentCache = useRef<Record<string, StudentProps>>({});

    const [sSearch, setSSearch] = useState<string | null>(null);
    const [sType, setSType] = useState<string | null>(null);
    const [sCollege, setSCollege] = useState<string | null>(null);
    const [sProgram, setSProgram] = useState<string | null>(null);
    const [sMajor, setSMajor] = useState<string | null>(null);
    const [sYear, setSYear] = useState<string | null>(null);
    const [sIsPrinted, setSIsPrinted] = useState<boolean | null>(null);
    const [sRange, setSRange] = useState<DateRange | undefined>();
    const [sDateField, setSDateField] = useState<DateField>('created_at');
    const [sPerPage, setSPerPage] = useState(10);
    const [sSort, setSSort] = useState('created_at');
    const [sOrder, setSOrder] = useState<'asc' | 'desc'>('desc');

    const sProgramsArr =
        collegeTalArr?.find((c) => c.value === sCollege)?.programs ?? null;
    const sMajorArr =
        sProgramsArr?.find((p) => p.name === sProgram)?.majors ?? null;

    const sFilterParams = () => ({
        search: sSearch || null,
        type: sType || null,
        college: sCollege || null,
        program: sProgram || null,
        major: sMajor || null,
        year: sYear || null,
        is_printed: sIsPrinted,
        from: startOfDay(sRange?.from),
        to: endOfDay(sRange?.to),
        dateField: sDateField,
        perPage: sPerPage,
        sort: sSort,
        order: sOrder,
        campus,
    });

    const sHasActiveFilters = useMemo(
        () =>
            !!(
                sSearch ||
                sType ||
                sCollege ||
                sProgram ||
                sMajor ||
                sYear ||
                sIsPrinted !== null ||
                sRange ||
                sPerPage !== 10 ||
                sSort !== 'created_at' ||
                sOrder !== 'desc'
            ),
        [
            sSearch,
            sType,
            sCollege,
            sProgram,
            sMajor,
            sYear,
            sIsPrinted,
            sRange,
            sPerPage,
            sSort,
            sOrder,
        ],
    );

    const fetchStudents = async (page?: string) => {
        setStudentsLoading(true);
        try {
            const { data } = await apiService.get(route('filter.paginate'), {
                params: { ...sFilterParams(), ...(page ? { page } : {}) },
            });
            (data?.data ?? []).forEach((s: StudentProps) => {
                studentCache.current[s.id_number] = s;
            });
            setStudents(data);

            if (onFilterChange) onFilterChange({ params: sFilterParams() });
        } catch (e) {
            console.error('Error fetching students:', e);
        } finally {
            setStudentsLoading(false);
        }
    };

    const resetStudentFilters = () => {
        setSSearch(null);
        setSType(null);
        setSCollege(null);
        setSProgram(null);
        setSMajor(null);
        setSYear(null);
        setSIsPrinted(null);
        setSRange(undefined);
        setSDateField('created_at');
        setSSort('created_at');
        setSOrder('desc');
        setSPerPage(10);
    };

    useEffect(() => {
        const t = setTimeout(fetchStudents, 500);
        return () => clearTimeout(t);
    }, [
        sSearch,
        sType,
        sCollege,
        sProgram,
        sMajor,
        sYear,
        sIsPrinted,
        sRange,
        sDateField,
        sPerPage,
        sSort,
        sOrder,
    ]);

    const [openPreview, setOpenPreview] = useState(false);
    // The preview now receives the student object straight from the table
    // data (like StudentEditModal) instead of fetching it by id.
    const [selectedStudent, setSelectedStudent] = useState<StudentProps | null>(
        null,
    );
    // Whether the open preview is for a new student ID or a replacement.
    const [previewPrintType, setPreviewPrintType] =
        useState<PrintType>('new_student');
    const openStudentPreview = (
        student: StudentProps | undefined,
        type: PrintType,
    ) => {
        if (!student) {
            toast.error(
                'Could not find that student. Please refresh the list.',
            );
            return;
        }
        setSelectedStudent(student);
        setPreviewPrintType(type);
        setOpenPreview(true);
    };
    const printStudent = (id: number) =>
        openStudentPreview(
            students?.data?.find((s) => s.id === id),
            'new_student',
        );
    const printReplacement = (id: number) =>
        openStudentPreview(
            replacements?.data?.find((r) => r.id === id) as unknown as
                | StudentProps
                | undefined,
            'replacement_student',
        );
    const [selectedIdNumbers, setSelectedIdNumbers] = useState<string[]>([]);
    const [openBatchPreview, setOpenBatchPreview] = useState(false);

    // Selected students resolved from the cache, in selection order. `students`
    // is a dependency so entries refresh after a page is re-fetched.
    const selectedStudents = useMemo(
        () =>
            selectedIdNumbers
                .map((idNumber) => studentCache.current[idNumber])
                .filter((s): s is StudentProps => !!s),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [selectedIdNumbers, students],
    );

    const [replacements, setReplacements] =
        useState<PaginateStudentReplacement | null>(null);
    const [replacementsLoading, setReplacementsLoading] = useState(false);

    const [rSearch, setRSearch] = useState<string | null>(null);
    const [rCollege, setRCollege] = useState<string | null>(null);
    const [rProgram, setRProgram] = useState<string | null>(null);
    const [rMajor, setRMajor] = useState<string | null>(null);
    const [rYear, setRYear] = useState<string | null>(null);
    const [rIsPrinted, setRIsPrinted] = useState<boolean | null>(null);
    const [rRange, setRRange] = useState<DateRange | undefined>();
    const [rPerPage, setRPerPage] = useState(10);
    const [rSort, setRSort] = useState('created_at');
    const [rOrder, setROrder] = useState<'asc' | 'desc'>('desc');

    const rProgramsArr =
        collegeTalArr?.find((c) => c.value === rCollege)?.programs ?? [];
    const rMajorArr =
        rProgramsArr?.find((p) => p.name === rProgram)?.majors ?? [];

    const rFilterParams = () => ({
        search: rSearch || null,
        college: rCollege || null,
        program: rProgram || null,
        major: rMajor || null,
        year: rYear || null,
        is_printed: rIsPrinted,
        from: startOfDay(rRange?.from),
        to: endOfDay(rRange?.to),
        perPage: rPerPage,
        sort: rSort,
        order: rOrder,
        campus,
    });

    const rHasActiveFilters = useMemo(
        () =>
            !!(
                rSearch ||
                rCollege ||
                rProgram ||
                rMajor ||
                rYear ||
                rIsPrinted !== null ||
                rRange ||
                rPerPage !== 10 ||
                rSort !== 'created_at' ||
                rOrder !== 'desc'
            ),
        [
            rSearch,
            rCollege,
            rProgram,
            rMajor,
            rYear,
            rIsPrinted,
            rRange,
            rPerPage,
            rSort,
            rOrder,
        ],
    );

    const fetchReplacements = async (page?: string) => {
        setReplacementsLoading(true);
        try {
            const { data } = await apiService.get(
                route('filter.paginate.replacements'),
                { params: { ...rFilterParams(), ...(page ? { page } : {}) } },
            );
            setReplacements(data);
        } catch (e) {
            console.error('Error fetching replacements:', e);
        } finally {
            setReplacementsLoading(false);
        }
    };

    const resetReplacementFilters = () => {
        setRSearch(null);
        setRCollege(null);
        setRProgram(null);
        setRMajor(null);
        setRYear(null);
        setRIsPrinted(null);

        setRRange(undefined);
        setRSort('created_at');
        setROrder('desc');
        setRPerPage(10);
    };

    useEffect(() => {
        const t = setTimeout(fetchReplacements, 500);
        return () => clearTimeout(t);
    }, [
        rSearch,
        rCollege,
        rProgram,
        rMajor,
        rYear,
        rIsPrinted,

        rRange,
        rPerPage,
        rSort,
        rOrder,
    ]);

    const [openBatchReplacement, setOpenBatchReplacement] = useState(false);

    // Export status modal state.
    const [exportOpen, setExportOpen] = useState(false);
    const [exportPhase, setExportPhase] = useState<ExportPhase>('idle');
    const [exportBytes, setExportBytes] = useState(0);
    const [exportError, setExportError] = useState<string | null>(null);

    const extractErrorMessage = async (
        err: any,
        fallback: string,
    ): Promise<string> => {
        const data = err?.response?.data;

        if (data instanceof Blob) {
            try {
                const text = await data.text();
                const parsed = JSON.parse(text);
                if (typeof parsed?.message === 'string') return parsed.message;
            } catch {
                // Not JSON (or empty) — fall through to the generic message.
            }
        } else if (typeof data?.message === 'string') {
            return data.message;
        }

        return fallback;
    };

    const exportStatus = async (options: ExportStatusOptions) => {
        setExportError(null);
        setExportBytes(0);
        setExportPhase('fetching');
        setExportOpen(true);

        try {
            const response = await apiService.get(route('api.export.status'), {
                params: {
                    campus,
                    programs: options.programs,
                    columns: options.columns,
                    statuses: options.statuses,
                    year_level: options.yearLevels,
                },
                responseType: 'blob',
                onDownloadProgress: (e) => {
                    // First bytes arriving means the server finished building
                    // the file and the download has started.
                    setExportPhase((p) =>
                        p === 'fetching' ? 'downloading' : p,
                    );
                    setExportBytes(e.loaded);
                },
            });

            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const today = new Date().toISOString().slice(0, 10);
            a.href = url;
            a.download = `${campus.toUpperCase()}-STUDENT-STATUS-LIST-${today}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setExportPhase('done');
            setTimeout(() => setExportOpen(false), 1500);
        } catch (err) {
            const message = await extractErrorMessage(
                err,
                'Failed to export status. Please try again.',
            );
            console.error('Error exporting status:', err);
            setExportError(message);
            setExportPhase('error');
        }
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
            <IdPreviewDialog
                open={openPreview}
                setOpen={setOpenPreview}
                student={selectedStudent}
                printType={previewPrintType}
                onPrinted={() => {
                    fetchStudents();
                    fetchReplacements();
                }}
            />
            <BatchIdPreviewDialog
                open={openBatchPreview}
                setOpen={setOpenBatchPreview}
                printType="new_student"
                idNumbers={selectedIdNumbers}
                students={selectedStudents}
                onSelectionChange={setSelectedIdNumbers}
            />
            <ExportStatusDialog
                open={exportOpen}
                phase={exportPhase}
                receivedBytes={exportBytes}
                errorMessage={exportError}
                onClose={() => setExportOpen(false)}
            />

            <ResponsiveTabs
                defaultValue="new"
                items={[
                    {
                        value: 'new',
                        trigger: <>New Student</>,
                        content: (
                            <>
                                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                    <Widget
                                        count={counts.totalUpdates}
                                        title="Total"
                                        description="Number of student submissions."
                                        icon={Users}
                                        color="chart-1"
                                    />
                                    <Widget
                                        count={counts.totalNewPendings}
                                        title="Pendings"
                                        description="Students waiting for their first ID to be printed."
                                        icon={Clock}
                                        color="chart-2"
                                    />
                                    <Widget
                                        count={counts.totalNewPrinted}
                                        title="Printed"
                                        description="Students whose first ID has been printed."
                                        icon={Printer}
                                        color="chart-3"
                                    />
                                </div>
                                <div className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                                    <Heading
                                        title="New Student ID Requests"
                                        description="Students currently applying for a new student ID."
                                    />
                                    <FilterBar
                                        campus={campus}
                                        searchValue={sSearch}
                                        onSearchChange={setSSearch}
                                        perPage={sPerPage}
                                        onPerPageChange={setSPerPage}
                                        sort={sSort}
                                        onSortChange={setSSort}
                                        order={sOrder}
                                        onOrderChange={setSOrder}
                                        selectedType={sType}
                                        onTypeChange={setSType}
                                        collegeOptions={collegeTalArr}
                                        selectedCollege={sCollege}
                                        onCollegeChange={(v) => {
                                            setSCollege(v);
                                            setSProgram(null);
                                            setSMajor(null);
                                        }}
                                        programOptions={sProgramsArr!}
                                        selectedProgram={sProgram}
                                        onProgramChange={(v) => {
                                            setSProgram(v);
                                            setSMajor(null);
                                        }}
                                        majorOptions={sMajorArr!}
                                        selectedMajor={sMajor}
                                        onMajorChange={setSMajor}
                                        selectedYear={sYear}
                                        onYearChange={setSYear}
                                        isPrinted={sIsPrinted}
                                        onPrintedChange={setSIsPrinted}
                                        range={sRange}
                                        onRangeChange={setSRange}
                                        dateField={sDateField}
                                        onDateFieldChange={setSDateField}
                                        hasActiveFilters={sHasActiveFilters}
                                        onReset={resetStudentFilters}
                                        totalEntries={students?.total ?? 0}
                                        onBatchPrint={() =>
                                            setOpenBatchPreview(true)
                                        }
                                        onExportStatus={exportStatus}
                                        selectedIdNumbers={selectedIdNumbers}
                                    />
                                    <StudentTable
                                        selectedIdNumbers={selectedIdNumbers}
                                        onSelectionChange={setSelectedIdNumbers}
                                        students={students?.data ?? []}
                                        total={students?.total}
                                        from={students?.from}
                                        to={students?.to}
                                        links={students?.links}
                                        onPageChange={(page) =>
                                            fetchStudents(page)
                                        }
                                        isLoading={studentsLoading}
                                        onPrint={printStudent}
                                        onChangeStatus={fetchStudents}
                                    />
                                </div>
                            </>
                        ),
                    },
                    {
                        value: 'replacement',
                        trigger: <>Replacement Student</>,
                        content: (
                            <div className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 p-4 px-5 dark:border-sidebar-border">
                                <Heading
                                    title="Replacement ID Requests"
                                    description="Students requesting a replacement for their student ID."
                                />
                                <ReplacementFilterBar
                                    searchValue={rSearch}
                                    onSearchChange={setRSearch}
                                    perPage={rPerPage}
                                    onPerPageChange={setRPerPage}
                                    sort={rSort}
                                    onSortChange={setRSort}
                                    order={rOrder}
                                    onOrderChange={setROrder}
                                    collegeOptions={collegeTalArr}
                                    selectedCollege={rCollege}
                                    onCollegeChange={(v) => {
                                        setRCollege(v);
                                        setRProgram(null);
                                        setRMajor(null);
                                    }}
                                    programOptions={rProgramsArr!}
                                    selectedProgram={rProgram}
                                    onProgramChange={(v: any) => {
                                        setRProgram(v);
                                        setRMajor(null);
                                    }}
                                    majorOptions={rMajorArr!}
                                    selectedMajor={rMajor}
                                    onMajorChange={setRMajor}
                                    selectedYear={rYear}
                                    onYearChange={setRYear}
                                    isPrinted={rIsPrinted}
                                    onPrintedChange={setRIsPrinted}
                                    range={rRange}
                                    onRangeChange={setRRange}
                                    hasActiveFilters={rHasActiveFilters}
                                    onReset={resetReplacementFilters}
                                    totalEntries={replacements?.total ?? 0}
                                    onBatchPrint={() =>
                                        setOpenBatchReplacement(true)
                                    }
                                />
                                <ReplacementTable
                                    replacements={replacements?.data ?? []}
                                    total={replacements?.total}
                                    from={replacements?.from}
                                    to={replacements?.to}
                                    links={replacements?.links}
                                    onPageChange={(page) =>
                                        fetchReplacements(page)
                                    }
                                    isLoading={replacementsLoading}
                                    onPrint={printReplacement}
                                    onChangeStatus={fetchReplacements}
                                />
                            </div>
                        ),
                    },
                    {
                        value: 'cards',
                        trigger: <>Manage ID Cards</>,
                        content: '',
                    },
                    {
                        value: 'employee',
                        trigger: (
                            <>
                                Employee
                                <Badge
                                    variant="outline"
                                    className="border-amber-500 text-amber-500 tabular-nums"
                                >
                                    <WrenchIcon />
                                </Badge>
                            </>
                        ),
                        content: '',
                        disabled: true,
                    },
                ]}
            />
        </div>
    );
}
