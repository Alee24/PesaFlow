
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, XCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

function VerifyContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        const verify = async () => {
            try {
                await api.get(`/auth/verify-email?token=${token}`);
                setStatus('success');
                setMessage('Your email has been verified successfully!');
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.error || 'Verification failed. The link may be expired.');
            }
        };

        verify();
    }, [token]);

    return (
        <Card className="p-8 text-center shadow-xl border-none">
            {status === 'verifying' && (
                <div className="flex flex-col items-center">
                    <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying...</h2>
                    <p className="text-gray-500">Please wait while we check your verification token.</p>
                </div>
            )}

            {status === 'success' && (
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
                    <p className="text-gray-600 mb-8">{message}</p>
                    <Link href="/auth/login" className="w-full">
                        <Button className="w-full">Continue to Login</Button>
                    </Link>
                </div>
            )}

            {status === 'error' && (
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                        <XCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
                    <p className="text-gray-600 mb-8">{message}</p>
                    <Link href="/auth/login" className="w-full">
                        <Button variant="outline" className="w-full">Back to Login</Button>
                    </Link>
                </div>
            )}
        </Card>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
                        Mpesa Connect
                    </h1>
                </div>
                <Suspense fallback={
                    <Card className="p-8 text-center shadow-xl border-none">
                        <div className="flex flex-col items-center">
                            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
                        </div>
                    </Card>
                }>
                    <VerifyContent />
                </Suspense>
            </div>
        </div>
    );
}
