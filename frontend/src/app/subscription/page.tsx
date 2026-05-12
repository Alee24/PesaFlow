'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Subscription page removed — redirect to dashboard
export default function SubscriptionPage() {
    const router = useRouter();
    useEffect(() => { router.replace('/dashboard'); }, [router]);
    return null;
}
