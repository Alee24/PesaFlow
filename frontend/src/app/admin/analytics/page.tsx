'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { DollarSign, ShoppingCart, Users, TrendingUp, Award, Download, Calendar, PieChart as PieChartIcon, Globe, MapPin, Clock } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminAnalyticsPage() {
    const [overview, setOverview] = useState<any>(null);
    const [merchants, setMerchants] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [trends, setTrends] = useState<any[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [visitors, setVisitors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ days: 30 });

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const [overviewRes, merchantsRes, productsRes, trendsRes, paymentRes, visitorsRes] = await Promise.all([
                api.get('/admin/analytics/overview'),
                api.get('/admin/analytics/merchants?limit=10'),
                api.get('/admin/analytics/products?limit=10'),
                api.get(`/admin/analytics/trends?days=${dateRange.days}`),
                api.get('/admin/analytics/payment-methods'),
                api.get('/analytics/visitors') // Fetch visitors
            ]);

            setOverview(overviewRes.data);
            setMerchants(merchantsRes.data);
            setProducts(productsRes.data);
            setTrends(trendsRes.data);
            setVisitors(visitorsRes.data || []);

            // Process payment methods for pie chart
            const methodMap = new Map();
            paymentRes.data.forEach((item: any) => {
                if (item.status === 'PAID') {
                    const current = methodMap.get(item.method) || 0;
                    methodMap.set(item.method, current + item.revenue);
                }
            });

            const pieData = Array.from(methodMap.entries()).map(([name, value]) => ({
                name: name.replace('_', ' '),
                value
            }));
            setPaymentMethods(pieData);

        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);
    };

    const exportToCSV = () => {
        const csvData = [
            ['Merchant Analytics Report'],
            ['Generated:', new Date().toLocaleString()],
            [''],
            ['Top Merchants'],
            ['Name', 'Email', 'Revenue', 'Transactions'],
            ...merchants.map(m => [m.name, m.email, m.totalRevenue, m.transactionCount]),
            [''],
            ['Top Products'],
            ['Product', 'Quantity Sold', 'Revenue'],
            ...products.map(p => [p.name, p.quantitySold, p.revenue])
        ];

        const csv = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-pulse text-gray-500">Loading analytics...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Analytics</h1>
                        <p className="text-gray-500 text-sm mt-1">Comprehensive platform performance metrics</p>
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={dateRange.days}
                            onChange={(e) => setDateRange({ days: parseInt(e.target.value) })}
                            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                        >
                            <option value={7}>Last 7 days</option>
                            <option value={30}>Last 30 days</option>
                            <option value={90}>Last 90 days</option>
                        </select>
                        <Button onClick={exportToCSV} variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </header>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-6 bg-gradient-to-br from-green-50 to-white dark:from-green-900/10 dark:to-gray-800 border-green-200 dark:border-green-900/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Revenue</p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                                    {formatCurrency(overview?.totalRevenue || 0)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">All-time earnings</p>
                            </div>
                            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                                <DollarSign className="w-7 h-7 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-gray-800 border-blue-200 dark:border-blue-900/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Transactions</p>
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                                    {overview?.totalTransactions?.toLocaleString() || 0}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Total processed</p>
                            </div>
                            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                                <ShoppingCart className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-gray-800 border-purple-200 dark:border-purple-900/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Active Merchants</p>
                                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                                    {overview?.totalMerchants || 0}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Registered users</p>
                            </div>
                            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center">
                                <Users className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900/10 dark:to-gray-800 border-yellow-200 dark:border-yellow-900/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Success Rate</p>
                                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                                    {overview?.successRate || 0}%
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Payment success</p>
                            </div>
                            <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center">
                                <TrendingUp className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Trend */}
                    <Card className="p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            Revenue Trend
                        </h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={trends}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                                <YAxis stroke="#6b7280" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                    formatter={(value: any) => formatCurrency(value)}
                                />
                                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Payment Methods */}
                    <Card className="p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <PieChartIcon className="w-5 h-5 text-purple-500" />
                            Payment Methods
                        </h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={paymentMethods}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {paymentMethods.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </div>

                {/* Top Merchants */}
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-500" />
                        Top Performing Merchants
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300">Rank</th>
                                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300">Merchant</th>
                                    <th className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300">Revenue</th>
                                    <th className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300">Transactions</th>
                                    <th className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300">Avg Order</th>
                                </tr>
                            </thead>
                            <tbody>
                                {merchants.map((merchant, i) => (
                                    <tr key={merchant.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="py-4 px-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                i === 1 ? 'bg-gray-100 text-gray-700' :
                                                    i === 2 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-gray-50 text-gray-600'
                                                }`}>
                                                {i + 1}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{merchant.name}</p>
                                                <p className="text-xs text-gray-500">{merchant.email}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="font-bold text-green-600 dark:text-green-400">
                                                {formatCurrency(merchant.totalRevenue)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right text-gray-700 dark:text-gray-300 font-medium">
                                            {merchant.transactionCount}
                                        </td>
                                        <td className="py-4 px-4 text-right text-gray-600 dark:text-gray-400">
                                            {formatCurrency(merchant.totalRevenue / merchant.transactionCount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Top Products */}
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Best Selling Products</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300">Product</th>
                                    <th className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300">Units Sold</th>
                                    <th className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300">Revenue</th>
                                    <th className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300">Sales</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.productId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="py-4 px-4 font-semibold text-gray-900 dark:text-white">
                                            {product.name}
                                        </td>
                                        <td className="py-4 px-4 text-right text-gray-700 dark:text-gray-300 font-medium">
                                            {product.quantitySold}
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="font-bold text-green-600 dark:text-green-400">
                                                {formatCurrency(product.revenue)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right text-gray-600 dark:text-gray-400">
                                            {product.salesCount}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Live Site Visitors */}
                <Card className="p-6 mt-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-emerald-500" />
                        Live Site Visitors
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300">IP Address</th>
                                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300">Path</th>
                                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300">Time Spent</th>
                                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300">Location</th>
                                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300">Last Active</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visitors.map((visitor, index) => (
                                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="py-4 px-4 text-sm text-gray-900 dark:text-gray-300 font-medium">{visitor.ip || 'Unknown'}</td>
                                        <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {visitor.path}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            {visitor.timeSpent}s
                                        </td>
                                        <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                {visitor.location || 'Unknown'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(visitor.updatedAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {visitors.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                            No recent visitors found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
