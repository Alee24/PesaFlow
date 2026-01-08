'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import {
    TrendingUp,
    Calendar,
    CreditCard,
    Filter,
    Download,
    Eye,
    ShoppingBag,
    User,
    DollarSign,
    Percent
} from 'lucide-react';
import { ReceiptModal } from '@/components/pos/ReceiptModal';

export default function SalesPage() {
    const [sales, setSales] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('ALL');
    const [selectedSale, setSelectedSale] = useState<any>(null);

    useEffect(() => {
        fetchSales();
        fetchStats();
    }, []);

    const fetchSales = async () => {
        setLoading(true);
        try {
            let url = '/sales';
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', new Date(startDate).toISOString());
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                params.append('endDate', end.toISOString());
            }
            if (paymentMethod && paymentMethod !== 'ALL') params.append('paymentMethod', paymentMethod);

            if (params.toString()) url += `?${params.toString()}`;

            const res = await api.get(url);
            setSales(res.data);
        } catch (error) {
            console.error("Failed to fetch sales", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            let url = '/sales/stats';
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', new Date(startDate).toISOString());
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                params.append('endDate', end.toISOString());
            }
            if (params.toString()) url += `?${params.toString()}`;

            const res = await api.get(url);
            setStats(res.data);
        } catch (error) {
            console.error("Failed to fetch stats", error);
        }
    };

    const handleFilter = () => {
        fetchSales();
        fetchStats();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales History</h1>
                        <p className="text-gray-500 text-sm">Detailed record of all transactions and performance</p>
                    </div>
                    {/* Add Export functionality later if needed */}
                </header>

                {/* Filters */}
                <Card className="border border-gray-100 dark:border-gray-700 shadow-sm p-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 text-sm"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 text-sm"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500">Payment Method</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 text-sm bg-white dark:bg-gray-800"
                            >
                                <option value="ALL">All Methods</option>
                                <option value="CASH">Cash</option>
                                <option value="MPESA_STK">M-Pesa</option>
                                <option value="SPLIT">Split</option>
                            </select>
                        </div>
                        <Button onClick={handleFilter} className="flex items-center gap-2 h-[38px] mt-auto">
                            <Filter className="w-4 h-4" /> Filter
                        </Button>
                        {(startDate || endDate || paymentMethod !== 'ALL') && (
                            <Button
                                variant="ghost"
                                onClick={() => { setStartDate(''); setEndDate(''); setPaymentMethod('ALL'); setTimeout(() => handleFilter(), 0); }}
                                className="h-[38px] text-gray-500"
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </Card>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="p-4 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">Total Sales</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalSales}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">Revenue</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalRevenue)}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600">
                                    <Percent className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">Avg. Sale</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.averageSale)}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">Discounts</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalDiscount)}</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Sales Table */}
                <Card className="border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                    <th className="py-4 px-6 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">Date</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">Customer</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">Items</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">Method</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold uppercase text-[10px] tracking-wider text-right">Total</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold uppercase text-[10px] tracking-wider text-center">Status</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold uppercase text-[10px] tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center py-12 text-gray-500">Loading sales history...</td></tr>
                                ) : sales.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-12 text-gray-500">No sales found for this period.</td></tr>
                                ) : (
                                    sales.map((sale) => (
                                        <tr key={sale.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="py-4 px-6 text-gray-700 dark:text-gray-300">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {new Date(sale.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(sale.createdAt).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            {sale.customerName || 'Walk-in Customer'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">{sale.customerPhone || '-'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex -space-x-2">
                                                    {sale.items.length > 0 && sale.items.slice(0, 3).map((item: any) => (
                                                        <div key={item.id} className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-bold text-gray-600 shadow-sm" title={item.product?.name}>
                                                            {item.quantity}
                                                        </div>
                                                    ))}
                                                    {sale.items.length > 3 && (
                                                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                            +{sale.items.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 font-medium text-gray-700 dark:text-gray-300">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${sale.paymentMethod === 'CASH' ? 'bg-green-100 text-green-700' :
                                                        sale.paymentMethod === 'MPESA_STK' ? 'bg-green-100 text-green-700' :
                                                            'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {sale.paymentMethod.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right font-bold text-gray-900 dark:text-white">
                                                {formatCurrency(Number(sale.totalAmount))}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${sale.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                                                        sale.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                    }`}>
                                                    {sale.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedSale(sale)}
                                                    className="h-8 px-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                >
                                                    <Eye className="w-3.5 h-3.5 mr-1" /> View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Receipt Modal */}
            {selectedSale && (
                <ReceiptModal
                    onClose={() => setSelectedSale(null)}
                    sale={selectedSale}
                />
            )}
        </DashboardLayout>
    );
}
