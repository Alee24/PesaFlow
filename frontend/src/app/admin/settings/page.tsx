'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Settings, DollarSign, Save, BarChart } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

export default function AdminSettingsPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sendingTest, setSendingTest] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [settings, setSettings] = useState({
        serviceChargeEnabled: true,
        serviceChargeAmount: 2.5,
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPass: '',
        smtpFromName: '',
        smtpFromEmail: '',
        googleAnalyticsId: ''
    });

    useEffect(() => {
        const init = async () => {
            const userDataStr = localStorage.getItem('user');
            if (!userDataStr) {
                router.push('/auth/login');
                return;
            }

            let user: any = {};
            try {
                if (userDataStr && userDataStr !== 'undefined') {
                    user = JSON.parse(userDataStr);
                }
            } catch (e) {
                console.error("Failed to parse user data", e);
                router.push('/auth/login');
                return;
            }

            if (!user || user.role !== 'ADMIN') {
                router.push('/dashboard');
                return;
            }

            try {
                const response = await api.get('/settings');
                setSettings({
                    serviceChargeEnabled: response.data.serviceChargeEnabled,
                    serviceChargeAmount: response.data.serviceChargeAmount,
                    smtpHost: response.data.smtpHost || '',
                    smtpPort: response.data.smtpPort || 587,
                    smtpUser: response.data.smtpUser || '',
                    smtpPass: response.data.smtpPass || '',
                    smtpFromName: response.data.smtpFromName || '',
                    smtpFromEmail: response.data.smtpFromEmail || '',
                    googleAnalyticsId: response.data.googleAnalyticsId || ''
                });
            } catch (error: any) {
                console.error('Failed to fetch settings:', error);
                showToast(error.response?.data?.error || 'Failed to load settings', 'error');
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [router]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/settings', settings);
            showToast('Settings updated successfully', 'success');
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update settings';
            showToast(errorMessage, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSendTestEmail = async () => {
        if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        setSendingTest(true);
        try {
            await api.post('/settings/test-email', { testEmail });
            showToast('Test email sent successfully! Check your inbox.', 'success');
            setTestEmail('');
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Failed to send test email';
            showToast(errorMessage, 'error');
        } finally {
            setSendingTest(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading settings...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto pb-12">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Settings className="w-6 h-6" />
                        System Settings
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Configure system-wide settings and preferences</p>
                </div>

                <Card>
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Service Charge</h2>
                                <p className="text-sm text-gray-500">Configure M-Pesa payment service charge</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Enable/Disable Toggle */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div>
                                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                                        Enable Service Charge
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Apply a service charge to all M-Pesa payments
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSettings({ ...settings, serviceChargeEnabled: !settings.serviceChargeEnabled })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.serviceChargeEnabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.serviceChargeEnabled ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Amount Input */}
                            <div>
                                <Input
                                    label="Service Charge Amount (KES)"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={settings.serviceChargeAmount}
                                    onChange={(e) => setSettings({ ...settings, serviceChargeAmount: parseFloat(e.target.value) || 0 })}
                                    disabled={!settings.serviceChargeEnabled}
                                    placeholder="2.5"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    This amount will be deducted from each M-Pesa payment before crediting the merchant wallet
                                </p>
                            </div>

                            {/* Preview */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Preview</h3>
                                <div className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                                    <div className="flex justify-between">
                                        <span>Customer pays:</span>
                                        <span className="font-mono">KES 100.00</span>
                                    </div>
                                    {settings.serviceChargeEnabled && (
                                        <div className="flex justify-between text-red-600 dark:text-red-400">
                                            <span>Service charge:</span>
                                            <span className="font-mono">- KES {settings.serviceChargeAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-semibold pt-2 border-t border-blue-200 dark:border-blue-800">
                                        <span>Merchant receives:</span>
                                        <span className="font-mono">
                                            KES {(100 - (settings.serviceChargeEnabled ? settings.serviceChargeAmount : 0)).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="mt-6 flex justify-end">
                            <Button
                                onClick={handleSave}
                                isLoading={saving}
                                className="flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* SMTP Settings Card */}
                <Card className="mt-6">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Settings className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">SMTP Settings</h2>
                                <p className="text-sm text-gray-500">Configure global email server settings</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="SMTP Host"
                                    type="text"
                                    value={settings.smtpHost}
                                    onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                                    placeholder="smtp.gmail.com"
                                />
                                <Input
                                    label="SMTP Port"
                                    type="number"
                                    value={settings.smtpPort}
                                    onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 587 })}
                                    placeholder="587"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="SMTP Username"
                                    type="text"
                                    value={settings.smtpUser}
                                    onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                                    placeholder="your-email@gmail.com"
                                />
                                <Input
                                    label="SMTP Password"
                                    type="password"
                                    value={settings.smtpPass}
                                    onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="From Name"
                                    type="text"
                                    value={settings.smtpFromName}
                                    onChange={(e) => setSettings({ ...settings, smtpFromName: e.target.value })}
                                    placeholder="Mpesa Connect"
                                />
                                <Input
                                    label="From Email"
                                    type="email"
                                    value={settings.smtpFromEmail}
                                    onChange={(e) => setSettings({ ...settings, smtpFromEmail: e.target.value })}
                                    placeholder="noreply@mpesaconnect.co.ke"
                                />
                            </div>

                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                                    <strong>Note:</strong> These settings will be used as fallback when merchants don't have their own SMTP configuration.
                                </p>
                            </div>

                            {/* Test Email Section */}
                            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">Test Email Configuration</h3>
                                <p className="text-xs text-blue-800 dark:text-blue-400 mb-3">
                                    Send a test email to verify your SMTP settings are working correctly.
                                </p>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <Input
                                            type="email"
                                            value={testEmail}
                                            onChange={(e) => setTestEmail(e.target.value)}
                                            placeholder="Enter test email address"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSendTestEmail();
                                                }
                                            }}
                                        />
                                    </div>
                                    <Button
                                        onClick={handleSendTestEmail}
                                        isLoading={sendingTest}
                                        variant="secondary"
                                        disabled={!testEmail}
                                    >
                                        Send Test Email
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Integrations & Analytics Card */}
                <Card className="mt-6">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <BarChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics</h2>
                                <p className="text-sm text-gray-500">Configure external analytics services</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Input
                                label="Google Analytics Measurement ID"
                                type="text"
                                value={settings.googleAnalyticsId}
                                onChange={(e) => setSettings({ ...settings, googleAnalyticsId: e.target.value })}
                                placeholder="G-XXXXXXXXXX"
                            />
                            <p className="text-xs text-gray-500">
                                Enter your Google Analytics 4 Measurement ID (starts with "G-").
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Save Button */}
                <div className="mt-6 flex justify-end">
                    <Button
                        onClick={handleSave}
                        isLoading={saving}
                        className="flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save All Settings
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}
