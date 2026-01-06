import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getImageUrl(path?: string) {
    if (!path) return undefined;

    let cleanPath = path;

    // 1. Fix absolute localhost URLs saved in DB (legacy data cleanup)
    if (cleanPath.includes('localhost') || cleanPath.includes('127.0.0.1')) {
        if (cleanPath.includes('/uploads/')) {
            cleanPath = `/uploads/${cleanPath.split('/uploads/')[1]}`;
        }
    }

    // If it's still an absolute URL (e.g. external S3), return it
    if (cleanPath.startsWith('http')) return cleanPath;

    // Normalize path separators
    cleanPath = cleanPath.replace(/\\/g, '/');
    if (!cleanPath.startsWith('/')) cleanPath = `/${cleanPath}`;

    // 2. Determine Base URL
    let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mpesaconnect.co.ke/api';

    // CRITICAL: Force Production URL if we are in a browser and NOT on localhost
    // This overrides any build-time "localhost" default that might be lingering
    if (typeof window !== 'undefined' &&
        !window.location.hostname.includes('localhost') &&
        !window.location.hostname.includes('127.0.0.1') &&
        apiUrl.includes('localhost')) {
        apiUrl = 'https://api.mpesaconnect.co.ke/api';
    }

    // Remove /api suffix for static files and ensure clean URL construction
    const baseUrl = apiUrl.replace(/\/api$/, '');

    return `${baseUrl}${cleanPath}`;
}
