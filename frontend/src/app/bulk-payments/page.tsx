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
    const [stats, setStats] = useState({ totalItems: 0, totalAmount: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            const response = await api.post('/mpesa/bulk-process', {
                payments: previewData
            });
            showToast(`Successfully queued ${stats.totalItems} payments!`, 'success');
            handleRemoveFile();
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to process bulk payments', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto pb-12">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">M-Pesa Bulk Payments</h1>
                        <p className="text-gray-500 mt-2">Upload CSV to process batch B2C/C2B transactions effortlessly.</p>
                    </div>
                    <Button 
                        variant="outline" 
                        onClick={handleDownloadTemplate}
                        className="flex items-center gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    >
                        <Download className="w-4 h-4" /> Download Template
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Upload */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="p-6 border-dashed border-2 border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/10">
                            <div className="text-center py-8">
                                <div className="bg-indigo-100 dark:bg-indigo-900/40 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold mb-1">Upload CSV File</h3>
                                <p className="text-xs text-gray-500 mb-6 px-4">Ensure your file follows the official template for accurate processing.</p>
                                
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden" 
                                    accept=".csv"
                                />
                                
                                <Button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    Select File
                                </Button>
                            </div>
                        </Card>

                        {stats.totalItems > 0 && (
                            <Card className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none shadow-xl">
                                <h3 className="font-bold opacity-80 text-sm uppercase tracking-wider mb-4">Batch Summary</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="opacity-70 text-sm">Total Recipients</span>
                                        <span className="text-xl font-bold">{stats.totalItems}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="opacity-70 text-sm">Total Amount</span>
                                        <span className="text-xl font-bold font-mono">KES {stats.totalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-4 border-t border-white/20">
                                        <Button 
                                            onClick={handleProcessBatch}
                                            disabled={loading}
                                            className="w-full bg-white text-indigo-600 hover:bg-gray-100 font-bold py-6 text-lg"
                                        >
                                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-5 h-5 mr-2" /> Disburse Now</>}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: Preview */}
                    <div className="lg:col-span-2">
                        <Card className="overflow-hidden min-h-[400px] flex flex-col">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-500" />
                                    <h3 className="font-bold">Data Preview</h3>
                                </div>
                                {file && (
                                    <button 
                                        onClick={handleRemoveFile}
                                        className="text-red-500 hover:text-red-600 flex items-center gap-1 text-sm font-medium"
                                    >
                                        <Trash2 className="w-4 h-4" /> Clear
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex-1 overflow-auto">
                                {!file ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-full mb-4">
                                            <AlertCircle className="w-12 h-12 opacity-20" />
                                        </div>
                                        <p>No file selected for preview</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                                            <tr>
                                                <th className="p-4 text-xs font-bold uppercase text-gray-500">#</th>
                                                <th className="p-4 text-xs font-bold uppercase text-gray-500">Phone</th>
                                                <th className="p-4 text-xs font-bold uppercase text-gray-500 text-right">Amount</th>
                                                <th className="p-4 text-xs font-bold uppercase text-gray-500">Reference</th>
                                                <th className="p-4 text-xs font-bold uppercase text-gray-500">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {previewData.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                    <td className="p-4 text-sm text-gray-500">{idx + 1}</td>
                                                    <td className="p-4 text-sm font-mono">{item.phoneNumber}</td>
                                                    <td className="p-4 text-sm font-bold text-right font-mono text-indigo-600">
                                                        {parseFloat(item.amount).toLocaleString()}
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{item.reference}</td>
                                                    <td className="p-4">
                                                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-bold uppercase">Pending</span>
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

                {/* Info Card */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                        <div className="flex gap-4">
                            <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-xl h-fit">
                                <Info className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">B2C Verification</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                                    All B2C payments require your M-Pesa Business Wallet to have sufficient balance. 
                                    Transactions are processed securely through the official Safaricom API.
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6 bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
                        <div className="flex gap-4">
                            <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-xl h-fit">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-green-900 dark:text-green-100 mb-2">Security First</h4>
                                <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed">
                                    Before disbursement, our system validates each phone number format. 
                                    Failures are logged immediately with clear error reasons.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
