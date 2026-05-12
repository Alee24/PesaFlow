
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar, Header } from './DashboardShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [isClient, setIsClient] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/auth/login');
            return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        import('@/lib/api').then(({ default: api }) => {
            api.get('/auth/me')
                .then(res => {
                    const freshUser = res.data.user;
                    setUser(freshUser);
                    localStorage.setItem('user', JSON.stringify(freshUser));
                })
                .catch(() => {});
        });
    }, [router]);

    // Handle Profile Completion Redirects
    useEffect(() => {
        if (!user || !isClient) return;
        if (user.role !== 'MERCHANT') return;

        if (user.isProfileComplete === false && user.onboardingSkipped === false && pathname !== '/onboarding') {
            router.push('/onboarding');
        }
        if (user.isProfileComplete === true && pathname === '/onboarding') {
            router.push('/dashboard');
        }
    }, [user, pathname, router, isClient]);

    if (!isClient) return null;
    if (!user) return null;

    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 font-sans print:block print:bg-white print:min-h-0">
            <div className="print:hidden">
                <Sidebar
                    user={user}
                    isMobileOpen={isMobileMenuOpen}
                    setIsMobileOpen={setIsMobileMenuOpen}
                />
            </div>
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen transition-all duration-300 ease-in-out print:ml-0 print:min-h-0 print:block">
                <div className="print:hidden">
                    <Header
                        user={user}
                        onMenuClick={() => setIsMobileMenuOpen(true)}
                    />
                </div>

                <main className="flex-1 p-4 overflow-y-auto overflow-x-hidden print:p-0 print:overflow-visible w-full">
                    <div className="w-full h-full">
                        {children}
                    </div>
                </main>

                <footer className="p-4 border-t border-gray-100 dark:border-gray-800 text-center print:hidden">
                    <p className="text-xs text-gray-400">
                        Powered by <a href="https://kkdes.co.ke/" target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">KK Dynamic Enterprise Solutions LTD</a>
                    </p>
                </footer>
            </div>
        </div>
    );
}
