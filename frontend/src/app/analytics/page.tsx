'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import {
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Users,
    Package,
    Download,
    Calendar,
    BarChart3,
    PieChart,
    Activity
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [salesData, setSalesData] = useState<any>(null);
    const [productData, setProductData] = useState<any>(null);
    const [customerData, setCustomerData] = useState<any>(null);
    const [financialData, setFinancialData] = useState<any>(null);
    const [inventoryData, setInventoryData] = useState<any>(null);
    const [teamData, setTeamData] = useState<any>(null);
    const [businessProfile, setBusinessProfile] = useState<any>(null);
    const { showToast } = useToast();

    useEffect(() => {
        fetchAnalytics();
        fetchBusinessProfile();
    }, [dateRange]);

    const fetchBusinessProfile = async () => {
        try {
            const response = await api.get('/profile/business');
            setBusinessProfile(response.data);
        } catch (error) {
            console.error('Failed to fetch business profile');
        }
    };

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const [sales, products, customers, financial, inventory, team] = await Promise.all([
                api.get(`/analytics/sales-overview?startDate=${dateRange.start}&endDate=${dateRange.end}`),
                api.get(`/analytics/product-performance?startDate=${dateRange.start}&endDate=${dateRange.end}`),
                api.get('/analytics/customer-insights'),
                api.get(`/analytics/financial-metrics?startDate=${dateRange.start}&endDate=${dateRange.end}`),
                api.get('/analytics/inventory-status'),
                api.get(`/analytics/team-performance?startDate=${dateRange.start}&endDate=${dateRange.end}`)
            ]);

            setSalesData(sales.data);
            setProductData(products.data);
            setCustomerData(customers.data);
            setFinancialData(financial.data);
            setInventoryData(inventory.data);
            setTeamData(team.data);
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to load analytics', 'error');
        } finally {
            setLoading(false);
        }
    };

    const exportReport = async (format: 'pdf' | 'excel') => {
        try {
            if (format === 'pdf') {
                const { pdf } = await import('@react-pdf/renderer');
                const { AnalyticsReportPDF } = await import('@/components/pdf/AnalyticsReportPDF');

                const blob = await pdf(
                    <AnalyticsReportPDF
                        businessProfile={businessProfile}
                        salesData={salesData}
                        productData={productData}
                        customerData={customerData}
                        financialData={financialData}
                        inventoryData={inventoryData}
                        teamData={teamData}
                        dateRange={dateRange}
                    />
                ).toBlob();

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Analytics-Report-${dateRange.start}-to-${dateRange.end}.pdf`;
                link.click();
                URL.revokeObjectURL(url);

                showToast('PDF report downloaded successfully!', 'success');
            } else {
                showToast('Excel export coming soon!', 'info');
            }
        } catch (error) {
            console.error('Export error:', error);
            showToast('Export failed', 'error');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES'
        }).format(amount);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <FeatureGate feature="analytics">
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading analytics...</p>
                        </div>
                    </div>
                </FeatureGate>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <FeatureGate feature="analytics">
                <div className="max-w-7xl mx-auto pb-12">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Analytics & Reports
                            </h1>
                            <p className="text-gray-500 mt-1">Comprehensive business insights and performance metrics</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => exportReport('pdf')}
                                className="flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export PDF
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => exportReport('excel')}
                                className="flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export Excel
                            </Button>
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <Card className="mb-6 p-4">
                        <div className="flex items-center gap-4">
                            <Calendar className="w-5 h-5 text-gray-500" />
                            <div className="flex gap-4 items-center flex-1">
                                <div>
                                    <label className="text-sm text-gray-600 dark:text-gray-400">From</label>
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                        className="block mt-1 px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600 dark:text-gray-400">To</label>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                        className="block mt-1 px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
                                    />
                                </div>
                                <Button onClick={fetchAnalytics} className="mt-6">
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Card className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                        {formatCurrency(salesData?.summary?.totalRevenue || 0)}
                                    </p>
                                </div>
                                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                        {salesData?.summary?.totalTransactions || 0}
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                                    <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Order Value</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                        {formatCurrency(salesData?.summary?.averageOrderValue || 0)}
                                    </p>
                                </div>
                                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                                    <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Gross Profit</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                        {formatCurrency(financialData?.grossProfit || 0)}
                                    </p>
                                </div>
                                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                                    <Activity className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Revenue Trend */}
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                                <h3 className="text-lg font-semibold">Revenue Trend</h3>
                            </div>
                            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-gray-500">Chart visualization coming soon</p>
                            </div>
                        </Card>

                        {/* Payment Methods */}
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <PieChart className="w-5 h-5 text-purple-600" />
                                <h3 className="text-lg font-semibold">Payment Methods</h3>
                            </div>
                            <div className="space-y-3">
                                {salesData?.paymentMethods && Object.entries(salesData.paymentMethods).map(([method, count]: [string, any]) => (
                                    <div key={method} className="flex items-center justify-between">
                                        <span className="text-gray-600 dark:text-gray-400 capitalize">{method}</span>
                                        <span className="font-semibold">{count} transactions</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Top Products */}
                    <Card className="p-6 mb-8">
                        <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b dark:border-gray-700">
                                        <th className="text-left py-3 px-4">Product</th>
                                        <th className="text-left py-3 px-4">Category</th>
                                        <th className="text-right py-3 px-4">Quantity Sold</th>
                                        <th className="text-right py-3 px-4">Revenue</th>
                                        <th className="text-right py-3 px-4">Profit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productData?.topProducts?.map((product: any, index: number) => (
                                        <tr key={index} className="border-b dark:border-gray-700">
                                            <td className="py-3 px-4">{product.name}</td>
                                            <td className="py-3 px-4">{product.category}</td>
                                            <td className="text-right py-3 px-4">{product.quantity}</td>
                                            <td className="text-right py-3 px-4">{formatCurrency(product.revenue)}</td>
                                            <td className="text-right py-3 px-4 text-green-600">{formatCurrency(product.profit)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Customer Insights & Inventory */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Customers */}
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Users className="w-5 h-5 text-blue-600" />
                                <h3 className="text-lg font-semibold">Top Customers</h3>
                            </div>
                            <div className="space-y-3">
                                {customerData?.topCustomers?.slice(0, 5).map((customer: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div>
                                            <p className="font-medium">{customer.customer}</p>
                                            <p className="text-sm text-gray-500">{customer.transactionCount} purchases</p>
                                        </div>
                                        <p className="font-semibold text-green-600">{formatCurrency(customer.totalSpent)}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Inventory Status */}
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Package className="w-5 h-5 text-orange-600" />
                                <h3 className="text-lg font-semibold">Inventory Status</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">Total Products</span>
                                    <span className="font-semibold">{inventoryData?.totalProducts || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">Low Stock Items</span>
                                    <span className="font-semibold text-yellow-600">{inventoryData?.lowStockItems || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">Out of Stock</span>
                                    <span className="font-semibold text-red-600">{inventoryData?.outOfStockItems || 0}</span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t dark:border-gray-700">
                                    <span className="text-gray-600 dark:text-gray-400">Total Inventory Value</span>
                                    <span className="font-semibold text-green-600">{formatCurrency(inventoryData?.totalInventoryValue || 0)}</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </FeatureGate>
        </DashboardLayout>
    );
}
