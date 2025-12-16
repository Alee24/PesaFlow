
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, Header } from './DashboardShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/auth/login');
            return;
        }
        setUser(JSON.parse(userData));
    }, [router]);

    if (!isClient) return null; // Prevent hydration mismatch

    // Allow rendering sidebar even if user state isn't fully set to avoid flicker, 
    // but header needs user. If critical, return null until user is set.
    // For now, we return null if no user to ensure auth protection.
    if (!user) return null;

    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 font-sans">
            <Sidebar />
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen transition-all duration-300 ease-in-out">
                <Header user={user} />
                <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
