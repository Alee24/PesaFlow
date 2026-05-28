'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, ExternalLink, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

interface POSLayoutProps {
    children: React.ReactNode;
}

export default function POSLayout({ children }: POSLayoutProps) {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Hydrate from localStorage
        const storedPosUser = localStorage.getItem('posUser');
        const storedPosToken = localStorage.getItem('posToken');

        if (!storedPosToken || !storedPosUser) {
            router.push('/pos/login');
            return;
        }

        setUser(JSON.parse(storedPosUser));
        setLoading(false);

        // Network listeners
        window.addEventListener('online', () => setIsOnline(true));
        window.addEventListener('offline', () => setIsOnline(false));

        return () => {
            window.removeEventListener('online', () => setIsOnline(true));
            window.removeEventListener('offline', () => setIsOnline(false));
        };
    }, []);

    const handleSwitchUser = () => {
        // Clear POS session but KEEP Device Session (Admin 'token')
        localStorage.removeItem('posToken');
        localStorage.removeItem('posUser');
        toast.info("Logged out");
        router.push('/pos/login');
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* POS Header */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-lg">Mpesa Connect POS</span>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-xs text-gray-500">{isOnline ? 'Online' : 'Offline Mode'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500 uppercase">{user?.role?.replace('_', ' ')}</p>
                    </div>
                    <div className="h-8 w-px bg-gray-200 mx-2" />
                    <button
                        onClick={handleSwitchUser}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Switch User
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-4 md:p-6">
                {children}
            </main>
        </div>
    );
}
