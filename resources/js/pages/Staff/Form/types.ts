export type StaffProp = {
    picture: File | string;
    e_signature: File | string;
    digital_id: string;
    name: string;
    campus: string;
    designation: string | null;
    department: string | null;
    emergency_fname: string;
    emergency_mname: string | null;
    emergency_lname: string;
    emergency_suffix: string | null;
    emergency_phone: string;
    emergency_address: string;
    blood_type: string | null;
    printed_at?: string | null;
    created_at?: string;
    updated_at?: string;
};

export type StaffFormData = Omit<
    StaffProp,
    'printed_at' | 'created_at' | 'updated_at'
> & {
    confirm_info: boolean;
    data_privacy: boolean;
};

export type PageProps = {
    staff: {
        digital_id: string;
        name: string;
        campus: string;
        designation: string | null;
        department: string | null;
    };
    success?: boolean;
    departments: string[];
};
