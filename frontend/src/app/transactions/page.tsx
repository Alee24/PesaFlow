
'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Download, Filter } from 'lucide-react';
import dynamic from 'next/dynamic';
import TransactionsPDF from '@/components/pdf/TransactionsPDF';

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    { ssr: false, loading: () => <Button disabled size="sm">Loading PDF...</Button> }
);


export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState('ALL');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        fetchTx();
    }, []);

    const fetchTx = async () => {
        setLoading(true);
        try {
            let url = '/transactions';
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', new Date(startDate).toISOString());
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                params.append('endDate', end.toISOString());
            }
            if (status && status !== 'ALL') params.append('status', status);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const res = await api.get(url);
            setTransactions(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getPhoneNumber = (tx: any) => {
        try {
            if (typeof tx.metadata === 'string') {
                const meta = JSON.parse(tx.metadata);
                return meta.phoneNumber || meta.clientPhone || meta.mpesaNumber || '-';
            }
            return tx.metadata?.phoneNumber || tx.metadata?.clientPhone || '-';
        } catch (e) {
            return '-';
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
                        <p className="text-gray-500 text-sm">History of all payments</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {isClient && (
                            <PDFDownloadLink
                                document={<TransactionsPDF transactions={transactions} startDate={startDate} endDate={endDate} />}
                                fileName={`Transactions_${startDate || 'All'}_to_${endDate || 'Present'}.pdf`}
                            >
                                {({ loading }) => (
                                    <Button disabled={loading} variant="outline" className="flex items-center gap-2">
                                        <Download className="w-4 h-4" />
                                        {loading ? 'Preparing...' : 'Download Report'}
                                    </Button>
                                )}
                            </PDFDownloadLink>
                        )}
                    </div>
                </header>

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
                            <label className="text-xs font-semibold text-gray-500">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 text-sm bg-white dark:bg-gray-800"
                            >
                                <option value="ALL">All Status</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="PENDING">Pending</option>
                                <option value="FAILED">Failed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>
                        <Button onClick={fetchTx} className="flex items-center gap-2 h-[38px] mt-auto">
                            <Filter className="w-4 h-4" /> Filter
                        </Button>
                        {(startDate || endDate) && (
                            <Button
                                variant="ghost"
                                onClick={() => { setStartDate(''); setEndDate(''); fetchTx(); }}
                                className="h-[38px] text-gray-500"
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </Card>

                <Card className="border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                    <th className="py-4 px-6 text-gray-500 font-semibold">Date</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold">Type</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold">Ref</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold">Paid By (Phone)</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold text-right">Amount</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-12 text-gray-500">Loading transactions...</td></tr>
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-12 text-gray-500">No transactions found for this period.</td></tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="py-4 px-6 text-gray-700 dark:text-gray-300">{new Date(tx.createdAt).toLocaleString()}</td>
                                            <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">{tx.type}</td>
                                            <td className="py-4 px-6 font-mono text-xs text-gray-500">{tx.reference || '-'}</td>
                                            <td className="py-4 px-6 text-gray-600 dark:text-gray-400 font-mono text-xs">{getPhoneNumber(tx)}</td>
                                            <td className={`py-4 px-6 text-right font-bold ${tx.type === 'WITHDRAWAL' ? 'text-red-600' : 'text-green-600'}`}>
                                                {tx.type === 'WITHDRAWAL' ? '-' : '+'} KES {Number(tx.amount).toLocaleString()}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                    tx.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
