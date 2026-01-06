
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Users, CreditCard, Activity, Server, AlertTriangle, CheckCircle, TrendingUp, DollarSign, RefreshCw, GitCommit } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import api from '@/lib/api';

// Mock Data for Charts
const revenueData = [
    { name: 'Mon', revenue: 12000, profit: 4000 },
    { name: 'Tue', revenue: 19000, profit: 6500 },
    { name: 'Wed', revenue: 15000, profit: 5000 },
    { name: 'Thu', revenue: 25000, profit: 9000 },
    { name: 'Fri', revenue: 32000, profit: 12000 },
    { name: 'Sat', revenue: 28000, profit: 10000 },
    { name: 'Sun', revenue: 22000, profit: 8000 },
];

const userActivityData = [
    { name: '00:00', active: 120 },
    { name: '04:00', active: 50 },
    { name: '08:00', active: 450 },
    { name: '12:00', active: 890 },
    { name: '16:00', active: 1100 },
    { name: '20:00', active: 670 },
];

export default function AdminPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [currency, setCurrency] = useState('KES');
    const [userRole, setUserRole] = useState('');
    const { showToast } = useToast();
    const [updating, setUpdating] = useState(false);
    const [showTerminal, setShowTerminal] = useState(false);
    const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
    const [updaterInterval, setUpdaterInterval] = useState<NodeJS.Timeout | null>(null);


    useEffect(() => {
        const init = async () => {
            // ... existing init logic (unchanged)
            const userDataStr = localStorage.getItem('user');
            if (!userDataStr) {
                router.push('/auth/login');
                return;
            }

            const user = JSON.parse(userDataStr);
            setUserRole(user.role);

            if (user.role !== 'ADMIN') {
                router.push('/dashboard');
                return;
            }

            try {
                const statsPro = api.get('/admin/stats');
                const profilePro = api.get('/profile');
                const systemPro = api.get('/admin/system/status');

                const [statsRes, profileRes, systemRes] = await Promise.all([statsPro, profilePro, systemPro]);

                setStats({ ...statsRes.data, system: systemRes.data });
                if (profileRes.data?.currency) {
                    setCurrency(profileRes.data.currency);
                }
            } catch (error) {
                console.error("Failed to fetch admin data", error);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, [router]);

    // Polling effect
    useEffect(() => {
        if (updating) {
            const interval = setInterval(async () => {
                try {
                    const res = await api.get('/admin/system/update/status');
                    setTerminalLogs(res.data.logs || []);
                    if (res.data.isUpdating === false && res.data.logs.length > 0) {
                        setUpdating(false); // Stop polling if done
                    }
                } catch (error) {
                    console.error("Failed to poll logs", error);
                }
            }, 1000);
            setUpdaterInterval(interval);

            return () => clearInterval(interval);
        } else {
            if (updaterInterval) clearInterval(updaterInterval);
        }
    }, [updating]);

    const handleSystemUpdate = async () => {
        if (!confirm("Are you sure you want to update the server? This will pull the latest code and restart requirements.")) return;

        setShowTerminal(true);
        setTerminalLogs(['Initializing update request...']);
        setUpdating(true);

        try {
            await api.post('/admin/system/update');
            showToast('System update initiated!', 'success');
        } catch (error: any) {
            showToast('Failed to trigger update', 'error');
            setTerminalLogs(prev => [...prev, 'Failed to trigger update: ' + error.message]);
            setUpdating(false);
        }
    };

    if (isLoading) return (
        <DashboardLayout>
            <div className="flex justify-center items-center h-full">Loading Admin Portal...</div>
        </DashboardLayout>
    );

    if (userRole !== 'ADMIN') return null;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                <header className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Portal</h1>
                        <p className="text-gray-500 text-sm">System Overview & Monitoring</p>
                    </div>
                    <Button onClick={() => router.push('/admin/users')} className="flex items-center gap-2">
                        <Users className="w-4 h-4" /> Manage Users
                    </Button>
                </header>

                {/* 1. Colorful Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Merchants */}
                    <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg group">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <span className="flex items-center gap-1 text-xs font-medium bg-green-400/20 text-green-200 px-2 py-1 rounded-full">
                                    <TrendingUp className="w-3 h-3" /> Live
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-3xl font-bold">{stats?.activeMerchants || 0}</h3>
                                <p className="text-indigo-100 text-sm font-medium">Active Merchants</p>
                            </div>
                        </div>
                        <Users className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-300" />
                    </div>

                    {/* Platform Revenue */}
                    <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg group">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                                <span className="flex items-center gap-1 text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                                    Lifetime
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-3xl font-bold">{currency} {Number(stats?.totalVolume || 0).toLocaleString()}</h3>
                                <p className="text-emerald-100 text-sm font-medium">Total Volume</p>
                            </div>
                        </div>
                        <Activity className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-300" />
                    </div>

                    {/* Pending Withdrawals */}
                    <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg group">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <AlertTriangle className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">Action Req.</span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-3xl font-bold">{stats?.pendingPayouts || 0}</h3>
                                <p className="text-orange-100 text-sm font-medium">Pending Payouts</p>
                            </div>
                        </div>
                        <CreditCard className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-300" />
                    </div>

                    {/* System Health */}
                    <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg group">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <Server className="w-6 h-6 text-white" />
                                </div>
                                <span className="flex items-center gap-1 text-xs font-medium bg-green-400/20 text-white px-2 py-1 rounded-full">
                                    <CheckCircle className="w-3 h-3" /> 99.9%
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-3xl font-bold">{stats?.system?.status || 'Active'}</h3>
                                <p className="text-blue-100 text-sm font-medium">System Status</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[10px] bg-blue-400/30 px-2 py-0.5 rounded text-white font-mono flex items-center gap-1">
                                        <GitCommit className="w-3 h-3" /> {stats?.system?.version || 'Unknown'}
                                    </span>
                                    <button
                                        onClick={handleSystemUpdate}
                                        disabled={updating}
                                        className="text-xs bg-white text-blue-600 font-bold px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${updating ? 'animate-spin' : ''}`} />
                                        {updating ? 'Updating System...' : 'System Update'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <Server className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                </div>

                {/* 2. Charts Section (Keep Mock for Visuals as backend doesn't support generic analytics yet) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Revenue Chart */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Revenue Analytics</h3>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">Simulated Data</span>
                        </div>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                                    <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" name="Net Profit" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* User Activity Bar Chart */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Live Traffic</h3>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">Simulated Data</span>
                        </div>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={userActivityData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF' }} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="active" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Active Sessions" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 3. Recent Logs Table */}
                <Card title="Recent Transactions Log" className="overflow-hidden">
                    <div className=" overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b dark:border-gray-700">
                                <tr>
                                    <th className="p-4 text-xs uppercase text-gray-500 font-semibold">Time</th>
                                    <th className="p-4 text-xs uppercase text-gray-500 font-semibold">User</th>
                                    <th className="p-4 text-xs uppercase text-gray-500 font-semibold">Action</th>
                                    <th className="p-4 text-xs uppercase text-gray-500 font-semibold">Amount</th>
                                    <th className="p-4 text-xs uppercase text-gray-500 font-semibold text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {stats?.recentLogs && stats.recentLogs.length > 0 ? (
                                    stats.recentLogs.map((log: any) => (
                                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="p-4 text-sm text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                                            <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">
                                                {log.initiator?.name || log.initiator?.email || 'Unknown'}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{log.type} - {log.reference || 'N/A'}</td>
                                            <td className="p-4 text-sm font-bold text-gray-800 dark:text-white">{currency} {Number(log.amount).toLocaleString()}</td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                                                    ${log.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                        log.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">No recent activity detected.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
            {/* Terminal Modal */}
            {showTerminal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-gray-900 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden border border-gray-700 font-mono text-sm max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center px-4 py-3 bg-gray-800 border-b border-gray-700">
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <span className="text-gray-400 ml-2 font-medium">deploy-terminal -- bash</span>
                            </div>
                            <button
                                onClick={() => {
                                    setShowTerminal(false);
                                    if (!updating) setUpdating(false); // Clean up if manually closed
                                }}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 bg-black text-green-400 space-y-1 font-mono">
                            {terminalLogs.length === 0 && <p className="text-gray-500 italic">Waiting for logs...</p>}
                            {terminalLogs.map((log, i) => (
                                <div key={i} className="break-all whitespace-pre-wrap leading-relaxed">{log}</div>
                            ))}
                            {updating && (
                                <div className="animate-pulse">_</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
