'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface AccessGuardProps {
    children: React.ReactNode;
    requiresActive?: boolean;
    requiresAdmin?: boolean;
}

export default function AccessGuard({ children, requiresActive = false, requiresAdmin = false }: AccessGuardProps) {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/auth/login');
            return;
        }
        setUser(JSON.parse(userData));
        setLoading(false);
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!user) return null;

    // Admin check
    if (requiresAdmin && user.role !== 'ADMIN') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Admin Access Required</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        This page is restricted to administrators only.
                    </p>
                    <Link href="/dashboard">
                        <Button className="w-full">Return to Dashboard</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Active status check for merchants
    if (requiresActive && user.role === 'MERCHANT' && user.status !== 'ACTIVE') {
        const isRejected = user.status === 'REJECTED';
        const isPending = user.status === 'PENDING_VERIFICATION';

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                    <div className={`w-16 h-16 ${isRejected ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        {isRejected ? (
                            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        ) : (
                            <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                        )}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {isRejected ? 'Account Application Denied' : 'Account Activation Required'}
                    </h2>

                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {isRejected ? (
                            <>
                                Your account application was rejected.
                                <span className="block mt-2 font-semibold text-red-600 dark:text-red-400">
                                    Reason: {user.appealNotes || 'Documentation issues'}
                                </span>
                                <span className="block mt-2 text-sm">
                                    Please submit an appeal to regain access.
                                </span>
                            </>
                        ) : (
                            <>
                                This feature requires full account activation. Your application is currently under review by our admin team.
                                <span className="block mt-2 text-sm">
                                    You can still use POS for cash sales and manage products while waiting.
                                </span>
                            </>
                        )}
                    </p>

                    <div className="space-y-3">
                        {isRejected && (
                            <Link href="/profile">
                                <Button variant="danger" className="w-full">Submit Appeal</Button>
                            </Link>
                        )}
                        <Link href="/dashboard">
                            <Button variant={isRejected ? 'outline' : 'primary'} className="w-full">
                                Return to Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
