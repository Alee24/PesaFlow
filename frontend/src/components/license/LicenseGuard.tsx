'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';
import { LoadingOverlay } from '../ui/LoadingOverlay';

export function LicenseGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [licenseValid, setLicenseValid] = useState<boolean | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        checkLicense();
    }, [pathname]);

    const checkLicense = async () => {
        // Skip license check for certain pages
        const publicPages = ['/license-error', '/auth/login', '/auth/register'];
        if (publicPages.some(page => pathname.startsWith(page))) {
            setLicenseValid(true);
            setChecking(false);
            return;
        }

        try {
            const { data } = await api.get('/license/status');

            if (data.valid) {
                setLicenseValid(true);
            } else {
                setLicenseValid(false);
                router.push('/license-error');
            }
        } catch (error: any) {
            // If license check fails (403, 500, etc.), assume invalid
            if (error.response?.status === 403) {
                setLicenseValid(false);
                router.push('/license-error');
            } else {
                // For other errors, allow access (network issues, etc.)
                setLicenseValid(true);
            }
        } finally {
            setChecking(false);
        }
    };

    if (checking) {
        return <LoadingOverlay message="Encrypting Data" subMessage="Securing your session..." />;
    }

    if (licenseValid === false) {
        return null; // Will redirect to license-error page
    }

    return <>{children}</>;
}
