
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, CreditCard, ArrowLeftRight, Settings, LogOut, User, Store } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have a utils file, if not I'll inline it or generic classnames
// Since I don't see lib/utils in previous file lists, I'll stick to template literals if needed or assuming standard setup.
// I'll assume standard class strings for now.

const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'POS System', href: '/pos', icon: Store },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
    { name: 'Withdrawals', href: '/withdrawals', icon: CreditCard },
    { name: 'Admin', href: '/admin', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 hidden md:block">
            <div className="flex h-16 items-center border-b border-gray-200 dark:border-gray-800 px-6">
                <div className="flex items-center gap-2 font-bold text-xl text-indigo-600 dark:text-indigo-400">
                    <Store className="w-6 h-6" />
                    <span>PayFlow</span>
                </div>
            </div>

            <nav className="p-4 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/auth/login';
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </aside>
    );
}

export function Header({ user }: { user?: any }) {
    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800 px-6 shadow-sm">
            <div className="flex items-center gap-4">
                {/* Mobile Toggle could go here */}
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Overview</h2>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col text-right hidden sm:block">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{user?.email || 'User'}</span>
                        <span className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase() || 'Merchant'}</span>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
                        <User className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </header>
    );
}
