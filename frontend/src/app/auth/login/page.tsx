
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';

import { useAuth } from '@/contexts/AuthContext';

import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/auth/login', formData);
            if (res.data.token && res.data.user) {
                login(res.data.token, res.data.user);
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (err: any) {
            console.error("Login Failure:", err);
            const errorMessage = err.response?.data?.error || err.message || 'Connection failed. Please try again.';
            setError(errorMessage);
            setLoading(false); // Immediate reset on error
        } finally {
            // Only set loading false if we didn't redirect
            // Note: login() handles the redirect
            setTimeout(() => setLoading(false), 5000); // Safety timeout
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2" />

            <div className="w-full max-w-md relative z-10">
                <Link 
                    href="/" 
                    className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-600 transition-all font-bold group mb-10"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Return to Home</span>
                </Link>

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                        Mpesa Connect Freedom
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Enterprise Suite &bull; Lifetime Access</p>
                </div>

                <Card title="Welcome Back">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <Input
                            label="Email Address"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            placeholder="you@example.com"
                        />

                        <Input
                            label="Password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            placeholder="••••••••"
                        />

                        <Button type="submit" className="w-full" isLoading={loading}>
                            Sign In
                        </Button>

                        <div className="text-center text-sm text-gray-500">
                            Don't have an account?{' '}
                            <Link href="/auth/register" className="text-indigo-600 hover:text-indigo-500 font-medium">
                                Register
                            </Link>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
