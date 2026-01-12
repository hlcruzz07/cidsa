import { InertiaLinkProps } from '@inertiajs/react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isSameUrl(
    url1: NonNullable<InertiaLinkProps['href']>,
    url2: NonNullable<InertiaLinkProps['href']>,
) {
    return resolveUrl(url1) === resolveUrl(url2);
}

export function resolveUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export function base64ToFile(base64: string, filename: string) {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

export function formatAddress(barangay: string, city: string, zip: string) {
    let cleanBrgy = barangay.trim().toUpperCase();

    // Detect Roman numeral (I, II, III, IV, V ... up to 3999)
    const romanRegex =
        /\b(M{0,3}(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3}))$/;
    const romanMatch = cleanBrgy.match(romanRegex);

    // Store roman numeral if present
    let roman = '';
    if (romanMatch) {
        roman = romanMatch[0];
        cleanBrgy = cleanBrgy.replace(roman, '').trim();
    }

    // Convert BARANGAY, BRGY, BRG, BARRIO → remove prefix
    cleanBrgy = cleanBrgy.replace(/^(BARANGAY|BRGY|BRG|BARRIO)\b/i, '').trim();

    // Apply "Brgy." prefix
    cleanBrgy = cleanBrgy ? `Brgy. ${cleanBrgy}` : 'Brgy.';

    // Append Roman numeral back
    if (roman) cleanBrgy += ` ${roman}`;

    // Capitalize city properly
    const formattedCity = city
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

    return `${cleanBrgy}, ${formattedCity}, ${zip}`;
}

export const toTitleCase = (str: string): string =>
    str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

/**
 * Normalize barangay input from variations like "Barangay 5 (POB)", "Brgy. 5",
 * returning only the remainder (e.g., "5 (POB)"). If the value doesn't contain
 * a barangay prefix, returns it unchanged (trimmed).
 */
export function normalizeBarangay(input: string): string {
    if (!input || typeof input !== 'string') return input;

    const original = input.trim();

    // Remove trailing dot and normalize whitespace
    let s = original.replace(/\.$/, '').trim();

    // Remove prefix words like Barangay, Brgy, Brg, Barrio (case-insensitive)
    // Allow optional dot and optional whitespace after the prefix
    s = s.replace(/^\s*(?:barangay|brgy|brg|barrio)\.?\s*/i, '').trim();

    // If stripping the prefix left an empty string, return the original value
    if (s === '') return original;

    return s;
}

import * as imageConversion from 'image-conversion';
import { EImageType } from 'image-conversion';

interface ProcessImageParams {
    file: File;
    filename: string;
    maxSizeMB?: number;
}

export const processAndCompressImage = async ({
    file,
    filename,
    maxSizeMB = 2,
}: ProcessImageParams): Promise<File> => {
    const quality = file.size > maxSizeMB * 1024 * 1024 ? 0.7 : 0.95;

    const compressedBlob = await imageConversion.compress(file, {
        type: EImageType.JPEG,
        quality,
    });

    return new File([compressedBlob], filename, {
        type: 'image/jpeg',
    });
};

export const yearLevelBadge = (year: number) => {
    switch (year) {
        case 1:
            return 'bg-blue-500 text-white';
        case 2:
            return 'bg-green-500 text-white';
        case 3:
            return 'bg-yellow-500 text-white';
        case 4:
            return 'bg-orange-500 text-white';
        case 5:
            return 'bg-red-500 text-white';
        default:
            return 'bg-muted text-muted-foreground';
    }
};

export function getRandomBadgeColor() {
    const badgeColors = [
        'bg-blue-100 text-blue-800',
        'bg-green-100 text-green-800',
        'bg-yellow-100 text-yellow-800',
        'bg-red-100 text-red-800',
        'bg-purple-100 text-purple-800',
        'bg-pink-100 text-pink-800',
        'bg-indigo-100 text-indigo-800',
    ];
    return badgeColors[Math.floor(Math.random() * badgeColors.length)];
}

type CampusData = {
    campus: string;
    colleges: {
        value: string;
        name: string;
        programs: {
            name: string;
            majors: string[];
        }[];
    }[];
};
export const campusDirectoryArr: CampusData[] = [
    {
        campus: 'Talisay',
        colleges: [
            {
                value: 'CAS',
                name: 'College of Arts & Sciences',
                programs: [
                    {
                        name: 'Bachelor of Arts in English Language',
                        majors: [],
                    },
                    {
                        name: 'Bachelor of Arts in Social Science',
                        majors: [],
                    },
                    {
                        name: 'Bachelor of Public Administration',
                        majors: [],
                    },
                    {
                        name: 'Bachelor of Science in Applied Mathematics',
                        majors: [],
                    },
                    {
                        name: 'Bachelor of Science in Psychology',
                        majors: [],
                    },
                    {
                        name: 'Master in Public Administration',
                        majors: [
                            'Human Resource Management',
                            'Urban Planning and Management',
                        ],
                    },
                    {
                        name: 'Doctor in Public Administration',
                        majors: ['Professional Track'],
                    },
                ],
            },
            {
                value: 'CBMA',
                name: 'College of Business Management & Accountancy',
                programs: [
                    {
                        name: 'Bachelor of Science in Hospitality Management',
                        majors: [],
                    },
                ],
            },
            {
                value: 'CCS',
                name: 'College of Computer Studies',
                programs: [
                    {
                        name: 'Bachelor of Science in Information Systems',
                        majors: [],
                    },
                ],
            },
            {
                value: 'COED',
                name: 'College of Education',
                programs: [
                    {
                        name: 'Bachelor of Early Childhood Education',
                        majors: [],
                    },
                    {
                        name: 'Bachelor of Elementary Education',
                        majors: ['General Education'],
                    },
                    { name: 'Bachelor of Physical Education', majors: [] },
                    {
                        name: 'Bachelor of Secondary Education',
                        majors: [
                            'English',
                            'Filipino',
                            'Mathematics',
                            'Science',
                        ],
                    },
                    {
                        name: 'Bachelor of Special Needs Education',
                        majors: ['Generalist'],
                    },
                    {
                        name: 'Bachelor of Technology and Livelihood Education',
                        majors: ['Home Economics', 'Industrial'],
                    },
                    {
                        name: 'Teacher Certificate Program (Supplementals)',
                        majors: [],
                    },
                    {
                        name: 'Master of Arts in Education',
                        majors: ['Educational Management'],
                    },
                    {
                        name: 'Master of Arts in Education (Academic Track)',
                        majors: [
                            'Educational Management',
                            'English',
                            'General Science',
                            'Mathematics',
                            'Physical Education',
                            'Technology and Livelihood Education',
                        ],
                    },
                    {
                        name: 'Doctor of Education',
                        majors: ['Educational Management'],
                    },
                ],
            },
            {
                value: 'COE',
                name: 'College of Engineering',
                programs: [
                    {
                        name: 'Bachelor of Science in Civil Engineering',
                        majors: [],
                    },
                ],
            },
            {
                value: 'CIT',
                name: 'College of Industrial Technology',
                programs: [
                    {
                        name: 'Bachelor of Industrial Technology',
                        majors: [
                            'Apparel & Fashion Technology',
                            'Architectural Drafting Technology',
                            'Automotive Technology',
                            'Culinary Technology',
                            'Electrical Technology',
                            'Electronics Technology',
                            'HVACR Technology',
                            'Mechanical Technology',
                        ],
                    },
                    {
                        name: 'Bachelor of Science in Industrial Technology',
                        majors: [
                            'Apparel & Fashion Technology',
                            'Architectural Drafting Technology',
                            'Automotive Technology',
                            'Culinary Technology',
                            'Electrical Technology',
                            'Electronics Technology',
                            'HVACR Technology',
                            'Mechanical Technology',
                        ],
                    },
                    { name: 'Master in Technology Management', majors: [] },
                    {
                        name: 'Doctor in Philosophy in Technology Management',
                        majors: [],
                    },
                ],
            },
        ],
    },

    {
        campus: 'Binalbagan',
        colleges: [
            {
                value: 'CBMA',
                name: 'College of Business Management & Accountancy',
                programs: [
                    {
                        name: 'Bachelor of Science in Hospitality Management',
                        majors: ['Financial Management'],
                    },
                ],
            },
            {
                value: 'CCS',
                name: 'College of Computer Studies',
                programs: [
                    {
                        name: 'Bachelor of Science in Information Technology',
                        majors: [],
                    },
                ],
            },
            {
                value: 'CCJ',
                name: 'College of Criminal Justice',
                programs: [
                    {
                        name: 'Bachelor of Science in Criminology',
                        majors: [],
                    },
                ],
            },
            {
                value: 'COED',
                name: 'College of Education',
                programs: [
                    {
                        name: 'Bachelor of Elementary Education',
                        majors: ['General Education'],
                    },
                    {
                        name: 'Bachelor of Secondary Education',
                        majors: ['Science'],
                    },
                    {
                        name: 'Bachelor of Technology and Livelihood Education',
                        majors: ['Home Economics'],
                    },
                ],
            },
            {
                value: 'COF',
                name: 'College of Fisheries',
                programs: [
                    {
                        name: 'Bachelor of Science in Fisheries',
                        majors: [],
                    },
                ],
            },
        ],
    },

    {
        campus: 'Fortune Towne',
        colleges: [
            {
                value: 'CBMA',
                name: 'College of Business Management & Accountancy',
                programs: [
                    {
                        name: 'Bachelor of Science in Accountancy',
                        majors: [],
                    },
                    {
                        name: 'Bachelor of Science in Business Administration',
                        majors: ['Financial Management'],
                    },
                    {
                        name: 'Bachelor of Science in Entrepreneurship',
                        majors: [],
                    },
                    {
                        name: 'Bachelor of Science in Management Accounting',
                        majors: [],
                    },
                    {
                        name: 'Bachelor of Science in Office Administration',
                        majors: [],
                    },
                    {
                        name: 'Master of Business Administration',
                        majors: [],
                    },
                    { name: 'Master of Public Administration', majors: [] },
                ],
            },
            {
                value: 'CCS',
                name: 'College of Computer Studies',
                programs: [
                    {
                        name: 'Bachelor of Science in Information Systems',
                        majors: [],
                    },
                ],
            },
        ],
    },

    {
        campus: 'Alijis',
        colleges: [
            {
                value: 'CCS',
                name: 'College of Computer Studies',
                programs: [
                    {
                        name: 'Bachelor of Science in Information Systems',
                        majors: [],
                    },
                    {
                        name: 'Bachelor of Science in Information Technology',
                        majors: [],
                    },
                ],
            },
            {
                value: 'COE',
                name: 'College of Engineering',
                programs: [
                    {
                        name: 'Bachelor of Science in Computer Engineering',
                        majors: [],
                    },
                    {
                        name: 'Bachelor of Science in Electronics Engineering',
                        majors: [],
                    },
                ],
            },
            {
                value: 'CIT',
                name: 'College of Industrial Technology',
                programs: [
                    {
                        name: 'Bachelor of Industrial Technology',
                        majors: [
                            'Architectural Drafting Technology',
                            'Automotive Technology',
                            'Computer Technology',
                            'Culinary Technology',
                            'Electrical Technology',
                            'Electronics Technology',
                            'Mechanical Technology',
                        ],
                    },
                    {
                        name: 'Bachelor of Science in Industrial Technology',
                        majors: [
                            'Architectural Drafting Technology',
                            'Automotive Technology',
                            'Computer Technology',
                            'Culinary Technology',
                            'Electrical Technology',
                            'Electronics Technology',
                            'Mechanical Technology',
                        ],
                    },
                ],
            },
            {
                value: 'COED',
                name: 'College of Education',
                programs: [
                    {
                        name: 'Bachelor of Technical Vocational Teacher Education',
                        majors: [
                            'Electrical Technology',
                            'Electronics Technology',
                        ],
                    },
                ],
            },
        ],
    },
];
