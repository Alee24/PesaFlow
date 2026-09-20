
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, ShoppingCart, Package, CreditCard, ArrowLeftRight, Settings,
    LogOut, User, Store, FileText, Bell, X, CheckCircle, AlertCircle, Info, Lock,
    ShieldCheck, TrendingUp, BarChart3, Users, Wallet, MessageSquare, Key, Globe,
    ChevronRight, Receipt, Zap, Building2, Smartphone, QrCode, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

// Navigation structure - flat, clear, no collapsing required
export const navSections = [
    {
        label: null, // No label for top-level items
        items: [
            { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { name: 'Analytics', href: '/analytics', icon: BarChart3, feature: 'ANALYTICS' },
        ]
    },
    {
        label: 'Sales & Products',
        items: [
            { name: 'Point of Sale', href: '/pos', icon: ShoppingCart },
            { name: 'Products', href: '/products', icon: Package },
            { name: 'Sales History', href: '/sales', icon: Receipt },
            { name: 'Customers (CRM)', href: '/customers', icon: Users, feature: 'CRM' },
            { name: 'Kiosk Mode', href: '/pos/login', icon: Store },
        ]
    },
    {
        label: 'Finance',
        items: [
            { name: 'Direct Payment', href: '/direct-payment', icon: Smartphone },
            { name: 'Safaricom APIs', href: '/safaricom-apis', icon: Activity },
            { name: 'M-Pesa QR Generator', href: '/qr-generator', icon: QrCode },
            { name: 'Invoices', href: '/invoices', icon: FileText, feature: 'invoices' },
            { name: 'Wallet', href: '/wallet', icon: Wallet },
            { name: 'Withdrawals', href: '/withdrawals', icon: CreditCard },
            { name: 'Bulk Payments', href: '/bulk-payments', icon: ArrowLeftRight, feature: 'MPESA_BULK' },
        ]
    },
    {
        label: 'Account',
        items: [
            { name: 'Settings', href: '/settings', icon: Settings },
            { name: 'Team', href: '/team', icon: Users, feature: 'TEAM_MANAGEMENT' },
            { name: 'Subscription', href: '/subscription', icon: ShieldCheck },
            { name: 'Support', href: '/support', icon: MessageSquare },
        ]
    },
    {
        label: 'Administration',
        role: 'ADMIN',
        items: [
            { name: 'Admin Dashboard', href: '/admin', icon: Building2, role: 'ADMIN' },
            { name: 'Safaricom APIs Hub', href: '/safaricom-apis', icon: Activity, role: 'ADMIN' },
            { name: 'System Dashboard', href: '/admin/system-dashboard', icon: TrendingUp, role: 'ADMIN' },
            { name: 'System Health', href: '/admin/system-health', icon: ShieldCheck, role: 'ADMIN' },
            { name: 'License', href: '/admin/license', icon: Key, role: 'ADMIN' },
            { name: 'Verification', href: '/admin/verification', icon: CheckCircle, role: 'ADMIN' },
            { name: 'Users', href: '/admin/users', icon: User, role: 'ADMIN' },
            { name: 'Withdrawals', href: '/admin/withdrawals', icon: CreditCard, role: 'ADMIN' },
            { name: 'Admin Settings', href: '/admin/settings', icon: Settings, role: 'ADMIN' },
            { name: 'KRA Integration', href: '/admin/kra-integration', icon: Globe, role: 'ADMIN' },
            { name: 'Google Analytics', href: '/admin/analytics', icon: BarChart3, role: 'ADMIN' },
        ]
    }
];

// Keep old export for any existing imports
export const menuGroups = navSections;

export function Sidebar({ user, isMobileOpen, setIsMobileOpen }: {
    user?: any;
    isMobileOpen?: boolean;
    setIsMobileOpen?: (open: boolean) => void;
}) {
    const { logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const pathname = usePathname();
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || window.location.origin.replace(/:\d+$/, ':5000');
                const response = await fetch(`${baseUrl}/api/settings/public`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.logoUrl) {
                        setLogoUrl(data.logoUrl.startsWith('http') ? data.logoUrl : `${baseUrl}${data.logoUrl}`);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch public settings', error);
            }
        };
        fetchSettings();
    }, []);

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden"
                    onClick={() => setIsMobileOpen?.(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed left-0 top-0 z-50 h-screen w-60 flex flex-col bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800 transition-transform duration-300 ease-in-out",
                "md:translate-x-0 md:z-40",
                isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                {/* Logo / Brand */}
                <div className="flex h-14 shrink-0 items-center justify-between px-4 border-b border-gray-200 dark:border-zinc-800">
                    <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setIsMobileOpen?.(false)}>
                        {logoUrl ? (
                            <img src={logoUrl} alt="Mpesa Connect" className="h-7 w-auto object-contain" />
                        ) : (
                            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
                                <Zap className="w-4 h-4 text-white" fill="white" />
                            </div>
                        )}
                        <span className="font-bold text-[15px] tracking-tight text-gray-900 dark:text-white">Mpesa Connect</span>
                    </Link>
                    <button
                        onClick={() => setIsMobileOpen?.(false)}
                        className="md:hidden p-1.5 rounded-md text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
                    {navSections.map((section, sIdx) => {
                        // Filter items by role
                        const visibleItems = section.items.filter((item: any) => {
                            if (item.role === 'ADMIN' && user?.role !== 'ADMIN') return false;
                            return true;
                        });

                        // Skip admin section entirely for non-admins
                        if (section.role === 'ADMIN' && user?.role !== 'ADMIN') return null;
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={sIdx}>
                                {section.label && (
                                    <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-zinc-500">
                                        {section.label}
                                    </p>
                                )}
                                <div className="space-y-0.5">
                                    {visibleItems.map((item: any) => {
                                        const isActive = pathname === item.href ||
                                            (item.href !== '/dashboard' && item.href !== '/admin' && pathname.startsWith(item.href + '/')) ||
                                            (item.href !== '/dashboard' && item.href !== '/admin' && pathname === item.href);

                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => setIsMobileOpen?.(false)}
                                                className={cn(
                                                    "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-all duration-150",
                                                    isActive
                                                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                                                        : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800/60"
                                                )}
                                            >
                                                <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-zinc-500")} />
                                                <span className="truncate">{item.name}</span>
                                                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* Bottom: User Info + Sign Out */}
                <div className="shrink-0 border-t border-gray-200 dark:border-zinc-800 p-3 space-y-2">
                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800/60 transition-all"
                    >
                        <span className="text-base">{theme === 'dark' ? '☀️' : '🌙'}</span>
                        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>

                    {/* User Profile Summary */}
                    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-md bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {user?.name || 'User'}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-zinc-500 truncate uppercase">
                                {user?.role || 'MERCHANT'}
                            </p>
                        </div>
                    </div>

                    {/* Sign Out */}
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                    >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}


export function Header({ user, onMenuClick }: {
    user?: any;
    onMenuClick?: () => void;
}) {
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const pathname = usePathname();
    const prevCountRef = useRef(0);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            const newNotifs = res.data;
            const newUnread = newNotifs.filter((n: any) => !n.read).length;
            prevCountRef.current = newUnread;
            setNotifications(newNotifs);
        } catch (error) {
            // Silent fail
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleOpenNotifications = async () => {
        setShowNotifications(true);
        if (unreadCount > 0) {
            try {
                await api.post('/notifications/read');
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            } catch (e) { }
        }
    };

    const { logout } = useAuth();

    const getNotifIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    // Page title from path
    const getPageTitle = () => {
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length === 0) return 'Dashboard';
        const last = segments[segments.length - 1];
        return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
    };

    return (
        <>
            <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 md:px-6">
                <div className="flex items-center gap-3">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={onMenuClick}
                        className="md:hidden p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        aria-label="Open menu"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Page Title */}
                    <div className="flex items-center gap-2">
                        <h1 className="text-sm font-semibold text-zinc-900 dark:text-white">{getPageTitle()}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-1 md:gap-2">
                    {/* Notifications */}
                    <button
                        onClick={handleOpenNotifications}
                        className="relative p-2 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <Bell className="w-4.5 h-4.5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950" />
                        )}
                    </button>

                    {/* Divider */}
                    <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800 mx-1" />

                    {/* User Profile */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            onBlur={() => setTimeout(() => setShowUserMenu(false), 200)}
                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="hidden sm:flex flex-col text-left">
                                <span className="text-xs font-semibold text-zinc-900 dark:text-white leading-tight">{user?.name || user?.email?.split('@')[0] || 'User'}</span>
                                <span className="text-[10px] text-zinc-500 capitalize leading-tight">{user?.role?.toLowerCase() || 'merchant'}</span>
                            </div>
                            <ChevronRight className="hidden sm:block w-3.5 h-3.5 text-zinc-400 rotate-90" />
                        </button>

                        {/* Dropdown */}
                        {showUserMenu && (
                            <div
                                className="absolute right-0 top-11 w-44 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 py-1.5 z-50"
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                <Link href="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                    <User className="w-3.5 h-3.5 text-zinc-400" />
                                    Profile
                                </Link>
                                <Link href="/settings" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                    <Settings className="w-3.5 h-3.5 text-zinc-400" />
                                    Settings
                                </Link>
                                <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
                                <button
                                    onClick={() => { setShowUserMenu(false); logout(); }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Notification Panel */}
            {showNotifications && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-end pt-16 pr-4 bg-black/20 backdrop-blur-sm"
                    onClick={() => setShowNotifications(false)}
                >
                    <div
                        className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">Notifications</h3>
                                <p className="text-xs text-zinc-500 mt-0.5">{unreadCount} unread</p>
                            </div>
                            <button onClick={() => setShowNotifications(false)} className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="max-h-[360px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="py-10 text-center">
                                    <Bell className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                                    <p className="text-sm text-zinc-400">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((note) => (
                                    <div key={note.id} className={cn(
                                        "px-4 py-3.5 flex gap-3 border-b border-zinc-50 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors",
                                        !note.read && "bg-emerald-50/30 dark:bg-emerald-900/5"
                                    )}>
                                        <div className="mt-0.5 shrink-0">
                                            {getNotifIcon(note.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <h4 className={cn("text-xs font-semibold truncate", !note.read ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400")}>
                                                    {note.title}
                                                </h4>
                                                <span className="text-[10px] text-zinc-400 shrink-0">
                                                    {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{note.message}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 text-center">
                            <Link href="/notifications" onClick={() => setShowNotifications(false)} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
                                View all notifications →
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
