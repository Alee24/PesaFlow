'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    Users,
    DollarSign,
    AlertCircle,
    TrendingUp,
    Activity,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [systemLogs, setSystemLogs] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardData();
        // Refresh every 60 seconds
        const interval = setInterval(fetchDashboardData, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchSystemLogs();
        // Refresh logs every 30 seconds
        const logsInterval = setInterval(fetchSystemLogs, 30000);
        return () => clearInterval(logsInterval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, transactionsRes, usersRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/transactions?limit=10'),
                api.get('/admin/users?limit=5')
            ]);

            setStats(statsRes.data);
            setRecentTransactions(transactionsRes.data.transactions || []);
            setRecentUsers(usersRes.data.slice(0, 5) || []);
        } catch (error: any) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSystemLogs = async () => {
        try {
            const response = await api.get('/admin/system/logs');
            setSystemLogs(response.data.logs || []);
        } catch (error: any) {
            console.error('Failed to fetch system logs:', error);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES'
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
            case 'COMPLETED':
                return 'text-green-600 bg-green-100';
            case 'PENDING':
            case 'PENDING_VERIFICATION':
                return 'text-yellow-600 bg-yellow-100';
            case 'REJECTED':
            case 'FAILED':
                return 'text-red-600 bg-red-100';
            case 'SUSPENDED':
                return 'text-orange-600 bg-orange-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">System Overview & Monitoring</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={fetchDashboardData}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </Button>
                        <Button
                            onClick={() => router.push('/admin/users')}
                            className="flex items-center gap-2"
                        >
                            <Users className="w-4 h-4" />
                            Manage Users
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Active Merchants */}
                    <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-lg">
                                <Users className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                                Live
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm opacity-90">Active Merchants</p>
                            <p className="text-3xl font-bold">{stats?.activeMerchants || 0}</p>
                            <p className="text-xs opacity-75">
                                {stats?.pendingMerchants || 0} pending verification
                            </p>
                        </div>
                    </Card>

                    {/* Total Volume */}
                    <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-lg">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                                Lifetime
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm opacity-90">Total Volume</p>
                            <p className="text-3xl font-bold">
                                {formatCurrency(stats?.totalVolume || 0)}
                            </p>
                            <div className="flex items-center gap-1 text-xs opacity-75">
                                <ArrowUpRight className="w-3 h-3" />
                                <span>{stats?.volumeGrowth || 0}% from last month</span>
                            </div>
                        </div>
                    </Card>

                    {/* Pending Payouts */}
                    <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-lg">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                                Action Req
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm opacity-90">Pending Payouts</p>
                            <p className="text-3xl font-bold">{stats?.pendingPayouts || 0}</p>
                            <p className="text-xs opacity-75">
                                {formatCurrency(stats?.pendingPayoutAmount || 0)} total
                            </p>
                        </div>
                    </Card>

                    {/* System Status */}
                    <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-lg">
                                <Activity className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-medium bg-green-400 px-3 py-1 rounded-full">
                                {stats?.systemStatus || 'ONLINE'}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm opacity-90">System Status</p>
                            <p className="text-3xl font-bold">{stats?.uptime || '99.9'}%</p>
                            <div className="flex items-center gap-2 text-xs opacity-75">
                                <button className="hover:underline">Reboot</button>
                                <span>•</span>
                                <button className="hover:underline">System Update</button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Analytics */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Revenue Analytics
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Last 7 days performance
                                </p>
                            </div>
                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                                Simulated Data
                            </span>
                        </div>
                        <div className="h-64 flex items-end justify-between gap-2">
                            {[65, 45, 78, 52, 90, 67, 85].map((height, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <div
                                        className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg transition-all hover:from-indigo-600 hover:to-indigo-500 cursor-pointer"
                                        style={{ height: `${height}%` }}
                                    ></div>
                                    <span className="text-xs text-gray-500">
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Live Traffic */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Live Traffic
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Active users by hour
                                </p>
                            </div>
                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                                Simulated Data
                            </span>
                        </div>
                        <div className="h-64 flex items-end justify-between gap-2">
                            {[120, 450, 890, 1100, 650, 320].map((value, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <div
                                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-500 cursor-pointer"
                                        style={{ height: `${(value / 1200) * 100}%` }}
                                    ></div>
                                    <span className="text-xs text-gray-500">
                                        {['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'][i]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Recent Transactions */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Recent Transactions Log
                        </h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/transactions')}
                        >
                            View All
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">TIME</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">USER</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">ACTION</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">AMOUNT</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTransactions.length > 0 ? (
                                    recentTransactions.map((transaction: any) => (
                                        <tr key={transaction.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                                {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                                                {transaction.initiator?.name || transaction.initiator?.email || 'System'}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                                {transaction.type.replace(/_/g, ' ')}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900 dark:text-white">
                                                {formatCurrency(Number(transaction.amount))}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                                                    {transaction.status === 'COMPLETED' && <CheckCircle className="w-3 h-3" />}
                                                    {transaction.status === 'PENDING' && <Clock className="w-3 h-3" />}
                                                    {transaction.status === 'FAILED' && <XCircle className="w-3 h-3" />}
                                                    {transaction.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                                            No recent transactions
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Recent Users */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Recent User Registrations
                        </h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/admin/users')}
                        >
                            Manage Users
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {recentUsers.length > 0 ? (
                            recentUsers.map((user: any) => (
                                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                            {user.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{user.role}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                                            {user.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                                No recent users
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </DashboardLayout >
    );
}
