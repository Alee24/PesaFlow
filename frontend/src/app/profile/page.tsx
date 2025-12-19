'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { User, Lock, Mail, Phone, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { normalizePhoneNumber } from '@/lib/phoneUtils';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/auth/login');
            return;
        }
        const parsed = JSON.parse(userData);
        setUser(parsed);
        if (parsed) {
            setFormData({
                name: parsed.name || '',
                email: parsed.email || '',
                phoneNumber: parsed.phoneNumber || '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        }
    }, [router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            alert("New passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const payload: any = {
                name: formData.name,
                email: formData.email,
                phoneNumber: normalizePhoneNumber(formData.phoneNumber)
            };

            if (formData.newPassword) {
                payload.password = formData.newPassword;
                payload.currentPassword = formData.currentPassword;
            }

            // Only send current password if changing sensitive info like email or password
            if (formData.email !== user?.email || formData.newPassword) {
                if (!formData.currentPassword) {
                    alert("Please enter current password to confirm changes.");
                    setLoading(false);
                    return;
                }
                payload.currentPassword = formData.currentPassword;
            }

            const res = await api.put('/auth/me', payload);

            // Update local storage
            const updatedUser = { ...user, ...res.data.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);

            alert('Profile updated successfully');
            setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.error || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto py-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                    <p className="text-gray-500">Manage your account settings and preferences.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Role / Info Card */}
                    <div className="md:col-span-1">
                        <Card className="p-6 text-center h-full">
                            <div className="w-24 h-24 bg-indigo-100 rounded-full mx-auto flex items-center justify-center mb-4 text-indigo-600">
                                <User className="w-12 h-12" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">{user?.name || user?.email}</h2>
                            <span className="inline-block mt-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                                {user?.role || 'MERCHANT'}
                            </span>
                            <div className="mt-6 text-left space-y-3">
                                <div className="flex items-center text-sm text-gray-600">
                                    <Mail className="w-4 h-4 mr-3" />
                                    {user?.email}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <Phone className="w-4 h-4 mr-3" />
                                    {user?.phoneNumber || 'No phone set'}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Edit Form */}
                    <div className="md:col-span-2">
                        <Card className="p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Personal Details</h3>
                                <div className="grid grid-cols-1 gap-6">
                                    <Input
                                        label="Full Name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                    />
                                    <Input
                                        label="Email Address"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                    <Input
                                        label="Phone Number"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                    />
                                </div>

                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4 mt-8 flex items-center gap-2">
                                    <Lock className="w-4 h-4" /> Security
                                </h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-yellow-50 text-yellow-800 text-sm rounded-md mb-4 empty:hidden">
                                        {(formData.email !== user?.email || formData.newPassword) &&
                                            "Enter current password to confirm sensitive changes."
                                        }
                                    </div>

                                    <Input
                                        label="Current Password"
                                        name="currentPassword"
                                        type="password"
                                        value={formData.currentPassword}
                                        onChange={handleChange}
                                        placeholder="Required for email/password changes"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="New Password"
                                            name="newPassword"
                                            type="password"
                                            value={formData.newPassword}
                                            onChange={handleChange}
                                            placeholder="Leave blank to keep current"
                                        />
                                        <Input
                                            label="Confirm New Password"
                                            name="confirmPassword"
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end">
                                    <Button type="submit" isLoading={loading}>
                                        <Save className="w-4 h-4 mr-2" /> Save Changes
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
