'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import api from '@/lib/api';

export default function KRAIntegrationPage() {
    const [settings, setSettings] = useState({
        portalUrl: '',
        clientId: '',
        clientSecret: '',
        searchEndpoint: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success' | 'error' | 'info' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/kra/settings');
            if (res.data) setSettings(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/kra/settings', settings);
            setToast({ visible: true, message: 'KRA API Credentials updated successfully', type: 'success' });
        } catch (error) {
            setToast({ visible: true, message: 'Failed to update settings', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto py-8 px-4">
                <Toast
                    visible={toast.visible}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, visible: false })}
                />

                <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">KRA iTax Integration Settings</h1>
                <p className="text-gray-500 mb-8">Configure the API credentials required to connect to the Kenya Revenue Authority iTax system.</p>

                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="iTax Portal URL"
                            name="portalUrl"
                            value={settings.portalUrl}
                            onChange={handleChange}
                            placeholder="https://itax.kra.go.ke/KRA-Portal/"
                        />
                        <Input
                            label="Client ID / App Key"
                            name="clientId"
                            value={settings.clientId}
                            onChange={handleChange}
                            type="password"
                        />
                        <Input
                            label="Client Secret / App Secret"
                            name="clientSecret"
                            value={settings.clientSecret}
                            onChange={handleChange}
                            type="password"
                        />
                        <Input
                            label="Search Endpoint (PIN Checker)"
                            name="searchEndpoint"
                            value={settings.searchEndpoint}
                            onChange={handleChange}
                            placeholder="/api/pinChecker"
                        />

                        <div className="flex justify-end pt-4">
                            <Button type="submit" isLoading={saving}>Save API Credentials</Button>
                        </div>
                    </form>
                </Card>
            </div>
        </DashboardLayout>
    );
}
