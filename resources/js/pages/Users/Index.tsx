// resources/js/pages/Campus/Index.tsx

import Heading from '@/components/heading';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useInitials } from '@/hooks/use-initials';
import AppLayout from '@/layouts/app-layout';
import { User, type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import dayjs from 'dayjs';
import { LoaderCircleIcon, PencilIcon, PlusIcon } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import { route } from 'ziggy-js';

type PageProps = {
    users: User[];
    campuses: string[];
    roles: string[];
};

const headers = ['Name', 'Email', 'Role', 'Campus', 'Created', 'Action'];

const SUPER_ADMIN_ROLE = 'super admin';
const ALL_CAMPUS_VALUE = 'all';

// Fallback: turns "super admin" -> "Super Admin", "ft" -> "Ft"
const titleCase = (value: string) =>
    value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Codes returned by the backend are abbreviations, not full names —
// fill in the real campus names here as you confirm them.
const CAMPUS_LABELS: Record<string, string> = {
    all: 'All Campuses',
    tal: 'Talisay',
    ali: 'Alijis',
    ft: 'Fortune Towne',
    bin: 'Binalbagan',
};

const ROLE_LABELS: Record<string, string> = {
    'super admin': 'Super Admin',
    admin: 'Admin',
};

const campusLabel = (value: string) => CAMPUS_LABELS[value] ?? titleCase(value);

const roleLabel = (value: string) => ROLE_LABELS[value] ?? titleCase(value);

// Only trims/lowercases stray whitespace or casing — does NOT touch the
// space in "super admin", since that's the real enum value now.
const normalizeRole = (value: string) =>
    value.trim().toLowerCase().replace(/\s+/g, ' ');

const emptyCreateForm = {
    name: '',
    email: '',
    campus: '',
    role: '',
};

export default function Index() {
    const { users, roles, campuses } = usePage<PageProps>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: `Accounts`,
            href: `/accounts`,
        },
    ];

    const getInitials = useInitials();

    // ---------- Edit ----------
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editOpen, setEditOpen] = useState(false);

    const {
        data: editData,
        setData: setEditData,
        put,
        processing: editProcessing,
        errors: editErrors,
        reset: resetEdit,
        clearErrors: clearEditErrors,
    } = useForm({
        name: '',
        email: '',
        campus: '',
        role: '',
    });

    const isEditSuperAdmin = editData.role === SUPER_ADMIN_ROLE;
    const editCampusOptions = isEditSuperAdmin
        ? campuses
        : campuses.filter((campus) => campus !== ALL_CAMPUS_VALUE);

    const openEdit = (row: User) => {
        const normalizedRole = normalizeRole(row.role);
        setEditingUser(row);
        setEditData({
            name: row.name,
            email: row.email,
            role: normalizedRole,
            campus:
                normalizedRole === SUPER_ADMIN_ROLE
                    ? ALL_CAMPUS_VALUE
                    : row.campus,
        });
        clearEditErrors();
        setEditOpen(true);
    };

    const closeEdit = (open: boolean) => {
        setEditOpen(open);
        if (!open) {
            setEditingUser(null);
            resetEdit();
            clearEditErrors();
        }
    };

    const handleEditRoleChange = (value: string) => {
        setEditData((prevData) => ({
            ...prevData,
            role: value,
            // Super admins always cover every campus
            campus:
                value === SUPER_ADMIN_ROLE
                    ? ALL_CAMPUS_VALUE
                    : prevData.campus === ALL_CAMPUS_VALUE
                      ? ''
                      : prevData.campus,
        }));
    };

    const submitEdit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editingUser) return;

        put(route('user.update', editingUser.id), {
            preserveScroll: true,
            onSuccess: () => closeEdit(false),
        });
    };

    // ---------- Create ----------
    const [createOpen, setCreateOpen] = useState(false);

    const {
        data: createData,
        setData: setCreateData,
        post,
        processing: createProcessing,
        errors: createErrors,
        reset: resetCreate,
        clearErrors: clearCreateErrors,
    } = useForm(emptyCreateForm);

    const isCreateSuperAdmin = createData.role === SUPER_ADMIN_ROLE;
    const createCampusOptions = isCreateSuperAdmin
        ? campuses
        : campuses.filter((campus) => campus !== ALL_CAMPUS_VALUE);
    const openCreate = () => {
        setCreateData(emptyCreateForm);
        clearCreateErrors();
        setCreateOpen(true);
    };

    const closeCreate = (open: boolean) => {
        setCreateOpen(open);
        if (!open) {
            resetCreate();
            clearCreateErrors();
        }
    };

    const handleCreateRoleChange = (value: string) => {
        setCreateData((prevData) => ({
            ...prevData,
            role: value,
            campus:
                value === SUPER_ADMIN_ROLE
                    ? ALL_CAMPUS_VALUE
                    : prevData.campus === ALL_CAMPUS_VALUE
                      ? ''
                      : prevData.campus,
        }));
    };

    const submitCreate: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('user.store'), {
            preserveScroll: true,
            onSuccess: () => closeCreate(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Accounts`} />

            <div className="space-y-5 p-4">
                <div className="space-y-5">
                    <div className="flex items-start justify-between">
                        <Heading
                            title="User Accounts"
                            description="List of all accounts used in the system."
                        />

                        <Button type="button" onClick={openCreate}>
                            <PlusIcon /> Add User
                        </Button>
                    </div>
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
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={headers.length}
                                            className="border p-3 text-center"
                                        >
                                            No records found.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="hover:bg-muted/50"
                                        >
                                            <td
                                                className="p-2 whitespace-nowrap"
                                                data-label="Name"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="size-8 rounded-full">
                                                        <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                                            {getInitials(
                                                                row.name,
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">
                                                        {row.name}
                                                    </span>
                                                </div>
                                            </td>

                                            <td
                                                className="p-2 whitespace-nowrap"
                                                data-label="Email"
                                            >
                                                {row.email}
                                            </td>

                                            <td
                                                className="p-2 whitespace-nowrap"
                                                data-label="Role"
                                            >
                                                <Badge variant="outline">
                                                    {roleLabel(
                                                        normalizeRole(row.role),
                                                    )}
                                                </Badge>
                                            </td>

                                            <td
                                                className="p-2 whitespace-nowrap"
                                                data-label="Campus"
                                            >
                                                {normalizeRole(row.role) ===
                                                SUPER_ADMIN_ROLE
                                                    ? campusLabel(
                                                          ALL_CAMPUS_VALUE,
                                                      )
                                                    : campusLabel(row.campus)}
                                            </td>

                                            <td
                                                className="p-2 text-[10px]! whitespace-nowrap"
                                                data-label="Created"
                                            >
                                                {row.created_at
                                                    ? dayjs(
                                                          row.created_at,
                                                      ).format(
                                                          'MMM D, YYYY · h:mm A',
                                                      )
                                                    : '—'}
                                            </td>

                                            <td>
                                                <Button
                                                    size="icon-sm"
                                                    aria-label="Edit"
                                                    variant={'outline'}
                                                    onClick={() =>
                                                        openEdit(row)
                                                    }
                                                >
                                                    <PencilIcon />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ---------- Edit Dialog ---------- */}
            <Dialog open={editOpen} onOpenChange={closeEdit}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            {editingUser?.name} — update name, email, campus,
                            and role.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                type="text"
                                value={editData.name}
                                onChange={(e) =>
                                    setEditData('name', e.target.value)
                                }
                                autoComplete="off"
                            />
                            {editErrors.name && (
                                <p className="text-xs text-destructive">
                                    {editErrors.name}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={editData.email}
                                onChange={(e) =>
                                    setEditData('email', e.target.value)
                                }
                                autoComplete="off"
                            />
                            {editErrors.email && (
                                <p className="text-xs text-destructive">
                                    {editErrors.email}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit-role">Role</Label>
                            <Select
                                value={editData.role}
                                onValueChange={handleEditRoleChange}
                            >
                                <SelectTrigger
                                    id="edit-role"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {roleLabel(role)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {editErrors.role && (
                                <p className="text-xs text-destructive">
                                    {editErrors.role}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit-campus">Campus</Label>
                            <Select
                                value={editData.campus}
                                onValueChange={(value) =>
                                    setEditData('campus', value)
                                }
                                disabled={isEditSuperAdmin}
                            >
                                <SelectTrigger
                                    id="edit-campus"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Select campus" />
                                </SelectTrigger>
                                <SelectContent>
                                    {editCampusOptions.map((campus) => (
                                        <SelectItem key={campus} value={campus}>
                                            {campusLabel(campus)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {isEditSuperAdmin ? (
                                <p className="text-xs text-muted-foreground">
                                    Super Admins have access to all campuses.
                                </p>
                            ) : (
                                editErrors.campus && (
                                    <p className="text-xs text-destructive">
                                        {editErrors.campus}
                                    </p>
                                )
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => closeEdit(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editProcessing}>
                                {editProcessing && (
                                    <LoaderCircleIcon className="animate-spin" />
                                )}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ---------- Create Dialog ---------- */}
            <Dialog open={createOpen} onOpenChange={closeCreate}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add User</DialogTitle>
                        <DialogDescription>
                            Create a new account and assign its role and campus.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitCreate} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="create-name">Name</Label>
                            <Input
                                id="create-name"
                                type="text"
                                value={createData.name}
                                placeholder="Enter Name"
                                onChange={(e) =>
                                    setCreateData('name', e.target.value)
                                }
                                autoComplete="off"
                            />
                            {createErrors.name && (
                                <p className="text-xs text-destructive">
                                    {createErrors.name}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="create-email">Email</Label>
                            <Input
                                id="create-email"
                                type="email"
                                placeholder="Enter Email"
                                value={createData.email}
                                onChange={(e) =>
                                    setCreateData('email', e.target.value)
                                }
                                autoComplete="off"
                            />
                            {createErrors.email && (
                                <p className="text-xs text-destructive">
                                    {createErrors.email}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="create-role">Role</Label>
                            <Select
                                value={createData.role}
                                onValueChange={handleCreateRoleChange}
                            >
                                <SelectTrigger
                                    id="create-role"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {roleLabel(role)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {createErrors.role && (
                                <p className="text-xs text-destructive">
                                    {createErrors.role}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="create-campus">Campus</Label>
                            <Select
                                value={createData.campus}
                                onValueChange={(value) =>
                                    setCreateData('campus', value)
                                }
                                disabled={isCreateSuperAdmin}
                            >
                                <SelectTrigger
                                    id="create-campus"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Select campus" />
                                </SelectTrigger>
                                <SelectContent>
                                    {createCampusOptions.map((campus) => (
                                        <SelectItem key={campus} value={campus}>
                                            {campusLabel(campus)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {isCreateSuperAdmin ? (
                                <p className="text-xs text-muted-foreground">
                                    Super Admins have access to all campuses.
                                </p>
                            ) : (
                                createErrors.campus && (
                                    <p className="text-xs text-destructive">
                                        {createErrors.campus}
                                    </p>
                                )
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => closeCreate(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createProcessing}>
                                {createProcessing && (
                                    <LoaderCircleIcon className="animate-spin" />
                                )}
                                Create User
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
