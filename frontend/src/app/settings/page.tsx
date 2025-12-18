'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import api from '@/lib/api';

export default function SettingsPage() {
    const [formData, setFormData] = useState({
        companyName: '',
        logoUrl: '',
        contactPhone: '',
        email: '',
        location: '',
        website: '',
        kraPinNumber: '',
        bankDetails: '',
        mpesaDetails: '', // Display text
        currency: 'KES',
        // SMTP
        smtpHost: '',
        smtpPort: '',
        smtpUser: '',
        smtpPass: '',
        // M-Pesa API
        mpesaConsumerKey: '',
        mpesaConsumerSecret: '',
        mpesaPasskey: '',
        mpesaShortcode: '',
        mpesaInitiatorName: '',
        mpesaInitiatorPass: '',
        mpesaCallbackUrl: '',
        mpesaEnv: 'sandbox',
        vatEnabled: false,
        vatRate: 16
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);

    // Toast State
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
        visible: false,
        message: '',
        type: 'info'
    });

    // Test States
    const [mpesaTestStatus, setMpesaTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [mpesaTestMessage, setMpesaTestMessage] = useState('');

    const [smtpTestStatus, setSmtpTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [smtpTestMessage, setSmtpTestMessage] = useState('');
    const [testEmail, setTestEmail] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/profile');
            if (res.data) {
                const sanitizedData = Object.fromEntries(
                    Object.entries(res.data).map(([key, value]) => [key, value === null ? '' : value])
                );
                // Ensure default generic M-Pesa env if missing
                if (!sanitizedData.mpesaEnv) sanitizedData.mpesaEnv = 'sandbox';
                if (!sanitizedData.currency) sanitizedData.currency = 'KES';

                // Keep boolean/number types for VAT
                if (res.data.vatEnabled !== undefined) sanitizedData.vatEnabled = res.data.vatEnabled;
                if (res.data.vatRate !== undefined) sanitizedData.vatRate = res.data.vatRate;

                setFormData(prev => ({
                    ...prev,
                    ...sanitizedData
                }));
            }
        } catch (error) {
            console.error("Failed to load profile", error);
            showToast("Failed to load profile settings", 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showToast("File size too large. Max 2MB.", 'error');
                return;
            }
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                payload.append(key, value as string);
            });
            if (logoFile) {
                payload.append('logo', logoFile);
            }

            await api.put('/profile', payload);
            showToast('Settings saved successfully!', 'success');
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.error || "Failed to save settings", 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleTestMpesa = async () => {
        setMpesaTestStatus('idle');
        setMpesaTestMessage('');
        try {
            // We should ideally save first, but for now assuming user might want to test saved creds
            // Or we could send current form data to test endpoint? 
            // The backend test endpoint currently reads from DB. So user MUST save first.
            // Let's remind them or auto-save? Auto-saving might be too aggressive.
            // We'll warn if dirty? No, simpler: Read from DB.
            const res = await api.post('/mpesa/test');
            setMpesaTestStatus('success');
            setMpesaTestMessage(`Success: ${res.data.message}`);
        } catch (e: any) {
            setMpesaTestStatus('error');
            setMpesaTestMessage(`Connection Failed: ${e.response?.data?.message || e.message}`);
        }
    };

    const handleTestSMTP = async () => {
        setSmtpTestStatus('idle');
        setSmtpTestMessage('');
        try {
            const res = await api.post('/profile/test-smtp', { toEmail: testEmail });
            setSmtpTestStatus('success');
            setSmtpTestMessage(`Success: ${res.data.message}`);
        } catch (e: any) {
            setSmtpTestStatus('error');
            setSmtpTestMessage(`Connection Failed: ${e.response?.data?.message || e.message}`);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Loading settings...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <Toast
                message={toast.message}
                type={toast.type}
                visible={toast.visible}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />
            <div className="max-w-5xl mx-auto py-8 px-4">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
                        <p className="text-gray-500 mt-1">Manage business profile, integrations, and preferences.</p>
                    </div>
                    <Button onClick={handleSubmit} isLoading={saving} className="px-6">
                        Save Changes
                    </Button>
                </header>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* General Profile */}
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white border-b pb-2">Business Profile</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} required placeholder="My Awesome Business" />
                            <Input label="Contact Phone" name="contactPhone" type="tel" value={formData.contactPhone} onChange={handleChange} placeholder="+254 7..." />
                            <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="billing@example.com" />
                            <Input label="Website" name="website" type="url" value={formData.website} onChange={handleChange} placeholder="https://example.com" />
                            <Input label="Location / Address" name="location" value={formData.location} onChange={handleChange} placeholder="Nairobi, Kenya" />

                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company Logo</label>
                                <div className="flex items-center gap-4">
                                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg border border-gray-300 transition">
                                        Upload Logo
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </label>
                                    {formData.logoUrl && (
                                        <div className="h-12 w-12 rounded-lg overflow-hidden border bg-white flex items-center justify-center">
                                            <img src={formData.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Input label="KRA PIN Number" name="kraPinNumber" value={formData.kraPinNumber} onChange={handleChange} placeholder="P05..." />

                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Default Currency</label>
                                <select
                                    name="currency"
                                    value={formData.currency}
                                    onChange={handleChange}
                                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                                >
                                    <option value="KES">Kenyan Shilling (KES)</option>
                                    <option value="USD">US Dollar (USD)</option>
                                    <option value="EUR">Euro (EUR)</option>
                                    <option value="GBP">British Pound (GBP)</option>
                                </select>
                            </div>

                            <div className="flex flex-col space-y-2 pt-2">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="vatEnabled"
                                        checked={(formData as any).vatEnabled}
                                        onChange={handleChange}
                                        className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">Enable VAT Calculation</span>
                                </label>
                            </div>

                            {(formData as any).vatEnabled && (
                                <Input
                                    label="VAT Rate (%)"
                                    name="vatRate"
                                    type="number"
                                    step="0.1"
                                    value={(formData as any).vatRate}
                                    onChange={handleChange}
                                    placeholder="16"
                                />
                            )}
                        </div>
                    </Card>

                    {/* M-Pesa Settings */}
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">M-Pesa API Configuration</h2>
                            <div className="flex items-center gap-4">
                                <span className={`text-xs px-2 py-1 rounded font-bold ${formData.mpesaEnv === 'production' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                    {formData.mpesaEnv === 'production' ? 'PRODUCTION' : 'SANDBOX'}
                                </span>
                            </div>
                        </div>

                        {/* Status Banner */}
                        <div className={`p-4 rounded-lg border mb-6 flex flex-col gap-2 ${mpesaTestStatus === 'success' ? 'bg-green-50 border-green-200' : mpesaTestStatus === 'error' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex items-center justify-between">
                                <span className={`text-sm font-medium ${mpesaTestStatus === 'success' ? 'text-green-700' : mpesaTestStatus === 'error' ? 'text-red-700' : 'text-gray-700'}`}>
                                    API Status: {mpesaTestStatus === 'idle' ? 'Not Checked' : mpesaTestStatus.toUpperCase()}
                                </span>
                                <Button type="button" onClick={handleTestMpesa} variant="outline" size="sm">Test M-Pesa Connection</Button>
                            </div>
                            {mpesaTestMessage && <p className={`text-xs ${mpesaTestStatus === 'error' ? 'text-red-600' : 'text-green-600'}`}>{mpesaTestMessage}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col space-y-1">
                                <label className="text-sm font-medium text-gray-700">Environment</label>
                                <select
                                    name="mpesaEnv"
                                    value={formData.mpesaEnv}
                                    onChange={handleChange}
                                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                    <option value="sandbox">Sandbox (Dev)</option>
                                    <option value="production">Production (Live)</option>
                                </select>
                            </div>
                            <Input label="Consumer Key" name="mpesaConsumerKey" value={formData.mpesaConsumerKey} onChange={handleChange} type="password" />
                            <Input label="Consumer Secret" name="mpesaConsumerSecret" value={formData.mpesaConsumerSecret} onChange={handleChange} type="password" />
                            <Input label="Passkey" name="mpesaPasskey" value={formData.mpesaPasskey} onChange={handleChange} type="password" />
                            <Input label="Shortcode (Paybill/Till)" name="mpesaShortcode" value={formData.mpesaShortcode} onChange={handleChange} />
                            <Input label="Initiator Name" name="mpesaInitiatorName" value={formData.mpesaInitiatorName} onChange={handleChange} />
                            <Input label="Initiator Password" name="mpesaInitiatorPass" value={formData.mpesaInitiatorPass} onChange={handleChange} type="password" />
                            <Input label="Callback URL" name="mpesaCallbackUrl" value={formData.mpesaCallbackUrl} onChange={handleChange} placeholder="https://yourdomain.com/api/mpesa/callback" />
                        </div>
                    </Card>

                    {/* SMTP Settings */}
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white border-b pb-2">Email Notifications (SMTP)</h2>

                        {/* SMTP Status Banner */}
                        <div className={`p-4 rounded-lg border mb-6 flex flex-col gap-2 ${smtpTestStatus === 'success' ? 'bg-green-50 border-green-200' : smtpTestStatus === 'error' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex items-center justify-between">
                                <span className={`text-sm font-medium ${smtpTestStatus === 'success' ? 'text-green-700' : smtpTestStatus === 'error' ? 'text-red-700' : 'text-gray-700'}`}>
                                    SMTP Status: {smtpTestStatus === 'idle' ? 'Not Checked' : smtpTestStatus.toUpperCase()}
                                </span>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        placeholder="Test Recipient Email"
                                        className="text-sm px-3 py-1 border rounded-md"
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                    />
                                    <Button type="button" onClick={handleTestSMTP} variant="outline" size="sm">Test SMTP</Button>
                                </div>
                            </div>
                            {smtpTestMessage && <p className={`text-xs ${smtpTestStatus === 'error' ? 'text-red-600' : 'text-green-600'}`}>{smtpTestMessage}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="SMTP Host" name="smtpHost" value={formData.smtpHost} onChange={handleChange} placeholder="smtp.gmail.com" />
                            <Input label="SMTP Port" name="smtpPort" type="number" value={formData.smtpPort} onChange={handleChange} placeholder="587" />
                            <Input label="SMTP User" name="smtpUser" value={formData.smtpUser} onChange={handleChange} placeholder="user@example.com" />
                            <Input label="SMTP Password" name="smtpPass" type="password" value={formData.smtpPass} onChange={handleChange} placeholder="App Password" />
                        </div>
                    </Card>

                    {/* Display Info */}
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white border-b pb-2">Customer Facing Info</h2>
                        <div className="space-y-4">
                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bank Details Advice</label>
                                <textarea name="bankDetails" value={formData.bankDetails} onChange={handleChange} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 w-full min-h-[80px]" />
                            </div>
                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">M-Pesa Paybill/Till Advice</label>
                                <textarea name="mpesaDetails" value={formData.mpesaDetails} onChange={handleChange} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 w-full min-h-[80px]" />
                            </div>
                        </div>
                    </Card>

                    <div className="flex justify-end pt-4 pb-12">
                        <Button type="submit" isLoading={saving} className="px-8 py-3 text-lg font-semibold shadow-lg">
                            Save All Settings
                        </Button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
