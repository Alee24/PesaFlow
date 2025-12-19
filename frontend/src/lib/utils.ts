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
    return `http://localhost:3001${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
}
