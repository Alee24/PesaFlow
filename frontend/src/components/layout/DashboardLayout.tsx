
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar, Header } from './DashboardShell';
import { AlertCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { SubscriptionBadge } from '../subscription/SubscriptionBadge';

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

        // Load initial data from storage
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Fetch fresh data from API to ensure status/name are up to date
        import('@/lib/api').then(({ default: api }) => {
            api.get('/auth/me')
                .then(res => {
                    const freshUser = res.data.user;
                    setUser(freshUser);
                    localStorage.setItem('user', JSON.stringify(freshUser));
                })
                .catch(() => {
                    // If fetch fails (e.g. token expired), user might need to login again ideally
                    // But we'll let existing api interceptors handle 401s if they exist
                });
        });
    }, [router]);

    // Handle Profile Completion Redirects
    useEffect(() => {
        if (!user || !isClient) return;
        if (user.role !== 'MERCHANT') return;

        // 1. If profile is NOT complete (strictly false), redirect to onboarding
        // We check strictly false to avoid redirecting old cached users who might have undefined
        if (user.isProfileComplete === false && pathname !== '/onboarding') {
            router.push('/onboarding');
        }

        // 2. If profile IS complete, prevent access to onboarding
        if (user.isProfileComplete === true && pathname === '/onboarding') {
            router.push('/dashboard');
        }
    }, [user, pathname, router, isClient]);

    if (!isClient) return null; // Prevent hydration mismatch

    // Allow rendering sidebar even if user state isn't fully set to avoid flicker, 
    // but header needs user. If critical, return null until user is set.
    // For now, we return null if no user to ensure auth protection.
    if (!user) return null;

    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 font-sans print:block print:bg-white print:min-h-0">
            <div className="print:hidden">
                <Sidebar user={user} isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />
            </div>
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen transition-all duration-300 ease-in-out print:ml-0 print:min-h-0 print:block">
                <div className="print:hidden">
                    <Header user={user} onMenuClick={() => setIsMobileMenuOpen(true)} />
                </div>

                {/* Restriction Banner for Merchants */}
                {user.role === 'MERCHANT' && user.status === 'PENDING_VERIFICATION' && (
                    <div className="bg-amber-50 border-b border-amber-200 px-8 py-3 flex items-center justify-between animate-in slide-in-from-top duration-500">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-amber-100 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-900">Account Pending Verification</p>
                                <p className="text-xs text-amber-700">Digital payments (M-Pesa, Invoices) and Withdrawals are restricted until admin approval. You can still use POS for Cash Sales.</p>
                            </div>
                        </div>
                    </div>
                )}

                {user.role === 'MERCHANT' && user.status === 'REJECTED' && (
                    <div className="bg-red-50 border-b border-red-200 px-8 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-red-100 rounded-lg">
                                <XCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-red-900">Account Application Denied</p>
                                <p className="text-xs text-red-700">Reason: {user.appealNotes || 'Documentation issues.'}. Please submit an appeal to use the app.</p>
                            </div>
                        </div>
                        <Link href="/profile">
                            <Button size="sm" variant="danger">Submit Appeal</Button>
                        </Link>
                    </div>
                )}

                <main className={`flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto overflow-x-hidden print:p-0 print:overflow-visible max-w-full ${(user.status === 'REJECTED' || user.status === 'SUSPENDED') ? 'pointer-events-none grayscale opacity-50 blur-[2px]' : ''}`}>
                    <div className="max-w-7xl mx-auto w-full">
                        {/* <LicenseGuard> */}
                        {children}
                        {/* </LicenseGuard> */}
                    </div>
                </main>

                <footer className="p-4 border-t border-gray-100 dark:border-gray-800 text-center print:hidden">
                    <p className="text-xs text-gray-400">
                        Powered by <a href="https://kkdes.co.ke/" target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">KK Dynamic Enterprise Solutions LTD</a>
                    </p>
                </footer>

                <SubscriptionBadge />
            </div>
        </div>
    );
}
