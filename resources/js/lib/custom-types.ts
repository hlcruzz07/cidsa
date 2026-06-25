export type StudentProps = {
    id: number;
    id_number: string;
    first_name: string;
    middle_init: string | null;
    last_name: string;
    suffix: string | null;
    picture: string;
    e_signature: string;

    campus: string;
    college: string;
    college_name: string;
    program: string;
    major: string;
    year: string;

    emergency_first_name: string;
    emergency_middle_init: string | null;
    emergency_last_name: string;
    emergency_suffix: string | null;
    relationship: string;
    contact_number: number;
    province: string;
    city: string;
    barangay: string;
    zip_code: string;

    printed_exists: boolean;
    is_completed: boolean;

    created_at: string;
    updated_at: string;
};

export type UserProps = {
    id: number;
    name: string;
    email: string;
    role: string;
    campus: string;
};

export type ExportedStudent = {
    id: number;
    export_id: number;
    student_id: number;
    created_at: string;
    student: StudentProps;
};

export type StudentReplacement = {
    id: number;
    student_id: number;

    receipt: string;
    reason?: string;
    is_printed: boolean;
    created_at: string;
    updated_at: string;
    student?: StudentProps;
};

export type PaginateStudents = {
    data: StudentProps[];
    links: { url: string | null; label: string; active: boolean }[];
    from: number;
    to: number;
    total: number;
};

export type PaginateStudentReplacement = {
    data: StudentReplacement[];
    links: { url: string | null; label: string; active: boolean }[];
    from: number;
    to: number;
    total: number;
};

export type DateRange = {
    from: Date;
    to?: Date;
};
