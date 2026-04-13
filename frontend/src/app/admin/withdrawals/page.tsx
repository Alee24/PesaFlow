
'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import Toast from '@/components/ui/Toast';
import { Check, X, Clock, User, Phone, Wallet as WalletIcon } from 'lucide-react';

export default function AdminWithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success' | 'error' | 'info' });

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const fetchWithdrawals = async () => {
        try {
            setLoading(true);
            const res = await api.get('/withdrawals/all');
            setWithdrawals(res.data);
        } catch (error) {
            console.error(error);
            showToast("Failed to load withdrawals", 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    const handleApprove = async (id: string) => {
        if (!confirm("Are you sure you want to approve this withdrawal? This will record the payout.")) return;

        setActionLoading(id);
        try {
            await api.post(`/withdrawals/${id}/approve`);
            showToast("Withdrawal approved!", 'success');
            fetchWithdrawals();
        } catch (error: any) {
            showToast(error.response?.data?.error || "Failed to approve", 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt("Enter reason for rejection (this will be logged):");
        if (reason === null) return;

        setActionLoading(id);
        try {
            await api.post(`/withdrawals/${id}/reject`, { reason });
            showToast("Withdrawal rejected and funds refunded", 'info');
            fetchWithdrawals();
        } catch (error: any) {
            showToast(error.response?.data?.error || "Failed to reject", 'error');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <DashboardLayout>
            <Toast {...toast} onClose={() => setToast(prev => ({ ...prev, visible: false }))} />

            <div className="space-y-6">
                <header>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Withdrawal Requests</h1>
                    <p className="text-gray-500">Review and process merchant withdrawal requests.</p>
                </header>

                <div className="grid gap-6">
                    {loading ? (
                        <div className="py-20 text-center text-gray-500">Loading requests...</div>
                    ) : withdrawals.length === 0 ? (
                        <Card className="p-12 text-center text-gray-500">No withdrawal requests found.</Card>
                    ) : (
                        withdrawals.map((w) => (
                            <Card key={w.id} className="p-6 relative overflow-hidden group">
                                <div className={`absolute top-0 left-0 w-1 h-full ${w.status === 'PENDING' ? 'bg-yellow-400' :
                                        w.status === 'COMPLETED' ? 'bg-green-500' :
                                            'bg-red-500'
                                    }`} />

                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                                                <WalletIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    KES {Number(w.amount).toLocaleString()}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Fee: KES {Number(w.fee).toLocaleString()} | Total Deducted: KES {(Number(w.amount) + Number(w.fee)).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                <User className="w-4 h-4 opacity-50" />
                                                <span className="font-medium">{w.wallet.user.name || w.wallet.user.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                <Phone className="w-4 h-4 opacity-50" />
                                                <span>{w.mpesaNumber}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                <Clock className="w-4 h-4 opacity-50" />
                                                <span>{new Date(w.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-3 min-w-[150px]">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${w.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                w.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                    'bg-red-100 text-red-800'
                                            }`}>
                                            {w.status}
                                        </div>

                                        {w.status === 'PENDING' && (
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleReject(w.id)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                    isLoading={actionLoading === w.id}
                                                >
                                                    <X className="w-4 h-4 mr-1" /> Reject
                                                </Button>
                                                <Button
                                                    onClick={() => handleApprove(w.id)}
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    isLoading={actionLoading === w.id}
                                                >
                                                    <Check className="w-4 h-4 mr-1" /> Approve
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
