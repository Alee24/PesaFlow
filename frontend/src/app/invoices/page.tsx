'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileText, Eye, Download, Plus } from 'lucide-react';
import api from '@/lib/api';

interface Invoice {
    id: string;
    createdAt: string;
    amount: string;
    reference: string;
    status: string;
    initiator: {
        email: string;
    };
}

export default function InvoicesListPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [res, statsRes] = await Promise.all([
                api.get('/transactions'),
                api.get('/dashboard/invoices-stats')
            ]);

            // Filter STK (POS) and INVOICE types
            const list = res.data.filter((tx: any) => tx.type === 'DEPOSIT_STK' || tx.type === 'INVOICE' || tx.type === 'SALE_CREDIT');
            setInvoices(list);
            setStats(statsRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatus = (invoice: any) => {
        if (invoice.status === 'COMPLETED' || invoice.status === 'PAID') return 'PAID';
        if (invoice.status === 'CANCELLED') return 'CANCELLED';

        const date = new Date(invoice.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 30) return 'OVERDUE';
        return 'PENDING';
    };

    const filteredInvoices = invoices.filter(inv => {
        const status = getStatus(inv);
        if (filter === 'ALL') return true;
        return status === filter;
    });

    const StatCard = ({ title, value, subValue, type, active, onClick }: any) => (
        <div
            onClick={onClick}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${active
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                    : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm dark:bg-gray-800 dark:border-gray-700'
                }`}
        >
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${active ? 'text-indigo-600' : 'text-gray-500 dark:text-gray-400'
                }`}>{title}</h3>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {value}
            </div>
            <div className="text-xs text-gray-500 mt-1">
                {subValue}
            </div>
        </div>
    );

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full space-y-6">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1>
                        <p className="text-gray-500">Manage your invoices and payments</p>
                    </div>
                    <Link href="/invoices/new">
                        <Button className="flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Create Invoice
                        </Button>
                    </Link>
                </header>

                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <StatCard
                            title="Total Invoices"
                            value={stats.total.count}
                            subValue={`KES ${Number(stats.total.amount).toLocaleString()}`}
                            active={filter === 'ALL'}
                            onClick={() => setFilter('ALL')}
                        />
                        <StatCard
                            title="Paid"
                            value={stats.paid.count}
                            subValue={`KES ${Number(stats.paid.amount).toLocaleString()}`}
                            active={filter === 'PAID'}
                            onClick={() => setFilter('PAID')}
                        />
                        <StatCard
                            title="Pending"
                            value={stats.pending.count}
                            subValue={`KES ${Number(stats.pending.amount).toLocaleString()}`}
                            active={filter === 'PENDING'}
                            onClick={() => setFilter('PENDING')}
                        />
                        <StatCard
                            title="Overdue"
                            value={stats.overdue.count}
                            subValue={`KES ${Number(stats.overdue.amount).toLocaleString()}`}
                            active={filter === 'OVERDUE'}
                            onClick={() => setFilter('OVERDUE')}
                        />
                        <StatCard
                            title="Cancelled"
                            value={stats.cancelled.count}
                            subValue={`KES ${Number(stats.cancelled.amount).toLocaleString()}`}
                            active={filter === 'CANCELLED'}
                            onClick={() => setFilter('CANCELLED')}
                        />
                    </div>
                )}

                <Card className="flex-1 overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-700 dark:text-gray-300">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Reference</th>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Amount</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center">Loading invoices...</td>
                                    </tr>
                                ) : filteredInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center">No invoices found.</td>
                                    </tr>
                                ) : (
                                    filteredInvoices.map((invoice) => {
                                        const status = getStatus(invoice);
                                        return (
                                            <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                    {invoice.reference || invoice.id.slice(0, 8).toUpperCase()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {new Date(invoice.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                                                    KES {Number(invoice.amount).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'PAID'
                                                        ? 'bg-green-100 text-green-800'
                                                        : status === 'OVERDUE'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link href={`/invoices/${invoice.id}`}>
                                                        <Button size="sm" variant="secondary" className="gap-2">
                                                            <Eye className="w-4 h-4" /> View
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
