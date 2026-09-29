import { User } from '@/types';

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

    printed?: {
        id: number;
        created_at: string;
    };
    change_logs?: StudentChangeLog[];
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
    printed_at?: string;
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
export interface StudentChangeLog {
    id: number;
    student_id: number;
    changed_fields: string[];
    previous_values: Record<string, unknown>;
    new_values: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}
export interface InventoryReceiptProps {
    id: number;
    inventory_stock_id: number;
    quantity: number;
    ref_no: string;
    delivered_by: string | null;
    remarks: string | null;
    received_at: string | null;
    received_by: number | null;
    created_at: string | null;
    updated_at: string | null;
    stock?: { id: number; campus: string };
    receiver?: User | null;
}

export interface PaginateInventoryReceipts {
    data: InventoryReceiptProps[];
    total: number;
    from: number | null;
    to: number | null;
    current_page: number;
    last_page: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}
export interface InventoryStockProps {
    id: number;
    campus: string;
    quantity: number;
}

export interface ActivityLogProps {
    id: number;
    action: string;
    ip_address: string | null;
    user_agent: string | null;
    browser: string | null;
    print_type: string | null;
    created_at: string;
    user: { id: number; name: string; email: string; campus: string } | null;
    student: {
        id: number;
        id_number: string;
        first_name: string;
        last_name: string;
    } | null;
}

export interface PaginateActivityLogs {
    data: ActivityLogProps[];
    total: number;
    from: number | null;
    to: number | null;
    current_page: number;
    last_page: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

export interface ActivityLogSummary {
    total: number;
    logins: number;
    prints: number;
    exports: number;
    syncs: number;
    recent: number;
    monthly: {
        label: string;
        month: string;
        total: number;
        logins: number;
        prints: number;
        exports: number;
    }[];
}
export type PrintType = 'new_student' | 'replacement_student';

export const PRINT_TYPE_LABEL: Record<PrintType, string> = {
    new_student: 'New',
    replacement_student: 'Replacement',
};
