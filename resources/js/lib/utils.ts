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
