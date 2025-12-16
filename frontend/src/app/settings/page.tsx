'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

export default function SettingsPage() {
    const [formData, setFormData] = useState({
        companyName: '',
        logoUrl: '',
        contactPhone: '',
        email: '',
        location: '',
        website: '',
        vatNumber: '',
        bankDetails: '',
        mpesaDetails: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/profile');
            if (res.data) {
                // Filter out nulls/undefined from response to avoid controlled/uncontrolled inputs warning
                const sanitizedData = Object.fromEntries(
                    Object.entries(res.data).map(([key, value]) => [key, value || ''])
                );

                setFormData(prev => ({
                    ...prev,
                    ...sanitizedData
                }));
            }
        } catch (error) {
            console.error("Failed to load profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert("File size too large. Max 2MB.");
                return;
            }

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
            await api.put('/profile', formData);
            alert('Settings saved successfully!');
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.error || "Failed to save settings");
        } finally {
            setSaving(false);
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
            <div className="max-w-4xl mx-auto py-6">
                <header className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Business Settings</h1>
                    <p className="text-gray-500">Manage your company details for invoicing.</p>
                </header>

                <Card className="mb-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">M-Pesa Integration</h2>
                            <p className="text-sm text-gray-500">Manage your Daraja API connection</p>
                        </div>
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-medium">
                            {formData.mpesaDetails?.includes('production') ? 'Production' : 'Sandbox / Test'}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Connection Status</span>
                                <Button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            const res = await api.post('/mpesa/test');
                                            alert(`Success: ${res.data.message}`);
                                        } catch (e: any) {
                                            alert(`Connection Failed: ${e.response?.data?.message || e.message}`);
                                        }
                                    }}
                                    variant="outline"
                                    className="text-sm"
                                >
                                    Test Connection
                                </Button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Reusing existing mpesaDetails field for display logic above, but allowing edit here alongside others if needed */}
                            {/* ... existing fields ... */}
                        </form>
                    </div>
                </Card>

                <Card>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Company Name"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleChange}
                                required
                                placeholder="My Awesome Business"
                            />
                            <Input
                                label="Contact Phone"
                                name="contactPhone"
                                type="tel"
                                value={formData.contactPhone}
                                onChange={handleChange}
                                placeholder="+254 7..."
                            />
                            <Input
                                label="Email Address"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="billing@example.com"
                            />
                            <Input
                                label="Website"
                                name="website"
                                type="url"
                                value={formData.website}
                                onChange={handleChange}
                                placeholder="https://example.com"
                            />
                            <Input
                                label="Location / Address"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="Nairobi, Kenya"
                            />
                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company Logo</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-gray-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-indigo-50 file:text-indigo-700
                                            hover:file:bg-indigo-100"
                                    />
                                    {formData.logoUrl && (
                                        <div className="relative h-12 w-12 rounded-lg overflow-hidden border">
                                            <img src={formData.logoUrl} alt="Logo Preview" className="h-full w-full object-contain" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">Max size 2MB</p>
                            </div>
                            <Input
                                label="VAT Number"
                                name="vatNumber"
                                value={formData.vatNumber}
                                onChange={handleChange}
                                placeholder="P05..."
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bank Details</label>
                                <textarea
                                    name="bankDetails"
                                    value={formData.bankDetails}
                                    onChange={handleChange}
                                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 min-h-[100px] w-full"
                                    placeholder="Bank Name: KCB&#10;Account No: 1234567890&#10;Branch: Nairobi"
                                />
                            </div>

                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">M-Pesa Details</label>
                                <textarea
                                    name="mpesaDetails"
                                    value={formData.mpesaDetails}
                                    onChange={handleChange}
                                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 min-h-[100px] w-full"
                                    placeholder="Paybill: 123456&#10;Account No: Business Name"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t dark:border-gray-700">
                            <Button type="submit" isLoading={saving} className="w-full md:w-auto md:px-8">
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </DashboardLayout>
    );
}
