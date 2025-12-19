
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, Header } from './DashboardShell';
import { AlertCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/Button';

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

        // Load initial data from storage
        setUser(JSON.parse(userData));

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

    if (!isClient) return null; // Prevent hydration mismatch

    // Allow rendering sidebar even if user state isn't fully set to avoid flicker, 
    // but header needs user. If critical, return null until user is set.
    // For now, we return null if no user to ensure auth protection.
    if (!user) return null;

    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 font-sans print:block print:bg-white print:min-h-0">
            <div className="print:hidden">
                <Sidebar user={user} />
            </div>
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen transition-all duration-300 ease-in-out print:ml-0 print:min-h-0 print:block">
                <div className="print:hidden">
                    <Header user={user} />
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

                <main className={`flex-1 p-6 md:p-8 overflow-y-auto print:p-0 print:overflow-visible ${(user.status === 'REJECTED' || user.status === 'SUSPENDED') ? 'pointer-events-none grayscale opacity-50 blur-[2px]' : ''}`}>
                    {children}
                </main>
            </div>
        </div>
    );
}
