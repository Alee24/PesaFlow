'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import { CreditCard, ShieldCheck, CheckCircle2, Globe, Lock, Settings as SettingsIcon, KeyRound, ExternalLink, HelpCircle, Info, AlertTriangle, Banknote, Wallet } from 'lucide-react';

export default function SettingsPage() {
    const [formData, setFormData] = useState({
        companyName: '',
        logoUrl: '',
        faviconUrl: '',
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
        mpesaSecurityCredential: '',
        mpesaCertificate: '',
        mpesaCallbackUrl: '',
        mpesaEnv: 'sandbox',
        useCustomMpesa: true,
        vatEnabled: false,
        vatRate: 16,
        // Notifications & SMS
        emailNotificationsEnabled: true,
        smsNotificationsEnabled: false,
        smsPartnerId: '',
        smsApiKey: '',
        smsShortcode: '',
        notifyOnSale: true,
        notifyOnMpesa: true,
        notifyOnInvoice: true,
        notifyOnLowStock: true,
    });


    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [faviconFile, setFaviconFile] = useState<File | null>(null);
    const [user, setUser] = useState<any>(null);
    const [subscription, setSubscription] = useState<any>(null);
    const [showPlatformWarningModal, setShowPlatformWarningModal] = useState(false);

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

    const [smsTestStatus, setSmsTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [smsTestMessage, setSmsTestMessage] = useState('');


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

                // Default useCustomMpesa to true (merchants use their own credentials by default)
                if (res.data.useCustomMpesa !== undefined && res.data.useCustomMpesa !== null) {
                    sanitizedData.useCustomMpesa = res.data.useCustomMpesa === true || res.data.useCustomMpesa === 'true';
                } else {
                    sanitizedData.useCustomMpesa = true;
                }

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

        if (name === 'mpesaInitiatorPass' && typeof val === 'string') {
            const clean = val.trim();
            // If user pastes pre-computed 160+ char Base64 SecurityCredential into Initiator Password
            if (clean.length >= 160 && /^[A-Za-z0-9+/=]+$/.test(clean)) {
                setFormData(prev => ({
                    ...prev,
                    mpesaInitiatorPass: clean,
                    mpesaSecurityCredential: prev.mpesaSecurityCredential || clean
                }));
                showToast('Pre-computed Security Credential detected & synced to Security Credential field!', 'info');
                return;
            }
        }

        if (name === 'mpesaSecurityCredential' && typeof val === 'string') {
            const clean = val.trim();
            if (clean.length >= 160 && /^[A-Za-z0-9+/=]+$/.test(clean)) {
                setFormData(prev => ({
                    ...prev,
                    mpesaSecurityCredential: clean,
                    mpesaInitiatorPass: prev.mpesaInitiatorPass || clean
                }));
                return;
            }
        }

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

    const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showToast("File size too large. Max 2MB.", 'error');
                return;
            }
            setFaviconFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, faviconUrl: reader.result as string }));
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
            if (faviconFile) {
                payload.append('favicon', faviconFile);
            }

            const res = await api.put('/profile', payload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            showToast('Settings saved successfully!', 'success');
            
            // Reload window to apply favicon changes instantly
            if (faviconFile || (res.data.faviconUrl && formData.faviconUrl !== res.data.faviconUrl)) {
                setTimeout(() => window.location.reload(), 1000);
            }
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
            const payload = {
                consumerKey: formData.mpesaConsumerKey,
                consumerSecret: formData.mpesaConsumerSecret,
                env: formData.mpesaEnv,
                initiatorName: formData.mpesaInitiatorName,
                password: formData.mpesaInitiatorPass,
                securityCredential: formData.mpesaSecurityCredential,
                certificate: formData.mpesaCertificate
            };
            const res = await api.post('/mpesa/test', payload);
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

    const handleTestSMS = async () => {
        setSmsTestStatus('loading');
        setSmsTestMessage('');
        try {
            const res = await api.post('/profile/test-sms');
            setSmsTestStatus('success');
            setSmsTestMessage(`Success: ${res.data.message || 'SMS sent successfully'}`);
        } catch (e: any) {
            setSmsTestStatus('error');
            setSmsTestMessage(`Failed: ${e.response?.data?.message || e.message}`);
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

                            {user?.role === 'ADMIN' && (
                                <div className="flex flex-col space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Favicon (Browser Icon)</label>
                                    <div className="flex items-center gap-4">
                                        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg border border-gray-300 transition">
                                            Upload Favicon
                                            <input type="file" accept="image/x-icon,image/png,image/jpeg" onChange={handleFaviconChange} className="hidden" />
                                        </label>
                                        {formData.faviconUrl && (
                                            <div className="h-8 w-8 rounded-md overflow-hidden border bg-white flex items-center justify-center">
                                                <img
                                                    src={getImageUrl(formData.faviconUrl) || ''}
                                                    alt="Favicon"
                                                    className="max-h-full max-w-full object-contain"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

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
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                    <h3 className="text-md font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                                        <CreditCard className="w-5 h-5 text-emerald-600" />
                                        M-Pesa Integration Architecture
                                    </h3>
                                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 self-start sm:self-auto">
                                        Standard: Own API Credentials
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
                                    Direct Safaricom Daraja API credentials are required for independent settlement. Customer payments settle immediately into your own Paybill or Till.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Option 1: Own API (DEFAULT & HIGHLY RECOMMENDED) */}
                                    <div
                                        className={`relative cursor-pointer p-5 rounded-xl border-2 transition-all ${formData.useCustomMpesa ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/20 shadow-sm ring-1 ring-emerald-500/20' : 'border-gray-200 hover:border-emerald-300 dark:border-gray-700 bg-white dark:bg-gray-900'}`}
                                        onClick={() => setFormData(prev => ({ ...prev, useCustomMpesa: true }))}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                                                    <Globe className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-sm text-gray-900 dark:text-white block">
                                                        Own API Credentials
                                                    </span>
                                                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                                                        Default & Recommended
                                                    </span>
                                                </div>
                                            </div>
                                            {formData.useCustomMpesa ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                                            Direct Safaricom Daraja integration. Customer payments settle immediately into your own Safaricom Paybill or Till account with zero platform intermediaries.
                                        </p>
                                        <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-2.5 border border-emerald-200/80 dark:border-emerald-900/40 text-[11px] text-gray-700 dark:text-gray-300 space-y-1">
                                            <p className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                                                <ShieldCheck className="w-3.5 h-3.5" /> Required Daraja Credentials:
                                            </p>
                                            <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-gray-600 dark:text-gray-400 pl-1">
                                                <li>• Consumer Key & Secret</li>
                                                <li>• Shortcode (Paybill/Till)</li>
                                                <li>• Online Passkey</li>
                                                <li>• Initiator Name & Password</li>
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Option 2: Mpesa Connect (Platform Account - Temporary Fallback) */}
                                    <div
                                        className={`relative cursor-pointer p-5 rounded-xl border-2 transition-all ${!formData.useCustomMpesa ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/20 shadow-sm ring-1 ring-amber-500/20' : 'border-gray-200 hover:border-amber-300 dark:border-gray-700 bg-white dark:bg-gray-900'}`}
                                        onClick={() => {
                                            if (formData.useCustomMpesa) {
                                                setShowPlatformWarningModal(true);
                                            } else {
                                                setFormData(prev => ({ ...prev, useCustomMpesa: false }));
                                            }
                                        }}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                                                    <CreditCard className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-sm text-gray-900 dark:text-white block">
                                                        M-Pesa Connect (Platform Account)
                                                    </span>
                                                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                                                        Temporary Fallback Only
                                                    </span>
                                                </div>
                                            </div>
                                            {!formData.useCustomMpesa ? (
                                                <CheckCircle2 className="w-5 h-5 text-amber-600" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                                            Routes payments to the company master treasury Paybill. Collected funds are credited into your M-Pesa Connect Wallet for manual withdrawal.
                                        </p>
                                        <div className="bg-amber-100/60 dark:bg-amber-900/30 rounded-lg p-2.5 border border-amber-300/60 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
                                            <p className="font-semibold flex items-center gap-1">
                                                <AlertTriangle className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" /> Operational Guidance:
                                            </p>
                                            <p className="text-[10px] leading-tight text-amber-800 dark:text-amber-300">
                                                Funds route to the company account, not your own. Minimize M-Pesa, focus on Cash, and register your own Paybill promptly.
                                            </p>
                                        </div>
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
                                    
                                    <div className="md:col-span-2 border-t border-zinc-200 dark:border-zinc-800 pt-5 mt-2">
                                        <div className="flex items-center gap-2 mb-3">
                                            <KeyRound className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                            <h4 className="font-semibold text-zinc-900 dark:text-white text-base">
                                                Daraja Initiator Credentials &amp; Advanced Operations
                                            </h4>
                                        </div>
                                        <div className="p-3.5 mb-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
                                            <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
                                                <Info className="w-4 h-4 text-emerald-500 shrink-0" />
                                                <span>Required for Account Balance inquiries, Transaction Status checks, B2B, B2C, and Reversals.</span>
                                            </div>
                                            <p>
                                                • <b>Sandbox:</b> Initiator Name is typically <code className="bg-white dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-400 font-mono">testapi</code>.
                                            </p>
                                            <p>
                                                • <b>Production:</b> Initiator Name is your Operator Username created on the Safaricom M-Pesa Org Portal (<a href="https://org.ke.m-pesa.com" target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline inline-flex items-center gap-0.5">org.ke.m-pesa.com <ExternalLink className="w-3 h-3" /></a>) with the <i>API Operator</i> or <i>Business Administrator</i> role.
                                            </p>
                                            <p>
                                                • <b>Pre-computed Security Credential:</b> You can generate your 344-character Security Credential directly using Safaricom&apos;s generator tool at <a href="https://developer.safaricom.co.ke/test_credentials" target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline inline-flex items-center gap-0.5">developer.safaricom.co.ke/test_credentials <ExternalLink className="w-3 h-3" /></a> and paste it below. Pre-computed credentials guarantee 100% compatibility.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input 
                                                label="Initiator Name / Username" 
                                                name="mpesaInitiatorName" 
                                                placeholder={formData.mpesaEnv === 'production' ? 'e.g. operator_api' : 'testapi'} 
                                                value={formData.mpesaInitiatorName} 
                                                onChange={handleChange} 
                                            />
                                            <div>
                                                <Input 
                                                    label="Initiator Password / Pre-computed Credential" 
                                                    name="mpesaInitiatorPass" 
                                                    value={formData.mpesaInitiatorPass} 
                                                    onChange={handleChange} 
                                                    type={formData.mpesaInitiatorPass && formData.mpesaInitiatorPass.length > 50 ? "text" : "password"} 
                                                    placeholder="Operator password or 344-char pre-computed credential"
                                                />
                                                {formData.mpesaInitiatorPass && formData.mpesaInitiatorPass.trim().length >= 160 && (
                                                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                                        Valid {formData.mpesaInitiatorPass.trim().length}-character Pre-computed Security Credential detected &amp; active
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-col space-y-1">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                                                <span>Pre-generated Security Credential (Optional &amp; Recommended)</span>
                                                <a 
                                                    href="https://developer.safaricom.co.ke/test_credentials" 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                                                >
                                                    Open Safaricom Generator <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </label>
                                            <textarea
                                                name="mpesaSecurityCredential"
                                                rows={2}
                                                value={formData.mpesaSecurityCredential}
                                                onChange={handleChange}
                                                placeholder="Paste your 172 or 344-character Base64 encrypted SecurityCredential here..."
                                                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700 font-mono text-xs"
                                            />
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                                If provided, M-Pesa Connect transmits this credential directly to Safaricom Daraja without re-encrypting.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col space-y-1 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Callback URL</label>
                                        <div className="flex gap-2">
                                            <input
                                                name="mpesaCallbackUrl"
                                                value={formData.mpesaCallbackUrl}
                                                onChange={handleChange}
                                                placeholder="https://yourdomain.com/api/mpesa/callback"
                                                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin.replace(/:\d+$/, ':5000');
                                                    const baseUrl = apiUrl.replace(/\/api\/?$/, '');
                                                    const uniqueId = user?.merchantId || user?.id || user?.userId || '';
                                                    const callbackUrl = `${baseUrl}/api/mpesa/callback/${uniqueId}`;
                                                    setFormData(prev => ({ ...prev, mpesaCallbackUrl: callbackUrl }));
                                                    showToast('Callback URL generated successfully', 'success');
                                                }}
                                                className="whitespace-nowrap"
                                            >
                                                Generate URL
                                            </Button>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This URL must be publicly accessible. Safaricom will send payment confirmations here.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!formData.useCustomMpesa && user?.role !== 'ADMIN' && (
                            <div className="p-5 bg-gradient-to-r from-amber-50 to-amber-100/70 dark:from-amber-950/40 dark:to-amber-900/20 border-2 border-amber-300 dark:border-amber-700/60 rounded-xl space-y-4 shadow-sm animate-in fade-in duration-300">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-amber-200/80 dark:bg-amber-800/60 rounded-lg text-amber-800 dark:text-amber-200 shrink-0 mt-0.5">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                                            Platform Master Account Active (Company Treasury Mode)
                                        </h4>
                                        <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                                            Customer payments are processed through the company's master M-Pesa integration. Please note these critical settlement conditions:
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                                    <div className="bg-white/95 dark:bg-gray-800/90 p-3 rounded-lg border border-amber-200/80 dark:border-amber-800/50 shadow-xs">
                                        <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white mb-1">
                                            <Banknote className="w-4 h-4 text-amber-600" />
                                            1. Company Paybill Deposit
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
                                            Customer payments are received directly into the company's shared Paybill, not your personal or business Till.
                                        </p>
                                    </div>

                                    <div className="bg-white/95 dark:bg-gray-800/90 p-3 rounded-lg border border-amber-200/80 dark:border-amber-800/50 shadow-xs">
                                        <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white mb-1">
                                            <Wallet className="w-4 h-4 text-emerald-600" />
                                            2. Wallet Credit & Payouts
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
                                            Collected funds are credited to your M-Pesa Connect Wallet balance. You must request a withdrawal to transfer your money.
                                        </p>
                                    </div>

                                    <div className="bg-white/95 dark:bg-gray-800/90 p-3 rounded-lg border border-amber-200/80 dark:border-amber-800/50 shadow-xs">
                                        <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 mb-1">
                                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                                            3. Temporary Fallback: Focus on Cash
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
                                            Platform mode is strictly a temporary bridge. To avoid daily cash flow bottlenecks, prioritize Cash payments while on this mode.
                                        </p>
                                    </div>

                                    <div className="bg-white/95 dark:bg-gray-800/90 p-3 rounded-lg border border-amber-200/80 dark:border-amber-800/50 shadow-xs">
                                        <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                            4. Highly Recommended
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
                                            Apply for your own Safaricom Paybill or Till on the Safaricom Daraja Portal and input your own API credentials to receive funds instantly.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-amber-200/80 dark:border-amber-800/50">
                                    <span className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                                        Have your own Safaricom credentials ready?
                                    </span>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, useCustomMpesa: true }));
                                            showToast('Switched to Own API Credentials mode', 'success');
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                                    >
                                        <Globe className="w-3.5 h-3.5" /> Switch to Own API Credentials
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* SMTP Settings */}
                    {user?.role === 'ADMIN' && (
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

                    {/* Notifications & SMS */}
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-1 text-gray-800 dark:text-white">Notifications & SMS Alerts</h2>
                        <p className="text-sm text-gray-500 mb-6 border-b pb-4">Control how you receive alerts for key business events. SMS powered by Advanta.</p>

                        {/* Master Toggles */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <label className="relative inline-flex items-center cursor-pointer mt-0.5">
                                    <input
                                        type="checkbox"
                                        name="emailNotificationsEnabled"
                                        checked={(formData as any).emailNotificationsEnabled}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">Email Notifications</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Receive email alerts for key activities</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <label className="relative inline-flex items-center cursor-pointer mt-0.5">
                                    <input
                                        type="checkbox"
                                        name="smsNotificationsEnabled"
                                        checked={(formData as any).smsNotificationsEnabled}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">SMS Notifications</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Receive SMS alerts via Advanta</p>
                                </div>
                            </div>
                        </div>

                        {/* Advanta SMS Credentials — only show when SMS is enabled */}
                        {(formData as any).smsNotificationsEnabled && (
                            <div className="mb-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center font-bold">S</span>
                                    Advanta SMS Credentials
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input label="Partner ID" name="smsPartnerId" value={(formData as any).smsPartnerId} onChange={handleChange} placeholder="e.g. 15400" />
                                    <Input label="API Key" name="smsApiKey" value={(formData as any).smsApiKey} onChange={handleChange} type="password" placeholder="Your Advanta API Key" />
                                    <Input label="Shortcode / Sender ID" name="smsShortcode" value={(formData as any).smsShortcode} onChange={handleChange} placeholder="e.g. MPESACONNECT" />
                                </div>
                                <div className={`flex items-center justify-between p-3 rounded-lg border text-sm ${smsTestStatus === 'success' ? 'bg-green-50 border-green-200' : smsTestStatus === 'error' ? 'bg-red-50 border-red-200' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                                    <span className={smsTestStatus === 'success' ? 'text-green-700' : smsTestStatus === 'error' ? 'text-red-700' : 'text-gray-600 dark:text-gray-300'}>
                                        {smsTestMessage || 'Test your Advanta SMS connection'}
                                    </span>
                                    <Button type="button" onClick={handleTestSMS} variant="outline" size="sm" isLoading={smsTestStatus === 'loading'}>
                                        Send Test SMS
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Per-Activity Toggles */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Notify me when:</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { name: 'notifyOnSale', label: 'A POS sale is completed', sub: 'Every cash or card transaction' },
                                    { name: 'notifyOnMpesa', label: 'M-Pesa payment received', sub: 'STK push confirmations' },
                                    { name: 'notifyOnInvoice', label: 'Invoice is paid', sub: 'When a client pays an invoice' },
                                    { name: 'notifyOnLowStock', label: 'Product stock is low', sub: 'Below minimum threshold' },
                                ].map((toggle) => (
                                    <label key={toggle.name} className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
                                        <input
                                            type="checkbox"
                                            name={toggle.name}
                                            checked={(formData as any)[toggle.name]}
                                            onChange={handleChange}
                                            className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 dark:text-white">{toggle.label}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{toggle.sub}</p>
                                        </div>
                                    </label>
                                ))}
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

            {/* Modal: Confirmation when switching to Mpesa Connect (Platform Account) */}
            {showPlatformWarningModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4">
                        <div className="flex items-center gap-3 border-b pb-3 dark:border-gray-800">
                            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-700 dark:text-amber-300">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                    Switch to M-Pesa Connect Platform Mode?
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Important treasury & settlement notice
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-amber-50/70 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/80 dark:border-amber-800/40">
                            <p className="font-semibold text-amber-950 dark:text-amber-200 text-sm">
                                Please review the operational conditions before switching:
                            </p>
                            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-amber-700 dark:text-amber-400">1.</span>
                                    <span><b>Company Treasury Account:</b> All M-Pesa payments will be received directly into the company's shared Paybill, NOT your own business account.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-amber-700 dark:text-amber-400">2.</span>
                                    <span><b>M-Pesa Connect Wallet:</b> Payments will be credited into your M-Pesa Connect Wallet. You must submit a withdrawal request to transfer your money out.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-amber-700 dark:text-amber-400">3.</span>
                                    <span><b>Temporary Last Resort:</b> This option is intended strictly as a temporary bridge while you await your own Paybill/Till approval.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-amber-700 dark:text-amber-400">4.</span>
                                    <span><b>Focus on Cash:</b> While on platform mode, we advise you to prioritize Cash payments and minimize M-Pesa to maintain immediate access to daily working capital.</span>
                                </li>
                            </ul>
                        </div>

                        <div className="text-[11px] text-gray-500 dark:text-gray-400 italic">
                            By continuing, you acknowledge that customer payments route via the platform company treasury and must be withdrawn from your wallet.
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowPlatformWarningModal(false)}
                                className="w-full sm:w-auto text-xs"
                            >
                                Keep Own API Credentials (Recommended)
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, useCustomMpesa: false }));
                                    setShowPlatformWarningModal(false);
                                    showToast('Switched to Mpesa Connect (Platform Mode)', 'info');
                                }}
                                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs"
                            >
                                I Understand, Switch to Platform
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

