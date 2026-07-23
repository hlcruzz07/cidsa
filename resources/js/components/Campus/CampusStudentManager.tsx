import {
    PaginateStudentReplacement,
    PaginateStudents,
} from '@/lib/custom-types';
import { campusDirectoryArr } from '@/lib/utils';
import apiService from '@/services/apiService';
import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';
import Heading from '../heading';
import { BatchIdPrintDialog } from './BatchIdPrintDialog';
import { FilterBar } from './FilterBar';
import { IdPreviewDialog } from './Preview';
import { ReplacementFilterBar } from './ReplacementFilterBar';
import { ReplacementTable } from './ReplacementTable';
import { StudentsUpdateChart } from './StudentChart';
import { StudentTable } from './StudentTable';
import Widget from './Widget';

type DateRange = { from: Date; to?: Date };

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

    const [sSearch, setSSearch] = useState<string | null>(null);
    const [sType, setSType] = useState<string | null>(null);
    const [sCollege, setSCollege] = useState<string | null>(null);
    const [sProgram, setSProgram] = useState<string | null>(null);
    const [sMajor, setSMajor] = useState<string | null>(null);
    const [sYear, setSYear] = useState<string | null>(null);
    const [sRange, setSRange] = useState<DateRange | undefined>();
    const [sPerPage, setSPerPage] = useState(10);
    const [sSort, setSSort] = useState('updated_at');
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
        from: startOfDay(sRange?.from),
        to: endOfDay(sRange?.to),
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
                sRange ||
                sPerPage !== 10 ||
                sSort !== 'updated_at' ||
                sOrder !== 'desc'
            ),
        [
            sSearch,
            sType,
            sCollege,
            sProgram,
            sMajor,
            sYear,
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
        setSRange(undefined);
        setSSort('updated_at');
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
        sRange,
        sPerPage,
        sSort,
        sOrder,
    ]);

    // ─── Single ID preview ────────────────────────────────────────────────────
    const [openPreview, setOpenPreview] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const printStudent = (id: number) => {
        setOpenPreview(true);
        setSelectedId(id);
    };

    // ─── Batch print ──────────────────────────────────────────────────────────
    const [openBatch, setOpenBatch] = useState(false);

    // =========================================================================
    // REPLACEMENT STUDENTS
    // =========================================================================
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
    const [rSort, setRSort] = useState('updated_at');
    const [rOrder, setROrder] = useState<'asc' | 'desc'>('desc');

    const rProgramsArr =
        collegeTalArr?.find((c) => c.value === rCollege)?.programs ?? null;
    const rMajorArr =
        rProgramsArr?.find((p) => p.name === rProgram)?.majors ?? null;

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
                rSort !== 'updated_at' ||
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

            console.log(data);
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
        setRSort('updated_at');
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

    return (
        <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                <Widget type="totalUpdates" count={counts.totalUpdates} />

                <Widget
                    type="totalNewPendings"
                    count={counts.totalNewPendings}
                />

                <Widget type="totalNewPrinted" count={counts.totalNewPrinted} />

                <Widget
                    type="totalPendingReplacement"
                    count={counts.totalPendingReplacement}
                />
            </div>

            <StudentsUpdateChart campus={campus} />

            {/* Shared dialogs */}
            <IdPreviewDialog
                open={openPreview}
                setOpen={setOpenPreview}
                id={selectedId}
            />
            <BatchIdPrintDialog
                open={openBatch}
                setOpen={setOpenBatch}
                campus={campus}
                mode="new"
                onClose={fetchStudents}
            />
            <BatchIdPrintDialog
                open={openBatchReplacement}
                setOpen={setOpenBatchReplacement}
                campus={campus}
                mode="replacement"
                onClose={fetchReplacements}
            />

            {/* ── New Student ID Requests ── */}
            <div className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                <Heading
                    title="New Student ID Requests"
                    description="Students currently applying for a new student ID."
                />
                <FilterBar
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
                    range={sRange}
                    onRangeChange={setSRange}
                    hasActiveFilters={sHasActiveFilters}
                    onReset={resetStudentFilters}
                    totalEntries={students?.total ?? 0}
                    onBatchPrint={() => setOpenBatch(true)}
                />
                <StudentTable
                    students={students?.data ?? []}
                    total={students?.total}
                    from={students?.from}
                    to={students?.to}
                    links={students?.links}
                    onPageChange={(page) => fetchStudents(page)}
                    isLoading={studentsLoading}
                    onPrint={printStudent}
                    onChangeStatus={fetchStudents}
                />
            </div>

            {/* ── Replacement ID Requests ── */}
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
                    onBatchPrint={() => setOpenBatchReplacement(true)}
                />
                <ReplacementTable
                    replacements={replacements?.data ?? []}
                    total={replacements?.total}
                    from={replacements?.from}
                    to={replacements?.to}
                    links={replacements?.links}
                    onPageChange={(page) => fetchReplacements(page)}
                    isLoading={replacementsLoading}
                    onPrint={printStudent}
                    onChangeStatus={fetchReplacements}
                />
            </div>
        </div>
    );
}
