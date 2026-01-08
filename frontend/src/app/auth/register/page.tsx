
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';
import { normalizePhoneNumber } from '@/lib/phoneUtils';
import { User, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.email || !formData.phoneNumber || !formData.password) {
            setError('Please fill in all fields');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const normalizedPhone = normalizePhoneNumber(formData.phoneNumber);
            await api.post('/auth/register', {
                email: formData.email,
                phoneNumber: normalizedPhone,
                password: formData.password
            });

            setSuccess(true);
            setFormData({ email: '', phoneNumber: '', password: '', confirmPassword: '' });

        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
                            Mpesa Connect
                        </h1>
                    </div>
                    <Card className="p-8 text-center shadow-2xl border-none">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Check your email</h2>
                        <p className="text-gray-600 mb-8">
                            We've sent a verification link to your email address. Please click the link to verify your account and log in.
                        </p>
                        <Link href="/auth/login">
                            <Button className="w-full">Return to Login</Button>
                        </Link>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
                        Mpesa Connect
                    </h1>
                    <p className="text-gray-500 mt-2">Create your merchant account</p>
                </div>

                <Card className="shadow-2xl border-none">
                    <form onSubmit={handleSubmit} className="p-6">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-6 border border-red-100 dark:border-red-900/50">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <Input
                                label="Email Address"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                placeholder="you@example.com"
                            />
                            <Input
                                label="Phone Number"
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                required
                                placeholder="0768..."
                            />
                            <Input
                                label="Password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                placeholder="••••••••"
                            />
                            <Input
                                label="Confirm Password"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                                placeholder="••••••••"
                            />

                            <Button type="submit" className="w-full mt-2" isLoading={loading}>
                                Create Account
                            </Button>
                        </div>

                        <div className="text-center text-sm text-gray-500 mt-6">
                            Already have an account?{' '}
                            <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-500 font-bold">
                                Sign In
                            </Link>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}

