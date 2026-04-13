'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Globe, CreditCard, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Send, Download } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

export default function KCBIntegrationPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        kcbConsumerKey: '',
        kcbConsumerSecret: '',
        kcbEnv: 'sandbox',
        bankDetails: ''
    });

    useEffect(() => {
        fetchProfile();
        fetchHistory();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/profile');
            setFormData({
                kcbConsumerKey: res.data.kcbConsumerKey || '',
                kcbConsumerSecret: res.data.kcbConsumerSecret || '',
                kcbEnv: res.data.kcbEnv || 'sandbox',
                bankDetails: res.data.bankDetails || ''
            });
        } catch (error) {
            console.error('Failed to fetch profile', error);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get('/transactions?type=WITHDRAWAL');
            // Filter only KCB transactions if metadata indicates provider
            const kcbTrans = res.data.filter((t: any) => {
                try {
                    const meta = JSON.parse(t.metadata || '{}');
                    return meta.provider === 'KCB';
                } catch { return false; }
            });
            setHistory(kcbTrans);
        } catch (error) {
            console.error('Failed to fetch history', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/profile', formData);
            showToast('KCB Settings Saved Successfully', 'success');
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to save settings', 'error');
        } finally {
            setLoading(true);
            setTimeout(() => setLoading(false), 500);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        try {
            const res = await api.post('/banks/test', { provider: 'KCB' });
            showToast(res.data.message || 'KCB Connection Successful!', 'success');
        } catch (error: any) {
            showToast(error.response?.data?.error || 'KCB Connection Failed', 'error');
        } finally {
            setTesting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-sm font-bold text-green-600 uppercase tracking-widest">Premium Integration</h2>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">KCB Bank (Buni Portal)</h1>
                        <p className="text-gray-500 mt-2 max-w-2xl">Configure and manage your KCB Buni API for high-speed interbank PesaLink transfers and bulk disbursements.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Configuration Card */}
                    <div className="lg:col-span-1">
                        <Card className="p-6 border-none shadow-xl sticky top-24">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-green-600" />
                                API Proxy Setup
                            </h3>
                            <form onSubmit={handleSave} className="space-y-6">
                                <Input 
                                    label="Consumer Key" 
                                    name="kcbConsumerKey" 
                                    value={formData.kcbConsumerKey} 
                                    onChange={handleChange} 
                                    type="password"
                                    placeholder="Enter Buni Application Key"
                                />
                                <Input 
                                    label="Consumer Secret" 
                                    name="kcbConsumerSecret" 
                                    value={formData.kcbConsumerSecret} 
                                    onChange={handleChange} 
                                    type="password"
                                    placeholder="Enter Buni Application Secret"
                                />
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Environment</label>
                                    <select 
                                        name="kcbEnv" 
                                        value={formData.kcbEnv} 
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                    >
                                        <option value="sandbox">Sandbox (Dev)</option>
                                        <option value="production">Production (Live)</option>
                                    </select>
                                </div>
                                <Input 
                                    label="Settlement Account" 
                                    name="bankDetails" 
                                    value={formData.bankDetails} 
                                    onChange={handleChange} 
                                    placeholder="Source Account Number"
                                    hint="The KCB account funds will be drawn from."
                                />

                                <div className="pt-4 flex flex-col gap-3">
                                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-100 dark:shadow-none py-6 font-bold" disabled={loading}>
                                        {loading ? <Loader2 className="animate-spin" /> : 'Save Configuration'}
                                    </Button>
                                    <Button type="button" onClick={handleTest} variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-50 py-6" disabled={testing}>
                                        {testing ? <Loader2 className="animate-spin" /> : 'Test Connection'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>

                    {/* Stats & History */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="p-6 bg-gradient-to-br from-green-600 to-emerald-700 text-white border-none shadow-xl">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-xs font-bold uppercase tracking-widest opacity-80">Total KCB Disbursed</p>
                                    <CreditCard className="w-5 h-5 opacity-50" />
                                </div>
                                <h4 className="text-3xl font-black font-mono">
                                    KES {history.reduce((sum, t) => sum + Number(t.amount), 0).toLocaleString()}
                                </h4>
                                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold bg-white/10 w-fit px-2 py-1 rounded-full">
                                    <CheckCircle2 className="w-3 h-3 text-white" />
                                    {history.length} Successful Transfers
                                </div>
                            </Card>

                            <Card className="p-6 border-none shadow-xl bg-white dark:bg-gray-800">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Provider</p>
                                    <Globe className="w-5 h-5 text-indigo-100" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                                        <img src="https://www.kcbgroup.com/images/kcb-logo.png" alt="KCB" className="w-10 grayscale opacity-50" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">Buni API Platform</h4>
                                        <p className="text-xs text-gray-500">Connected via OAuth 2.0</p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Recent KCB Activity */}
                        <Card className="border-none shadow-xl overflow-hidden min-h-[400px]">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center">
                                <h3 className="font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                                    <div className="w-2 h-6 bg-green-600 rounded-full" />
                                    KCB Disbursement Log
                                </h3>
                                <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1">
                                    <Download className="w-3 h-3" /> Export
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                                        <tr>
                                            <th className="p-4 text-[10px] font-black uppercase text-gray-400">Account / Ref</th>
                                            <th className="p-4 text-[10px] font-black uppercase text-gray-400 text-right">Amount (KES)</th>
                                            <th className="p-4 text-[10px] font-black uppercase text-gray-400 text-center">Status</th>
                                            <th className="p-4 text-[10px] font-black uppercase text-gray-400 text-right">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {history.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="p-20 text-center">
                                                    <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                                    <p className="text-gray-400 font-bold">No KCB transfers recorded yet.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            history.map((t, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                    <td className="p-4">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{JSON.parse(t.metadata || '{}').accountNumber || 'N/A'}</p>
                                                        <p className="text-[10px] font-mono text-gray-500 uppercase">{t.reference}</p>
                                                    </td>
                                                    <td className="p-4 text-sm font-black font-mono text-gray-900 dark:text-white text-right">
                                                        {Number(t.amount).toLocaleString()}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                            t.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {t.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right text-[10px] font-medium text-gray-500">
                                                        {new Date(t.createdAt).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Documentation / Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <h5 className="font-bold text-gray-900 dark:text-white mb-2 uppercase text-xs">PesaLink Ready</h5>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    KCB Transfers utilize the PesaLink rails for instant interbank settlements. Ensure your settlement account has sufficient float before processing bulk files.
                                </p>
                            </div>
                            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <h5 className="font-bold text-gray-900 dark:text-white mb-2 uppercase text-xs">Security Standards</h5>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Our Buni implementation adheres to the strict OAuth 2.0 standards. All client secrets are encrypted at rest and never exposed on the client side.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
