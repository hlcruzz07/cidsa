import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    ArrowUpDownIcon,
    DownloadIcon,
    EyeIcon,
    Trash2Icon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

import { Calendar } from '@/components/ui/calendar';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { StudentProps } from '@/lib/student-types';
import { campusDirectoryArr } from '@/lib/utils';
import apiService from '@/services/apiService';
import {
    BookMarkedIcon,
    BookOpenCheck,
    CalendarIcon,
    ChevronDownIcon,
    FilterXIcon,
    XIcon,
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

type ExportModalProps = {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onPreview: (student: StudentProps[]) => void;
    campus: string;
    onImport: () => void;
};

export default function ExportModal({
    isOpen,
    setIsOpen,
    onPreview,
    campus,
    onImport,
}: ExportModalProps) {
    const [students, setStudents] = useState<StudentProps[] | null>(null);

    // Filters
    const [searchValue, setSearchValue] = useState<string | null>(null);
    const [selectedCollege, setSelectedCollege] = useState<string | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
    const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [selectedLimit, setSelectedLimit] = useState<number | null>(null);
    const [range, setRange] = useState<DateRange | undefined>(undefined);
    const [perPage, setPerPage] = useState<number>(10);
    const [sort, setSort] = useState('updated_at');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');

    const startOfDay = (d?: Date) =>
        d ? new Date(d.setHours(0, 0, 0, 0)).toISOString() : null;

    const endOfDay = (d?: Date) =>
        d ? new Date(d.setHours(23, 59, 59, 999)).toISOString() : null;

    const collegeTalArr = campusDirectoryArr.find((collegeItem) =>
        collegeItem.campus.includes(campus),
    )?.colleges;

    const programsArr =
        collegeTalArr?.filter((item) => item.value === selectedCollege)[0]
            ?.programs || null;

    const majorArr =
        programsArr?.filter((item) => item.name === selectedProgram)[0]
            ?.majors || null;

    const [sectionsArr, setSectionsArr] = useState([]);

    const handleFilter = async () => {
        const params = {
            params: {
                search: searchValue || null,
                college: selectedCollege || null,
                program: selectedProgram || null,
                major: selectedMajor || null,
                section: selectedSection || null,
                year: selectedYear || null,
                limit: selectedLimit || 10,
                from: startOfDay(range?.from),
                to: endOfDay(range?.to),
                perPage: perPage,
                sort: sort,
                order: order,
                campus: campus,
            },
        };

        try {
            const { data } = await apiService.get(
                '/api/student/filterExport',
                params,
            );

            setStudents(data);
            const cleanedSections = data.data
                .map((item: any) => item.section)
                .filter((section: any): section is string => Boolean(section))
                .sort((a: any, b: any) => a.localeCompare(b));

            setSectionsArr(cleanedSections);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const resetFilters = () => {
        setSearchValue(null);
        setSelectedCollege(null);
        setSelectedProgram(null);
        setSelectedMajor(null);
        setSelectedSection(null);
        setSelectedYear(null);
        setSelectedLimit(null);
        setRange(undefined);
        setSort('updated_at');
        setOrder('desc');
        setPerPage(10);
    };

    const DEFAULTS = {
        searchValue: null,
        selectedCollege: null,
        selectedProgram: null,
        selectedMajor: null,
        selectedSection: null,
        selectedYear: null,
        selectedLimit: null,
        range: undefined as DateRange | undefined,
        perPage: 10,
        sort: 'updated_at',
        order: 'desc' as 'asc' | 'desc',
    };

    const hasActiveFilters = useMemo(() => {
        return (
            searchValue !== DEFAULTS.searchValue ||
            selectedCollege !== DEFAULTS.selectedCollege ||
            selectedProgram !== DEFAULTS.selectedProgram ||
            selectedMajor !== DEFAULTS.selectedMajor ||
            selectedSection !== DEFAULTS.selectedSection ||
            selectedYear !== DEFAULTS.selectedYear ||
            selectedLimit !== DEFAULTS.selectedLimit ||
            range !== DEFAULTS.range ||
            perPage !== DEFAULTS.perPage ||
            sort !== DEFAULTS.sort ||
            order !== DEFAULTS.order
        );
    }, [
        searchValue,
        selectedCollege,
        selectedProgram,
        selectedMajor,
        selectedSection,
        selectedYear,
        selectedLimit,
        range,
        perPage,
        sort,
        order,
    ]);

    useEffect(() => {
        if (isOpen) {
            handleFilter();
        }
    }, [
        searchValue,
        selectedCollege,
        selectedProgram,
        selectedMajor,
        selectedSection,
        selectedYear,
        selectedLimit,
        range,
        perPage,
        sort,
        order,
        isOpen,
    ]);

    const exportStudents = () => {
        if (!students || students.length === 0) return;

        window.location.href = route('export.students', {
            students,
        });

        setIsOpen(false);
        onImport();
    };

    const [isPreviewing, setIsPreviewing] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Export Students Modal</DialogTitle>
                </DialogHeader>

                <div>
                    <div className="">
                        <div className="grid grid-cols-1 gap-3">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <BookMarkedIcon />
                                        College
                                        <ChevronDownIcon />
                                        {selectedCollege && (
                                            <Badge className="ml-2">
                                                {selectedCollege}
                                            </Badge>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-max"
                                    align="start"
                                >
                                    {collegeTalArr?.map((item, index) => (
                                        <DropdownMenuCheckboxItem
                                            key={index}
                                            checked={
                                                selectedCollege === item.value
                                            }
                                            onSelect={() => {
                                                setSelectedProgram(null);
                                                setSelectedMajor(null);

                                                setSelectedCollege((prev) =>
                                                    prev === item.value
                                                        ? null
                                                        : item.value,
                                                );
                                            }}
                                        >
                                            {item.name}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {programsArr && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="flex h-auto flex-col"
                                        >
                                            <div className="flex items-center gap-2">
                                                <BookOpenCheck />
                                                Programs
                                                <ChevronDownIcon />
                                            </div>
                                            {selectedProgram && (
                                                <Badge className="ml-2">
                                                    {selectedProgram}
                                                </Badge>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        className="w-max"
                                        align="start"
                                    >
                                        {programsArr?.map((item, index) => (
                                            <DropdownMenuCheckboxItem
                                                key={index}
                                                checked={
                                                    selectedProgram ===
                                                    item.name
                                                }
                                                onSelect={() => {
                                                    setSelectedMajor(null);
                                                    setSelectedSection(null);
                                                    setSelectedProgram(
                                                        (prev) =>
                                                            prev === item.name
                                                                ? null
                                                                : item.name,
                                                    );
                                                }}
                                            >
                                                {item.name}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                            {majorArr && majorArr.length > 0 && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline">
                                            <BookOpenCheck />
                                            Majors
                                            <ChevronDownIcon />
                                            {selectedMajor && (
                                                <Badge className="ml-2">
                                                    {selectedMajor}
                                                </Badge>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        className="w-max"
                                        align="start"
                                    >
                                        {majorArr?.map((item, index) => (
                                            <DropdownMenuCheckboxItem
                                                key={index}
                                                checked={selectedMajor === item}
                                                onSelect={() => {
                                                    setSelectedSection(null);
                                                    setSelectedMajor((prev) =>
                                                        prev === item
                                                            ? null
                                                            : item,
                                                    );
                                                }}
                                            >
                                                {item}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            {sectionsArr &&
                                sectionsArr.length > 0 &&
                                selectedProgram && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline">
                                                <BookOpenCheck />
                                                Sections
                                                <ChevronDownIcon />
                                                {selectedSection && (
                                                    <Badge className="ml-2">
                                                        {selectedSection}
                                                    </Badge>
                                                )}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            className="w-max"
                                            align="start"
                                        >
                                            {sectionsArr?.map((item, index) => (
                                                <DropdownMenuCheckboxItem
                                                    key={index}
                                                    checked={
                                                        selectedSection === item
                                                    }
                                                    onSelect={() => {
                                                        setSelectedSection(
                                                            (prev) =>
                                                                prev === item
                                                                    ? null
                                                                    : item,
                                                        );
                                                    }}
                                                >
                                                    {item}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <BookOpenCheck />
                                        Year Level
                                        <ChevronDownIcon />
                                        {selectedYear && (
                                            <Badge className="ml-2">
                                                {selectedYear}
                                            </Badge>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-max"
                                    align="start"
                                >
                                    {[
                                        '1st Year',
                                        '2nd Year',
                                        '3rd Year',
                                        '4th Year',
                                        '5th Year',
                                    ].map((item, index) => (
                                        <DropdownMenuCheckboxItem
                                            key={index}
                                            checked={selectedYear === item}
                                            onSelect={() => {
                                                setSelectedYear((prev) =>
                                                    prev === item ? null : item,
                                                );
                                            }}
                                        >
                                            {item}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="flex w-full items-center">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={`grow justify-between ${range && 'rounded-e-none border-e-0'}`}
                                        >
                                            <CalendarIcon />
                                            {range?.from && range?.to
                                                ? `${range.from.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} – ${range.to.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
                                                : 'Date Updated'}

                                            <ChevronDownIcon />
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent className="w-auto p-0">
                                        <Calendar
                                            mode="range"
                                            selected={range}
                                            captionLayout="dropdown"
                                            onSelect={(newRange) => {
                                                if (!newRange) return;

                                                setRange(newRange as DateRange);
                                            }}
                                        />
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                {range && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={() => setRange(undefined)}
                                        className="w-max rounded-s-none"
                                    >
                                        {' '}
                                        <XIcon />
                                    </Button>
                                )}
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <ArrowUpDownIcon /> Sort
                                        <ChevronDownIcon />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-auto"
                                    align="end"
                                >
                                    <DropdownMenuLabel>
                                        Sort By
                                    </DropdownMenuLabel>
                                    <DropdownMenuRadioGroup>
                                        <div className="flex items-center gap-3">
                                            <Select
                                                value={sort}
                                                onValueChange={(value) =>
                                                    setSort(value)
                                                }
                                            >
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="Select a fruit" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectItem value="id">
                                                            #
                                                        </SelectItem>
                                                        <SelectItem value="college">
                                                            College
                                                        </SelectItem>

                                                        <SelectItem value="updated_at">
                                                            Date Updated
                                                        </SelectItem>
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            <Select
                                                value={order}
                                                onValueChange={(value) =>
                                                    setOrder(
                                                        value as 'asc' | 'desc',
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="Select a fruit" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectItem value="asc">
                                                            Asc
                                                        </SelectItem>
                                                        <SelectItem value="desc">
                                                            Desc
                                                        </SelectItem>
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            className="mt-3 w-full"
                                            type="button"
                                            onClick={() => {
                                                setSort('update_at');
                                                setOrder('desc');
                                            }}
                                        >
                                            Reset <Trash2Icon />
                                        </Button>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Input
                                type="number"
                                value={selectedLimit ?? ''}
                                placeholder="Enter Student Limit"
                                min={1}
                                max={150}
                                onChange={(e) => {
                                    let value = e.target.value;

                                    // limit to 3 digits
                                    if (value.length > 3) return;

                                    let num = Number(value);

                                    // enforce max 150
                                    if (num > 150) num = 150;

                                    setSelectedLimit(value ? num : null);
                                }}
                            />
                            {hasActiveFilters && (
                                <Button
                                    type="button"
                                    onClick={resetFilters}
                                    variant="destructive"
                                >
                                    <FilterXIcon /> Reset Filter
                                </Button>
                            )}
                        </div>
                        <p className="mt-5 text-center text-sm whitespace-nowrap">
                            Ready for exporting:
                            <Badge>
                                {Number(students?.length || 0).toLocaleString()}
                            </Badge>
                        </p>
                    </div>
                </div>

                <DialogFooter className="pt-4">
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                    <Button
                        onClick={() => {
                            if (!students || students.length === 0) return;
                            setIsPreviewing(true);
                            setTimeout(() => {
                                onPreview(students);

                                setIsPreviewing(false);
                            }, 2000);
                        }}
                        disabled={isPreviewing || students?.length === 0}
                        variant="secondary"
                    >
                        {isPreviewing ? (
                            <>
                                Loading... <Spinner />
                            </>
                        ) : (
                            <>
                                Preview <EyeIcon />
                            </>
                        )}
                    </Button>
                    <Button
                        disabled={students?.length === 0}
                        onClick={exportStudents}
                    >
                        Download <DownloadIcon />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
