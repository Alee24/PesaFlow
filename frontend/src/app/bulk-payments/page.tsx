'use client';

import React, { useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Upload, Download, FileText, CheckCircle, AlertCircle, Trash2, Send, Loader2, Info } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

export default function BulkPaymentsPage() {
    const { showToast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalItems: 0, totalAmount: 0 });
    const [historyStats, setHistoryStats] = useState({ totalDisbursed: 0, successCount: 0, failedCount: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await api.get('/transactions?type=WITHDRAWAL');
            setHistory(response.data);
            
            // Calculate history stats
            const success = response.data.filter((t: any) => t.status === 'COMPLETED');
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
        const csvContent = "phoneNumber,amount,reference,description\n254712345678,100,REF123,Payment for services\n254798765432,550,REF456,Monthly allowance";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mpesa_bulk_template.csv';
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
            await api.post('/mpesa/bulk-process', {
                payments: previewData
            });
            showToast(`Successfully queued ${stats.totalItems} payments!`, 'success');
            handleRemoveFile();
            fetchHistory(); // Refresh history
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to process bulk payments', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto pb-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">M-Pesa Bulk Payments</h1>
                        <p className="text-gray-500 mt-2">Manage outflows and process high-volume B2C transactions.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button 
                            variant="outline"
                            onClick={handleTestConnection}
                            disabled={testingConnection}
                            className="bg-white dark:bg-gray-800 border-indigo-200"
                        >
                            {testingConnection ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test connection'}
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
                                                <th className="p-4 text-[10px] font-black uppercase text-gray-400">Amount</th>
                                                <th className="p-4 text-[10px] font-black uppercase text-gray-400 text-center">Status</th>
                                                <th className="p-4 text-[10px] font-black uppercase text-gray-400 text-right">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {(file ? previewData : history).map((item, idx) => (
                                                <tr key={idx} className="hover:bg-white dark:hover:bg-gray-800/50 transition-all">
                                                    <td className="p-4">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{item.phoneNumber || item.reference || 'N/A'}</p>
                                                        <p className="text-[10px] text-gray-500 font-mono">{item.merchantRequestId || 'Bulk Entry'}</p>
                                                    </td>
                                                    <td className="p-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                                                        {item.reference || item.reference || '-'}
                                                    </td>
                                                    <td className="p-4 text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
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
                                                    <td className="p-4 text-right text-[10px] text-gray-400 font-medium">
                                                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Preview'}
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
        </DashboardLayout>
    );
}
