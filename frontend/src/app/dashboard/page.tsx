
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingCart, DollarSign, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import axios from 'axios';

// Mock Data for Charts
const chartData = [
    { name: 'Mon', sales: 4000 },
    { name: 'Tue', sales: 3000 },
    { name: 'Wed', sales: 2000 },
    { name: 'Thu', sales: 2780 },
    { name: 'Fri', sales: 1890 },
    { name: 'Sat', sales: 2390 },
    { name: 'Sun', sales: 3490 },
];

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [recentTx, setRecentTx] = useState<any[]>([]);

    useEffect(() => {
        // Auth Check
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/auth/login');
            return;
        }
        setUser(JSON.parse(userData));

        // Fetch Recent Transactions (Mock or Real)
        // In a real scenario, use useEffect to fetch from API
        // For visual demo, we'll use empty or mock if backend empty
    }, [router]);

    if (!user) return null;

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Welcome Section */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard Overview</h1>
                    <p className="text-gray-500 text-sm">Welcome back, {user.email}</p>
                </div>

                {/* Stat Cards - Cool Admin Style (Gradients) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                    {/* Card 1: Members/Total Sales (Blue-Purple) */}
                    <div className="rounded-xl overflow-hidden shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 relative">
                        <div className="flex justify-between items-start z-10 relative">
                            <div>
                                <h3 className="text-lg font-medium opacity-90">Total Balance</h3>
                                <div className="mt-2 text-3xl font-bold">KES 0.00</div>
                                <p className="text-sm opacity-75 mt-1">Available to withdraw</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                <DollarSign className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        {/* Decorative Chart Line Overlay (Faked with CSS or SVG) */}
                        <div className="absolute bottom-0 left-0 w-full h-16 opacity-20">
                            <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
                                <path d="M0 15 Q25 5 50 10 T100 5 V20 H0 Z" fill="white" />
                            </svg>
                        </div>
                    </div>

                    {/* Card 2: Items Sold (Pink-Red) */}
                    <div className="rounded-xl overflow-hidden shadow-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white p-6 relative">
                        <div className="flex justify-between items-start z-10 relative">
                            <div>
                                <h3 className="text-lg font-medium opacity-90">Total Sales</h3>
                                <div className="mt-2 text-3xl font-bold">0</div>
                                <p className="text-sm opacity-75 mt-1">Items sold this month</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                <ShoppingCart className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-16 opacity-20">
                            <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
                                <path d="M0 18 Q30 5 60 12 T100 8 V20 H0 Z" fill="white" />
                            </svg>
                        </div>
                    </div>

                    {/* Card 3: This Week (Green-Teal) */}
                    <div className="rounded-xl overflow-hidden shadow-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-6 relative">
                        <div className="flex justify-between items-start z-10 relative">
                            <div>
                                <h3 className="text-lg font-medium opacity-90">Transactions</h3>
                                <div className="mt-2 text-3xl font-bold">0</div>
                                <p className="text-sm opacity-75 mt-1">Processed this week</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                <Calendar className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-16 opacity-20">
                            <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
                                <path d="M0 10 Q40 18 70 8 T100 12 V20 H0 Z" fill="white" />
                            </svg>
                        </div>
                    </div>

                    {/* Card 4: Earnings (Orange-Yellow) */}
                    <div className="rounded-xl overflow-hidden shadow-lg bg-gradient-to-r from-orange-400 to-amber-500 text-white p-6 relative">
                        <div className="flex justify-between items-start z-10 relative">
                            <div>
                                <h3 className="text-lg font-medium opacity-90">Revenue</h3>
                                <div className="mt-2 text-3xl font-bold">KES 0.00</div>
                                <p className="text-sm opacity-75 mt-1">Gross volume</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-16 opacity-20">
                            <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
                                <path d="M0 15 Q20 5 40 12 T100 5 V20 H0 Z" fill="white" />
                            </svg>
                        </div>
                    </div>

                </div>

                {/* Chart & Stats Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Sales Overview</h3>
                            <select className="text-sm border-gray-200 rounded-md dark:bg-gray-700 dark:border-gray-600">
                                <option>This Week</option>
                                <option>Last Week</option>
                            </select>
                        </div>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="sales" stroke="#8884d8" fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Side Stats / Top Countries Equivalent */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 flex flex-col">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Top Products</h3>
                        <div className="flex-1 space-y-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500">
                                            #{i}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">Product Item {i}</div>
                                            <div className="text-xs text-gray-500">electronics</div>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-800 dark:text-white">KES {1000 * i}</span>
                                </div>
                            ))}
                        </div>
                        <Link href="/products" className="mt-6 w-full py-2 bg-indigo-50 text-indigo-600 text-sm font-bold rounded-lg hover:bg-indigo-100 transition-colors block text-center">
                            View All
                        </Link>
                    </div>
                </div>

                {/* Recent Transactions Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">

                    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Recent Transactions</h3>
                        <Link href="/transactions" className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-500">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Order ID</th>
                                    <th className="px-6 py-4 font-semibold">Description</th>
                                    <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4">2023-12-16 14:30</td>
                                    <td className="px-6 py-4 text-indigo-600 font-medium">#TRX-9983</td>
                                    <td className="px-6 py-4">M-Pesa Payment from 2547...</td>
                                    <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">KES 500.00</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Completed
                                        </span>
                                    </td>
                                </tr>
                                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4">2023-12-16 12:15</td>
                                    <td className="px-6 py-4 text-indigo-600 font-medium">#TRX-9982</td>
                                    <td className="px-6 py-4">M-Pesa Payment from 2547...</td>
                                    <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">KES 120.00</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            Pending
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

// Add these to global css if not present or rely on standard tailwind colors
// The gradients used are standard Tailwind: from-blue-500 to-indigo-600, etc.
