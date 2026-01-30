export type StudentProps = {
    id: number;
    id_number: string;
    first_name: string;
    middle_init: string | null;
    last_name: string;
    suffix: string | null;
    picture: File;
    e_signature: File;

    campus: string;
    college: string;
    college_name: string;
    program: string;
    major: string;
    year: string;
    section: string;

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

    is_exported: boolean;
    is_completed: boolean;

    created_at: string;
    updated_at: string;
};

export type PaginateStudents = {
    data: StudentProps[];
    links: { url: string | null; label: string; active: boolean }[];
    from: number;
    to: number;
    total: number;
};
export type DateRange = {
    from: Date;
    to?: Date;
};
