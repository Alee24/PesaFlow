'use client';

import React, { useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Upload, Download, FileText, CheckCircle, AlertCircle, Trash2, Send, Loader2, Info, Settings, Globe, ShieldCheck, X } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

export default function BulkPaymentsPage() {
    const { showToast } = useToast();
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const initialChannel = searchParams?.get('channel') === 'BANK' ? 'BANK' : 'MPESA';
    
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [channel, setChannel] = useState<'MPESA' | 'BANK'>(initialChannel);
    const [bankProvider, setBankProvider] = useState<'JENGA' | 'KCB'>('JENGA');
    const [loading, setLoading] = useState(false);
    const [retrying, setRetrying] = useState<string | null>(null);
    const [testingConnection, setTestingConnection] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalItems: 0, totalAmount: 0 });
    const [historyStats, setHistoryStats] = useState({ totalDisbursed: 0, successCount: 0, failedCount: 0 });
    const [showBankConfig, setShowBankConfig] = useState<any>(null); // 'JENGA' | 'KCB' | null
    const [bankSettings, setBankSettings] = useState<any>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await api.get('/transactions?type=WITHDRAWAL');
            setHistory(response.data);
            
            // Calculate history stats
            const success = response.data.filter((t: any) => t.status === 'COMPLETED' || t.status === 'PAID');
            const failed = response.data.filter((t: any) => t.status === 'FAILED');
            const total = success.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
            
            setHistoryStats({
                totalDisbursed: total,
                successCount: success.length,
                failedCount: failed.length
            });
        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    };

    const handleShowConfig = async (provider: 'JENGA' | 'KCB') => {
        setLoading(true);
        try {
            const res = await api.get('/profile');
            setBankSettings(res.data);
            setShowBankConfig(provider);
        } catch (error) {
            showToast("Failed to fetch bank settings", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = async (transactionId: string) => {
        setRetrying(transactionId);
        try {
            await api.post('/mpesa/retry', { transactionId });
            showToast('Retry initiated successfully', 'success');
            fetchHistory();
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to retry payment', 'error');
        } finally {
            setRetrying(null);
        }
    };

    const handleTestConnection = async () => {
        setTestingConnection(true);
        try {
            const response = await api.post('/mpesa/test');
            showToast(response.data.message || 'M-Pesa API Connection Successful!', 'success');
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Connection failed. Check your API credentials.', 'error');
        } finally {
            setTestingConnection(false);
        }
    };

    const handleDownloadTemplate = () => {
        const mpesaCsv = "phoneNumber,amount,reference,description\n254712345678,100,REF123,Payment for services";
        const bankCsv = "accountNumber,bankCode,accountName,amount,reference,description\n011234567890,011,John Doe,1500,REF999,Salary Payment";
        const csvContent = channel === 'MPESA' ? mpesaCsv : bankCsv;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${channel.toLowerCase()}_bulk_template.csv`;
        a.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
                showToast('Please upload a valid CSV file', 'error');
                return;
            }
            setFile(selectedFile);
            parseCSV(selectedFile);
        }
    };

    const parseCSV = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            
            const data = lines.slice(1)
                .filter(line => line.trim())
                .map(line => {
                    const values = line.split(',').map(v => v.trim());
                    const obj: any = {};
                    headers.forEach((header, i) => obj[header] = values[i]);
                    return obj;
                });

            setPreviewData(data);
            
            // Calculate stats
            const totalAmount = data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
            setStats({
                totalItems: data.length,
                totalAmount
            });
        };
        reader.readAsText(file);
    };

    const handleRemoveFile = () => {
        setFile(null);
        setPreviewData([]);
        setStats({ totalItems: 0, totalAmount: 0 });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleProcessBatch = async () => {
        if (!previewData.length) return;
        
        setLoading(true);
        try {
            const endpoint = channel === 'MPESA' ? '/mpesa/bulk-process' : '/banks/transfer';
            if (channel === 'MPESA') {
                await api.post(endpoint, { payments: previewData });
            } else {
                // For banks, we might need a batch endpoint or loop (simplified loop for now)
                for (const item of previewData) {
                    await api.post(endpoint, {
                        amount: item.amount,
                        bankCode: item.bankCode,
                        accountNumber: item.accountNumber,
                        accountName: item.accountName,
                        reference: item.reference,
                        description: item.description,
                        provider: bankProvider
                    });
                }
            }
            showToast(`Successfully processed ${stats.totalItems} ${channel} payments!`, 'success');
            handleRemoveFile();
            fetchHistory(); // Refresh history
        } catch (error: any) {
            showToast(error.response?.data?.error || `Failed to process ${channel} payments`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto pb-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Bulk Disbursements</h1>
                        <p className="text-gray-500 mt-2">Manage outflows across M-Pesa and Kenyan Tier 1 Banks.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex">
                            <button 
                                onClick={() => { setChannel('MPESA'); handleRemoveFile(); }}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${channel === 'MPESA' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                M-PESA
                            </button>
                            <button 
                                onClick={() => { setChannel('BANK'); handleRemoveFile(); }}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${channel === 'BANK' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                BANK
                            </button>
                        </div>
                        {channel === 'BANK' && (
                            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex items-center gap-1">
                                <span className="text-[10px] font-bold text-gray-400 px-2 uppercase tracking-tighter">Provider:</span>
                                <button 
                                    onClick={() => { setBankProvider('JENGA'); handleShowConfig('JENGA'); }}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 ${bankProvider === 'JENGA' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    EQUITY <Settings className="w-3 h-3 opacity-40 group-hover:opacity-100" />
                                </button>
                                <button 
                                    onClick={() => { setBankProvider('KCB'); handleShowConfig('KCB'); }}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 ${bankProvider === 'KCB' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    KCB <Settings className="w-3 h-3 opacity-40 group-hover:opacity-100" />
                                </button>
                            </div>
                        )}
                        <Button 
                            variant="outline"
                            onClick={handleTestConnection}
                            disabled={testingConnection}
                            className="bg-white dark:bg-gray-800 border-indigo-200"
                        >
                            {testingConnection ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connection'}
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={handleDownloadTemplate}
                            className="flex items-center gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                        >
                            <Download className="w-4 h-4" /> Template
                        </Button>
                    </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="p-6 border-l-4 border-l-indigo-600">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Disbursed</p>
                        <h4 className="text-2xl font-black text-gray-900 dark:text-white font-mono">KES {historyStats.totalDisbursed.toLocaleString()}</h4>
                    </Card>
                    <Card className="p-6 border-l-4 border-l-green-500">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Successful Batch Items</p>
                        <h4 className="text-2xl font-black text-gray-900 dark:text-white font-mono">{historyStats.successCount}</h4>
                    </Card>
                    <Card className="p-6 border-l-4 border-l-red-500">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Failed Attempts</p>
                        <h4 className="text-2xl font-black text-gray-900 dark:text-white font-mono">{historyStats.failedCount}</h4>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Column: Upload */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="p-6 border-dashed border-2 border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/10">
                            <div className="text-center py-8">
                                <div className="bg-indigo-100 dark:bg-indigo-900/40 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-inner">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold mb-1">Upload CSV</h3>
                                <p className="text-[10px] text-gray-500 mb-6 uppercase tracking-wider">B2C/C2B Batch File</p>
                                
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden" 
                                    accept=".csv"
                                />
                                
                                <Button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
                                >
                                    Select CSV
                                </Button>
                            </div>
                        </Card>

                        {stats.totalItems > 0 && (
                            <Card className="p-6 bg-indigo-600 text-white border-none shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                                <h3 className="font-bold opacity-80 text-xs uppercase tracking-widest mb-4">Pending Batch</h3>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-center">
                                        <span className="opacity-70 text-sm italic">Count</span>
                                        <span className="text-xl font-bold">{stats.totalItems}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="opacity-70 text-sm italic">Amount</span>
                                        <span className="text-xl font-bold font-mono">KES {stats.totalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-4 border-t border-white/20">
                                        <Button 
                                            onClick={handleProcessBatch}
                                            disabled={loading}
                                            className="w-full bg-white text-indigo-600 hover:bg-gray-100 font-bold py-6 text-lg"
                                        >
                                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-5 h-5 mr-1" /> Disburse</>}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: Preview/History */}
                    <div className="lg:col-span-3">
                        <Card className="overflow-hidden min-h-[500px] flex flex-col border-none shadow-xl">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                                    <h3 className="font-black text-gray-800 dark:text-white tracking-tight">
                                        {file ? 'File Preview' : 'Recent Disbursements'}
                                    </h3>
                                </div>
                                {file && (
                                    <button 
                                        onClick={handleRemoveFile}
                                        className="text-red-500 hover:text-red-600 flex items-center gap-1 text-xs font-bold uppercase tracking-tighter"
                                    >
                                        <Trash2 className="w-3 h-3" /> Dismiss
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex-1 overflow-auto bg-gray-50/30 dark:bg-black/20">
                                {(!file && history.length === 0) ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20 px-4 text-center">
                                        <AlertCircle className="w-16 h-16 opacity-10 mb-4" />
                                        <p className="font-bold text-gray-600 dark:text-gray-400">No activity yet</p>
                                        <p className="text-xs">Upload your first CSV to start disbursing funds.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead className="bg-white dark:bg-gray-900 sticky top-0 border-b border-gray-100 dark:border-gray-800 z-10">
                                            <tr>
                                                <th className="p-4 text-[10px] font-black uppercase text-gray-400">Recipient</th>
                                                <th className="p-4 text-[10px] font-black uppercase text-gray-400">Reference</th>
                                                <th className="p-4 text-[10px] font-black uppercase text-gray-400">Channel</th>
                                                <th className="p-4 text-[10px] font-black uppercase text-gray-400">Amount</th>
                                                <th className="p-4 text-[10px] font-black uppercase text-gray-400 text-center">Status</th>
                                                <th className="p-4 text-[10px] font-black uppercase text-gray-400 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {(file ? previewData : history).map((item, idx) => (
                                                <tr key={idx} className="hover:bg-white dark:hover:bg-gray-800/50 transition-all">
                                                    <td className="p-4">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                            {item.phoneNumber || item.accountNumber || item.reference || 'N/A'}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 font-mono">
                                                            {item.accountName || item.merchantRequestId || 'Bulk Entry'}
                                                        </p>
                                                    </td>
                                                    <td className="p-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                                                        {item.reference || '-'}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.channel === 'BANK' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                            {item.channel || (file ? channel : 'MPESA')}
                                                        </span>
                                                        {item.bankName && <p className="text-[9px] text-gray-400 uppercase">{item.bankName}</p>}
                                                    </td>
                                                    <td className="p-4 text-sm font-black font-mono text-gray-900 dark:text-white">
                                                        KES {(parseFloat(item.amount) || 0).toLocaleString()}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                            (item.status === 'COMPLETED' || item.status === 'PAID') ? 'bg-green-100 text-green-700' :
                                                            item.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {item.status || 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        {(item.status === 'FAILED' || !item.status) && (
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm"
                                                                onClick={() => handleRetry(item.id)}
                                                                disabled={retrying === item.id || !!file}
                                                                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold text-[10px] h-8"
                                                            >
                                                                {retrying === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'RETRY'}
                                                            </Button>
                                                        )}
                                                        {(item.status === 'COMPLETED' || item.status === 'PAID') && (
                                                            <span className="text-[10px] text-gray-400 font-medium">
                                                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Verification Grid */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="p-8 border-none shadow-lg bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                        <div className="flex gap-6">
                            <div className="bg-indigo-600 p-4 rounded-2xl h-fit shadow-lg shadow-indigo-100 dark:shadow-none">
                                <Info className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-3">API Credential check</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                                    Our system automatically validates your **Consumer Key** and **Secret** before executing disbursements. Use the 
                                    "Test Connection" button above to verify your M-Pesa B2C status instantly.
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-8 border-none shadow-lg bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                        <div className="flex gap-6">
                            <div className="bg-amber-500 p-4 rounded-2xl h-fit shadow-lg shadow-amber-100 dark:shadow-none">
                                <AlertCircle className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-3">Balance Guard</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                                    B2C payments draw directly from your **M-Pesa Business Utility Wallet**. Ensure you have sufficient float before 
                                    initiating large batches to avoid Safaricom "Insufficient Funds" errors.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Bank Configuration Modal */}
            {showBankConfig && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg overflow-hidden border-none shadow-2xl scale-100">
                        <div className={`p-6 text-white flex justify-between items-center ${showBankConfig === 'JENGA' ? 'bg-red-600' : 'bg-green-600'}`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Globe className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl tracking-tight">{showBankConfig} Provider Settings</h3>
                                    <p className="text-[10px] uppercase font-bold opacity-75">Secure API Configuration</p>
                                </div>
                            </div>
                            <button onClick={() => setShowBankConfig(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 bg-white dark:bg-gray-900">
                            {showBankConfig === 'JENGA' ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase font-bold text-gray-400">Merchant ID</p>
                                            <p className="font-mono text-sm truncate">{bankSettings.jengaMerchantId || 'Not Set'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase font-bold text-gray-400">Environment</p>
                                            <p className="uppercase text-sm font-bold text-indigo-600">{bankSettings.jengaEnv || 'sandbox'}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Primary API Key</p>
                                        <p className="font-mono text-xs break-all opacity-60">
                                            {bankSettings.jengaApiKey ? '••••••••••••••••••••••••••••••' : 'None Configured'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                     <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase font-bold text-gray-400">Buni Platform</p>
                                            <p className="font-mono text-sm truncate">KCB Group Kenya</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase font-bold text-gray-400">Environment</p>
                                            <p className="uppercase text-sm font-bold text-green-600">{bankSettings.kcbEnv || 'sandbox'}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                        <p className="text-[10px] uppercase font-bold text-emerald-600 mb-2">Consumer Key</p>
                                        <p className="font-mono text-xs truncate">
                                            {bankSettings.kcbConsumerKey || 'None Configured'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex gap-4">
                                <Button 
                                    className="flex-1 py-6 bg-gray-900 hover:bg-black text-white rounded-xl shadow-xl font-bold"
                                    onClick={async () => {
                                        setTestingConnection(true);
                                        try {
                                            const res = await api.post('/banks/test', { provider: showBankConfig });
                                            showToast(res.data.message || 'Connection Verified!', 'success');
                                        } catch (error: any) {
                                            showToast(error.response?.data?.error || 'Validation Failed', 'error');
                                        } finally {
                                            setTestingConnection(false);
                                        }
                                    }}
                                    disabled={testingConnection}
                                >
                                    {testingConnection ? <Loader2 className="animate-spin" /> : <><ShieldCheck className="w-5 h-5 mr-2" /> Test Connection</>}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="flex-1 py-6 rounded-xl border-gray-200 font-bold"
                                    onClick={() => window.location.href = '/settings'}
                                >
                                    Manage Settings
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </DashboardLayout>
    );
}
