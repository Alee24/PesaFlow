'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import { CreditCard, ShieldCheck, CheckCircle2, Globe, Lock, Settings as SettingsIcon, Loader2 } from 'lucide-react';

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
        useCustomMpesa: false,
        vatEnabled: false,
        vatRate: 16,
        // Bank Integration (Tier 1)
        jengaMerchantId: '',
        jengaApiKey: '',
        jengaApiSecret: '',
        jengaEnv: 'sandbox',
        kcbConsumerKey: '',
        kcbConsumerSecret: '',
        kcbEnv: 'sandbox',
        coopClientId: '',
        coopClientSecret: '',
        coopEnv: 'sandbox',
        pin: '',
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [user, setUser] = useState<any>(null);
    const [subscription, setSubscription] = useState<any>(null);

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
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchProfile();
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const res = await api.get('/subscription');
            if (res.data) setSubscription(res.data);
        } catch (e) {
            console.error("Failed to load subscription status", e);
        }
    };

    // Check if user is branch manager
    const isBranchManager = user?.role === 'BRANCH_MANAGER';

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

            // Properly handle different data types
            Object.entries(formData).forEach(([key, value]) => {
                if (value === null || value === undefined) return;

                // Convert boolean to string for FormData
                if (typeof value === 'boolean') {
                    payload.append(key, value.toString());
                } else if (typeof value === 'number') {
                    payload.append(key, value.toString());
                } else {
                    payload.append(key, value as string);
                }
            });

            if (logoFile) {
                payload.append('logo', logoFile);
            }

            await api.put('/profile', payload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
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
        setMpesaTestMessage('Saving credentials then testing...');
        try {
            // Auto-save current M-Pesa credentials first so the test uses latest form values
            const payload = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (value === null || value === undefined) return;
                if (typeof value === 'boolean') payload.append(key, value.toString());
                else if (typeof value === 'number') payload.append(key, value.toString());
                else payload.append(key, value as string);
            });
            await api.put('/profile', payload, { headers: { 'Content-Type': 'multipart/form-data' } });

            // Now test with the freshly saved credentials
            const res = await api.post('/mpesa/test');
            setMpesaTestStatus('success');
            setMpesaTestMessage(`✅ ${res.data.message}`);
            showToast('M-Pesa connection successful!', 'success');
        } catch (e: any) {
            setMpesaTestStatus('error');
            const errMsg = e.response?.data?.message || e.response?.data?.error || e.message;
            setMpesaTestMessage(`Connection Failed: ${errMsg}`);
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

    const [bankTestStatus, setBankTestStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({
        JENGA: 'idle',
        KCB: 'idle'
    });
    const [bankTestMessage, setBankTestMessage] = useState<Record<string, string>>({
        JENGA: '',
        KCB: ''
    });

    const handleBankTest = async (provider: 'JENGA' | 'KCB') => {
        setBankTestStatus(prev => ({ ...prev, [provider]: 'loading' }));
        setBankTestMessage(prev => ({ ...prev, [provider]: '' }));
        try {
            const res = await api.post('/banks/test', { provider });
            setBankTestStatus(prev => ({ ...prev, [provider]: 'success' }));
            setBankTestMessage(prev => ({ ...prev, [provider]: res.data.message }));
        } catch (e: any) {
            setBankTestStatus(prev => ({ ...prev, [provider]: 'error' }));
            setBankTestMessage(prev => ({ ...prev, [provider]: e.response?.data?.error || e.message }));
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

    const isPro = true; // All users have 1-year free premium access now

    return (
        <DashboardLayout>
            <Toast
                message={toast.message}
                type={toast.type}
                visible={toast.visible}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />
            <div className="max-w-5xl mx-auto py-8 px-4">
                <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
                        <p className="text-gray-500 mt-1">
                            {isBranchManager
                                ? 'Viewing parent merchant settings (Read-only)'
                                : 'Manage business profile, integrations, and preferences.'}
                        </p>
                    </div>
                    {!isBranchManager && (
                        <Button onClick={handleSubmit} isLoading={saving} className="px-6 w-full md:w-auto">
                            Save Changes
                        </Button>
                    )}
                </header>

                {isBranchManager && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
                        <div className="flex items-center gap-3">
                            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Branch Manager View</h3>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    You are viewing your parent merchant's business settings. These settings are shared across all branches and can only be modified by the main merchant account.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

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
                                            <img
                                                src={getImageUrl(formData.logoUrl) || ''}
                                                alt="Logo"
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Input
                                    label="KRA PIN Number (Optional)"
                                    name="kraPinNumber"
                                    value={formData.kraPinNumber}
                                    onChange={handleChange}
                                    placeholder="P05..."
                                    className={isBranchManager ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-75" : ""}
                                    disabled={isBranchManager}
                                />
                                {formData.kraPinNumber && (
                                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        Verified by KRA
                                    </p>
                                )}
                            </div>

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
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">M-Pesa Payments Integration</h2>
                                <p className="text-sm text-gray-500 mt-1">Configure how you receive payments from customers</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`text-xs px-2 py-1 rounded font-bold ${formData.mpesaEnv === 'production' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                    {formData.mpesaEnv === 'production' ? 'PRODUCTION' : 'SANDBOX'}
                                </span>
                            </div>
                        </div>

                        {/* Payment Choice Section - Only show for Merchants, Admins see everything */}
                        {user?.role !== 'ADMIN' && (
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 mb-8">
                                <h3 className="text-md font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
                                    <CreditCard className="w-5 h-5 text-indigo-600" />
                                    Payment Processing Source
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Option 1: Mpesa Connect */}
                                    <div
                                        className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${!formData.useCustomMpesa ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' : 'border-gray-200 hover:border-indigo-300 dark:border-gray-700'}`}
                                        onClick={() => setFormData(prev => ({ ...prev, useCustomMpesa: false }))}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                                Mpesa Connect (Platform)
                                            </span>
                                            {!formData.useCustomMpesa && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Use our pre-configured infrastructure. Simple, secure, and ready-to-use. Funds settle to your Mpesa Connect wallet.</p>
                                    </div>

                                    {/* Option 2: Own API */}
                                    <div
                                        className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all ${formData.useCustomMpesa ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' : 'border-gray-200 hover:border-indigo-300 dark:border-gray-700'} ${!isPro ? 'opacity-70 cursor-not-allowed grayscale' : ''}`}
                                        onClick={() => {
                                            if (!isPro) {
                                                showToast("Your current plan doesn't support custom APIs. Upgrade to PRO.", 'info');
                                                return;
                                            }
                                            setFormData(prev => ({ ...prev, useCustomMpesa: true }));
                                        }}
                                    >
                                        {!isPro && (
                                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                                <Lock className="w-2 h-2" /> PRO Feature
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                                <Globe className="w-4 h-4 text-indigo-600" />
                                                Own API Credentials
                                            </span>
                                            {formData.useCustomMpesa && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Integrate your direct Safaricom Daraja credentials. Funds settle directly to your Paybill/Shortcode.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* API Details - Only if user is ADMIN or chose Own API */}
                        {(user?.role === 'ADMIN' || formData.useCustomMpesa) && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                {/* Status Banner */}
                                <div className={`p-4 rounded-lg border flex flex-col gap-2 ${mpesaTestStatus === 'success' ? 'bg-green-50 border-green-200' : mpesaTestStatus === 'error' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100 dark:bg-gray-800 dark:border-gray-700'}`}>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm font-medium ${mpesaTestStatus === 'success' ? 'text-green-700 shadow-sm' : mpesaTestStatus === 'error' ? 'text-red-700' : 'text-gray-700 dark:text-gray-300'}`}>
                                            API Status: {mpesaTestStatus === 'idle' ? 'Not Checked' : mpesaTestStatus.toUpperCase()}
                                        </span>
                                        <Button type="button" onClick={handleTestMpesa} variant="outline" size="sm">Test Connection</Button>
                                    </div>
                                    {mpesaTestMessage && <p className={`text-xs ${mpesaTestStatus === 'error' ? 'text-red-600' : 'text-green-600'}`}>{mpesaTestMessage}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col space-y-1">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Environment</label>
                                        <select
                                            name="mpesaEnv"
                                            value={formData.mpesaEnv}
                                            onChange={handleChange}
                                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
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
                            </div>
                        )}

                        {!formData.useCustomMpesa && user?.role !== 'ADMIN' && (
                            <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg text-indigo-700 dark:text-indigo-300 text-sm">
                                <ShieldCheck className="w-5 h-5" />
                                <span>You are currently using <b>Mpesa Connect</b>. Your customers will pay via our shared treasury, and credits will appear in your Mpesa Connect wallet.</span>
                            </div>
                        )}
                    </Card>

                    {/* SMTP Settings */}
                    {true && (
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
                    )}

                    {/* Bank Disbursement Settings */}
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Bank Disbursements (Tier 1)</h2>
                                <p className="text-sm text-gray-500 mt-1">Configure interbank transfers via PesaLink and Bank APIs</p>
                            </div>
                        </div>

                        <div className="space-y-10">
                            {/* Equity / Jenga */}
                            <div className="space-y-4">
                                <h3 className="text-md font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-red-600 rounded-full" />
                                    Equity Bank (Jenga API)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4 border-l-2 border-gray-100 dark:border-gray-800">
                                    <Input label="Jenga Merchant ID" name="jengaMerchantId" value={formData.jengaMerchantId} onChange={handleChange} />
                                    <Input label="Jenga API Key" name="jengaApiKey" value={formData.jengaApiKey} onChange={handleChange} type="password" />
                                    <Input label="Jenga API Secret" name="jengaApiSecret" value={formData.jengaApiSecret} onChange={handleChange} type="password" />
                                    <div className="flex flex-col space-y-1">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Environment</label>
                                        <select
                                            name="jengaEnv"
                                            value={formData.jengaEnv}
                                            onChange={handleChange}
                                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                                        >
                                            <option value="sandbox">Sandbox (Dev)</option>
                                            <option value="production">Production (Live)</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <div className={`p-4 rounded-lg border flex flex-col gap-2 ${bankTestStatus.JENGA === 'success' ? 'bg-green-50 border-green-200' : bankTestStatus.JENGA === 'error' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100 dark:bg-gray-800 dark:border-gray-700'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-sm font-medium ${bankTestStatus.JENGA === 'success' ? 'text-green-700' : bankTestStatus.JENGA === 'error' ? 'text-red-700' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    Jenga API Status: {bankTestStatus.JENGA === 'idle' ? 'Not Checked' : bankTestStatus.JENGA.toUpperCase()}
                                                </span>
                                                <Button type="button" onClick={() => handleBankTest('JENGA')} disabled={bankTestStatus.JENGA === 'loading'} variant="outline" size="sm">
                                                    {bankTestStatus.JENGA === 'loading' ? 'Testing...' : 'Test Connection'}
                                                </Button>
                                            </div>
                                            {bankTestMessage.JENGA && <p className={`text-xs ${bankTestStatus.JENGA === 'error' ? 'text-red-600' : 'text-green-600'}`}>{bankTestMessage.JENGA}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* KCB / Buni */}
                            <div className="space-y-4">
                                <h3 className="text-md font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                                    KCB Bank (Buni Developer Portal)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4 border-l-2 border-gray-100 dark:border-gray-800">
                                    <Input label="KCB Consumer Key" name="kcbConsumerKey" value={formData.kcbConsumerKey} onChange={handleChange} type="password" />
                                    <Input label="KCB Consumer Secret" name="kcbConsumerSecret" value={formData.kcbConsumerSecret} onChange={handleChange} type="password" />
                                    <div className="flex flex-col space-y-1">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Environment</label>
                                        <select
                                            name="kcbEnv"
                                            value={formData.kcbEnv}
                                            onChange={handleChange}
                                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                                        >
                                            <option value="sandbox">Sandbox (Dev)</option>
                                            <option value="production">Production (Live)</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <div className={`p-4 rounded-lg border flex flex-col gap-2 ${bankTestStatus.KCB === 'success' ? 'bg-green-50 border-green-200' : bankTestStatus.KCB === 'error' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100 dark:bg-gray-800 dark:border-gray-700'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-sm font-medium ${bankTestStatus.KCB === 'success' ? 'text-green-700' : bankTestStatus.KCB === 'error' ? 'text-red-700' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    KCB API Status: {bankTestStatus.KCB === 'idle' ? 'Not Checked' : bankTestStatus.KCB.toUpperCase()}
                                                </span>
                                                <Button type="button" onClick={() => handleBankTest('KCB')} disabled={bankTestStatus.KCB === 'loading'} variant="outline" size="sm">
                                                    {bankTestStatus.KCB === 'loading' ? 'Testing...' : 'Test Connection'}
                                                </Button>
                                            </div>
                                            {bankTestMessage.KCB && <p className={`text-xs ${bankTestStatus.KCB === 'error' ? 'text-red-600' : 'text-green-600'}`}>{bankTestMessage.KCB}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Display Info */}
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white border-b pb-2">Customer Facing Info</h2>
                        <div className="space-y-4">
                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bank Details Advice</label>
                                <textarea name="bankDetails" value={formData.bankDetails} onChange={handleChange} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 w-full min-h-[80px] bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700" />
                            </div>
                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">M-Pesa Paybill/Till Advice</label>
                                <textarea name="mpesaDetails" value={(formData as any).mpesaDetails} onChange={handleChange} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 w-full min-h-[80px] bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700" />
                            </div>
                        </div>
                    </Card>

                    {/* Security / POS PIN */}
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-4 border-b pb-2">
                            <Lock className="w-6 h-6 text-indigo-600" />
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Security & POS PIN</h2>
                        </div>
                        <div className="max-w-md">
                            <Input 
                                label="Kiosk Access PIN (4-Digits)" 
                                name="pin" 
                                type="password" 
                                maxLength={4}
                                value={formData.pin} 
                                onChange={handleChange} 
                                placeholder="****" 
                                hint="Universal PIN for your Merchant profile on POS kiosks."
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                This PIN allows you to log in to the POS interface as the Owner. 
                                Staff members have their own PINs manageable in the <a href="/team" className="text-indigo-600 font-bold hover:underline">Team page</a>.
                            </p>
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
