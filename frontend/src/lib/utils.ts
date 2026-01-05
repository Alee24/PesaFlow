import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getImageUrl(path?: string) {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    // Normalize path separators for Windows compatibility
    const cleanPath = path.replace(/\\/g, '/');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    // Remove /api suffix for static files and ensure clean URL construction
    const baseUrl = apiUrl.replace(/\/api$/, '');
    return `${baseUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
}
