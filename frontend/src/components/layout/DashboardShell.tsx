
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, CreditCard, ArrowLeftRight, Settings, LogOut, User, Store, FileText, Bell, X, CheckCircle, AlertCircle, Info, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/api';

const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'POS System', href: '/pos', icon: Store },
    { name: 'Invoices', href: '/invoices', icon: FileText, requiresActive: true },
    { name: 'Inventory', href: '/products', icon: Package },
    { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
    { name: 'Withdrawals', href: '/withdrawals', icon: CreditCard, role: 'MERCHANT', requiresActive: true },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Merchant Verification', href: '/admin/verification', icon: CheckCircle, role: 'ADMIN' },
    { name: 'Users', href: '/admin/users', icon: User, role: 'ADMIN' },
    { name: 'Withdrawal Approvals', href: '/admin/withdrawals', icon: CreditCard, role: 'ADMIN' },
];


export function Sidebar({ user }: { user?: any }) {
    const pathname = usePathname();

    const filteredMenuItems = menuItems.filter(item => {
        if (item.role === 'ADMIN') return user?.role === 'ADMIN';
        if (item.role === 'MERCHANT') return user?.role === 'MERCHANT';
        return true;
    });

    const isItemLocked = (item: any) => {
        if (user?.role === 'ADMIN') return false;
        if (item.requiresActive && user?.status !== 'ACTIVE') return true;
        return false;
    };

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 hidden md:block transition-all duration-300 ease-in-out">
            <div className="flex h-16 items-center border-b border-gray-200 dark:border-gray-800 px-6">
                <div className="flex items-center gap-2 font-bold text-xl text-indigo-600 dark:text-indigo-400 animate-fade-in">
                    <Store className="w-6 h-6 hover:rotate-12 transition-transform duration-300" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Mpesa Connect</span>
                </div>
            </div>

            <nav className="p-4 space-y-1">
                {filteredMenuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const locked = isItemLocked(item);

                    if (locked) {
                        return (
                            <div
                                key={item.href}
                                className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ease-out text-gray-400 cursor-not-allowed opacity-60"
                                title="Requires account activation"
                            >
                                <item.icon className="w-5 h-5" />
                                {item.name}
                                <Lock className="w-3 h-3 ml-auto text-amber-500" />
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ease-out 
                                ${isActive
                                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 shadow-sm translate-x-1'
                                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 hover:translate-x-1 hover:shadow-xs'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
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
                    className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-sm font-medium transition-all duration-200 hover:translate-x-1"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </aside>
    );
}


export function Header({ user }: { user?: any }) {
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const prevCountRef = useRef(0);

    const playBeep = () => {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;
            const audioCtx = new AudioContextClass();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(660, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.15);
        } catch (e) { }
    };

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            const newNotifs = res.data;
            const newUnread = newNotifs.filter((n: any) => !n.read).length;

            if (newUnread > prevCountRef.current) {
                playBeep();
            }
            prevCountRef.current = newUnread;
            setNotifications(newNotifs);
        } catch (error) {
            console.error("Failed to fetch notifications");
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [user]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleOpenNotifications = async () => {
        setShowNotifications(true);
        if (unreadCount > 0) {
            try {
                await api.post('/notifications/read');
                // Optimistically mark all as read
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            } catch (e) { console.error(e); }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    // Breadcrumbs
    const pathSegments = pathname.split('/').filter(Boolean);

    return (
        <>
            <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white dark:bg-gray-900/95 backdrop-blur-sm px-6 shadow-sm transition-all duration-300">
                <div className="flex items-center gap-4">
                    <nav className="flex items-center text-sm font-medium text-gray-500">
                        <span className="text-gray-400 mr-2">/</span>
                        {pathSegments.map((segment, index) => (
                            <span key={index} className="flex items-center">
                                <span className={`capitalize ${index === pathSegments.length - 1 ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-500'}`}>
                                    {segment.replace('-', ' ')}
                                </span>
                                {index < pathSegments.length - 1 && <span className="mx-2 text-gray-400">/</span>}
                            </span>
                        ))}
                        {pathSegments.length === 0 && <span className="text-gray-900 dark:text-white font-bold">Dashboard</span>}
                    </nav>
                </div>

                <div className="flex items-center gap-6">
                    {/* Notifications */}
                    <button
                        onClick={handleOpenNotifications}
                        className="p-2 text-gray-500 hover:text-indigo-600 transition-colors relative rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-white"></span>
                        )}
                    </button>

                    {/* User Profile */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            onBlur={() => setTimeout(() => setShowUserMenu(false), 200)}
                            className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity group"
                        >
                            <div className="flex flex-col text-right hidden sm:block">
                                <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                    {user?.email || 'User'}
                                </span>
                                <span className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase() || 'Merchant'}</span>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 group-hover:bg-indigo-200 transition-colors ring-2 ring-transparent group-hover:ring-indigo-100">
                                <User className="w-5 h-5" />
                            </div>
                        </button>

                        {/* Dropdown */}
                        {showUserMenu && (
                            <div className="absolute right-0 top-12 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50 animate-in zoom-in-95 duration-100">
                                <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    Profile
                                </Link>
                                <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    Settings
                                </Link>
                                <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Notification Center Modal */}
            {showNotifications && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowNotifications(false)}>
                    <div
                        className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200 scale-100"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Notifications</h3>
                                <p className="text-xs text-gray-500">You have {unreadCount} unread messages</p>
                            </div>
                            <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto p-2">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">No notifications</div>
                            ) : (
                                notifications.map((note) => (
                                    <div key={note.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors cursor-pointer flex gap-4 group ${!note.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                                        <div className="mt-1 bg-gray-100 dark:bg-gray-800 p-2 rounded-full h-fit group-hover:bg-white transition-colors shadow-sm">
                                            {getIcon(note.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className={`font-semibold text-sm group-hover:text-indigo-600 transition-colors ${!note.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                    {note.title}
                                                </h4>
                                                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">
                                                    {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{note.message}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 text-center">
                            <Link href="/notifications" onClick={() => setShowNotifications(false)} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wide">
                                View All Notifications
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
