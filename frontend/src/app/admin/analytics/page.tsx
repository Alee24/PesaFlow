'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';
import { DollarSign, ShoppingCart, Users, TrendingUp, Award } from 'lucide-react';

export default function AdminAnalyticsPage() {
    const [overview, setOverview] = useState<any>(null);
    const [merchants, setMerchants] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const [overviewRes, merchantsRes, productsRes] = await Promise.all([
                api.get('/admin/analytics/overview'),
                api.get('/admin/analytics/merchants?limit=10'),
                api.get('/admin/analytics/products?limit=10')
            ]);

            setOverview(overviewRes.data);
            setMerchants(merchantsRes.data);
            setProducts(productsRes.data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-gray-500">Loading analytics...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                <header>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Analytics</h1>
                    <p className="text-gray-500 text-sm">System-wide performance metrics</p>
                </header>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(overview?.totalRevenue || 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Transactions</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {overview?.totalTransactions || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                <ShoppingCart className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Active Merchants</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {overview?.totalMerchants || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Success Rate</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {overview?.successRate || 0}%
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Top Merchants */}
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-500" />
                        Top Performing Merchants
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Merchant</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Revenue</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Transactions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {merchants.map((merchant, i) => (
                                    <tr key={merchant.id} className="border-b border-gray-100 dark:border-gray-800">
                                        <td className="py-3 px-4">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{merchant.name}</p>
                                                <p className="text-xs text-gray-500">{merchant.email}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-green-600">
                                            {formatCurrency(merchant.totalRevenue)}
                                        </td>
                                        <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                                            {merchant.transactionCount}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Top Products */}
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Top Selling Products</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Product</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Qty Sold</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.productId} className="border-b border-gray-100 dark:border-gray-800">
                                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                                            {product.name}
                                        </td>
                                        <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                                            {product.quantitySold}
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-green-600">
                                            {formatCurrency(product.revenue)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
