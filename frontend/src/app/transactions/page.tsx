'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Download, Filter, Receipt, Eye } from 'lucide-react';
import dynamic from 'next/dynamic';
import TransactionsPDF from '@/components/pdf/TransactionsPDF';
import ReceiptPDF from '@/components/pdf/ReceiptPDF';
import { Modal } from '@/components/ui/Modal';

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
    const [selectedTx, setSelectedTx] = useState<any>(null);

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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
                        <p className="text-gray-500 text-sm">History of all payments and earnings</p>
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
                                <option value="PAID">Paid</option>
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
                                    <th className="py-4 px-6 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">Date</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">Type</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">Reference</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">Paid By</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold uppercase text-[10px] tracking-wider text-right">Amount</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold uppercase text-[10px] tracking-wider text-center">Status</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold uppercase text-[10px] tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center py-12 text-gray-500">Loading transactions...</td></tr>
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-12 text-gray-500">No transactions found for this period.</td></tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="py-4 px-6 text-gray-700 dark:text-gray-300">
                                                {new Date(tx.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                            </td>
                                            <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">
                                                <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                                    {tx.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 font-mono text-xs text-gray-500">{tx.reference || '-'}</td>
                                            <td className="py-4 px-6 text-gray-600 dark:text-gray-400 font-mono text-xs">{getPhoneNumber(tx)}</td>
                                            <td className={`py-4 px-6 text-right font-bold ${tx.type === 'WITHDRAWAL' || tx.type.includes('FEE') ? 'text-red-600' : 'text-green-600'}`}>
                                                {tx.type === 'WITHDRAWAL' || tx.type.includes('FEE') ? '-' : '+'} {formatCurrency(Number(tx.amount))}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${tx.status === 'COMPLETED' || tx.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                                    tx.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <Button variant="ghost" size="sm" onClick={() => setSelectedTx(tx)} className="h-8 px-2">
                                                    <Eye className="w-3.5 h-3.5 mr-1" /> Details
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

            <Modal isOpen={!!selectedTx} onClose={() => setSelectedTx(null)} title="Transaction Details">
                {selectedTx && (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-start border-b dark:border-gray-700 pb-4">
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">REFERENCE</p>
                                <p className="text-sm font-mono font-bold text-gray-900 dark:text-white uppercase">
                                    {selectedTx.reference || selectedTx.id.split('-')[0]}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${selectedTx.status === 'COMPLETED' || selectedTx.status === 'PAID' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                                    }`}>
                                    {selectedTx.status}
                                </span>
                                {isClient && (
                                    <PDFDownloadLink
                                        document={<ReceiptPDF transaction={selectedTx} />}
                                        fileName={`Receipt_${selectedTx.reference || selectedTx.id.split('-')[0]}.pdf`}
                                    >
                                        {({ loading }) => (
                                            <button className="text-[10px] font-bold text-indigo-600 hover:text-indigo-500 underline flex items-center gap-1">
                                                <Download className="w-3 h-3" />
                                                {loading ? 'Generating...' : 'Download PDF Receipt'}
                                            </button>
                                        )}
                                    </PDFDownloadLink>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-inner">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                    <Receipt className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">
                                        {selectedTx.sale ? 'Purchase Receipt' : 'Payment Information'}
                                    </h4>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                        {new Date(selectedTx.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {selectedTx.sale ? (
                                <div className="space-y-4">
                                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                        {selectedTx.sale.items.map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-sm group">
                                                <div className="flex-1">
                                                    <p className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 transition-colors">
                                                        {item.product?.name || 'Item'}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-medium">
                                                        {item.quantity} units @ {formatCurrency(Number(item.unitPrice))}
                                                    </p>
                                                </div>
                                                <p className="font-mono font-bold text-gray-900 dark:text-white">
                                                    {formatCurrency(Number(item.subtotal))}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t-2 border-dashed border-gray-200 dark:border-gray-700 mt-4">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-black text-gray-500 uppercase tracking-widest">Total</p>
                                            <p className="text-2xl font-black text-indigo-600 tracking-tighter">
                                                {formatCurrency(Number(selectedTx.amount))}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-medium uppercase text-[10px] tracking-wider">Type</span>
                                        <span className="font-bold text-gray-900 dark:text-white uppercase">{selectedTx.type.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-medium uppercase text-[10px] tracking-wider">Amount</span>
                                        <span className={`font-black text-lg ${selectedTx.type === 'WITHDRAWAL' ? 'text-red-600' : 'text-green-600'}`}>
                                            {selectedTx.type === 'WITHDRAWAL' ? '-' : '+'} {formatCurrency(Number(selectedTx.amount))}
                                        </span>
                                    </div>
                                    {selectedTx.feeCharged > 0 && (
                                        <div className="flex justify-between items-center text-sm text-red-500">
                                            <span className="font-medium uppercase text-[10px] tracking-wider">Processing Fee</span>
                                            <span className="font-bold">-{formatCurrency(Number(selectedTx.feeCharged))}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button onClick={() => setSelectedTx(null)} className="w-full h-12 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all border-none">
                                Done
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </DashboardLayout>
    );
}
