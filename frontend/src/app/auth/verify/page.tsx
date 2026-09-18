
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
    const emailParam = searchParams.get('email') || '';

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your email...');
    const [isAlreadyVerified, setIsAlreadyVerified] = useState(false);
    
    // Resend state
    const [resendEmail, setResendEmail] = useState(emailParam);
    const [isResending, setIsResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [resendError, setResendError] = useState('');

    const hasRequested = React.useRef(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token provided. Please check your verification link.');
            return;
        }

        if (hasRequested.current) return;
        hasRequested.current = true;

        const verify = async () => {
            try {
                const query = emailParam 
                    ? `/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(emailParam)}`
                    : `/auth/verify-email?token=${encodeURIComponent(token)}`;
                
                const res = await api.get(query);
                setStatus('success');
                setIsAlreadyVerified(!!res.data?.alreadyVerified);
                setMessage(res.data?.message || 'Your email has been verified successfully!');
            } catch (error: any) {
                setStatus('error');
                const errMsg = error.response?.data?.error || 'Verification failed. The link may have expired.';
                setMessage(errMsg);
                if (error.response?.data?.email && !resendEmail) {
                    setResendEmail(error.response.data.email);
                }
            }
        };

        verify();
    }, [token, emailParam]);

    const handleResend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resendEmail) {
            setResendError('Please enter your email address.');
            return;
        }

        try {
            setIsResending(true);
            setResendError('');
            const res = await api.post('/auth/resend-verification', { email: resendEmail });
            setResendSuccess(true);
            if (res.data?.alreadyVerified) {
                setStatus('success');
                setIsAlreadyVerified(true);
                setMessage(res.data.message);
            }
        } catch (err: any) {
            setResendError(err.response?.data?.error || 'Failed to resend verification email. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <Card className="p-8 text-center shadow-xl border-none">
            {status === 'verifying' && (
                <div className="flex flex-col items-center">
                    <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Your Email...</h2>
                    <p className="text-gray-500 text-sm">Please wait while we validate your verification token.</p>
                </div>
            )}

            {status === 'success' && (
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {isAlreadyVerified ? 'Already Verified!' : 'Email Verified!'}
                    </h2>
                    <p className="text-gray-600 mb-8 text-sm">{message}</p>
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
                    <p className="text-gray-600 mb-6 text-sm">{message}</p>

                    {resendSuccess ? (
                        <div className="w-full bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg mb-6 text-sm">
                            A fresh verification link has been sent to <strong>{resendEmail}</strong>. Please check your inbox or spam folder.
                        </div>
                    ) : (
                        <form onSubmit={handleResend} className="w-full space-y-3 mb-6 text-left">
                            <label className="block text-xs font-semibold text-gray-700">
                                Need a new verification link? Enter your email:
                            </label>
                            <input
                                type="email"
                                value={resendEmail}
                                onChange={(e) => setResendEmail(e.target.value)}
                                placeholder="name@business.co.ke"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                            {resendError && <p className="text-xs text-red-600">{resendError}</p>}
                            <Button 
                                type="submit" 
                                variant="outline" 
                                className="w-full" 
                                isLoading={isResending}
                            >
                                Resend Verification Link
                            </Button>
                        </form>
                    )}

                    <Link href="/auth/login" className="w-full">
                        <Button variant="ghost" className="w-full text-gray-500">Back to Login</Button>
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
