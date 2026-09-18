'use client';
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { Smartphone, CheckCircle2, Loader2 } from 'lucide-react';

export default function DirectPaymentPage() {
    const [phone, setPhone] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'pending' | 'success'>('idle');
    const { showToast } = useToast();

    const handleSendPrompt = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!phone || phone.length < 10) {
            showToast('Please enter a valid phone number', 'error');
            return;
        }
        if (!amount || Number(amount) <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/mpesa/stk-push', {
                phoneNumber: phone,
                amount: Number(amount),
                items: [{ name: 'Direct Payment', quantity: 1, price: Number(amount) }]
            });
            
            setStatus('pending');
            showToast('M-Pesa prompt sent to customer!', 'success');
            
            // Poll for completion
            const checkoutReqId = res.data.CheckoutRequestID;
            let attempts = 0;
            
            // Expose interval ID so it can be cleared manually if needed (using state)
            const intervalId = setInterval(async () => {
                attempts++;
                if (attempts > 12) { // 36 sec timeout
                    clearInterval(intervalId);
                    setStatus('idle');
                    showToast('Payment prompt timed out. Customer did not complete in time.', 'error');
                    return;
                }
                
                try {
                    const checkRes = await api.get(`/mpesa/status/${checkoutReqId}`);
                    const data = checkRes.data;
                    
                    if (data.status === 'COMPLETED') {
                        clearInterval(intervalId);
                        setStatus('success');
                        setPhone('');
                        setAmount('');
                        showToast('Payment received successfully!', 'success');
                        setTimeout(() => setStatus('idle'), 5000);
                    } else if (data.status === 'FAILED') {
                        clearInterval(intervalId);
                        setStatus('idle');
                        let errorMsg = data.message || 'Payment was cancelled or failed.';
                        if (!data.message && data.transaction?.metadata) {
                            try {
                                const meta = JSON.parse(data.transaction.metadata);
                                if (meta.callbackError) errorMsg = meta.callbackError;
                            } catch(e){}
                        }
                        showToast(`M-Pesa response: ${errorMsg}`, 'error');
                    }
                } catch (e) {
                    console.error('Polling error:', e);
                }
            }, 3000);
            
            // Store the interval ID on the window so we can clear it in a cancel function
            (window as any).currentPaymentInterval = intervalId;
            
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to send prompt', 'error');
            setStatus('idle');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if ((window as any).currentPaymentInterval) {
            clearInterval((window as any).currentPaymentInterval);
        }
        setStatus('idle');
        showToast('Payment verification cancelled locally.', 'error');
    };

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto py-8 px-4">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Smartphone className="w-6 h-6" />
                        Direct M-Pesa Payment
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">Send an M-Pesa prompt directly to a customer's phone to collect payment.</p>
                </div>

                <Card className="p-6 dark:bg-zinc-900 dark:border-zinc-800">
                    {status === 'success' ? (
                        <div className="text-center py-12 animate-in fade-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Payment Successful!</h2>
                            <p className="text-zinc-500 mb-6">The funds have been credited successfully.</p>
                            <Button onClick={() => setStatus('idle')}>Receive Another Payment</Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSendPrompt} className="space-y-6">
                            <Input
                                label="Customer Phone Number"
                                value={phone}
                                onChange={(e: any) => setPhone(e.target.value)}
                                placeholder="07XX XXX XXX"
                                disabled={status === 'pending' || loading}
                                type="tel"
                                required
                            />
                            <Input
                                label="Amount (KES)"
                                value={amount}
                                onChange={(e: any) => setAmount(e.target.value)}
                                placeholder="100"
                                disabled={status === 'pending' || loading}
                                type="number"
                                min="1"
                                required
                            />

                            <div className="space-y-3">
                                <Button 
                                    type="submit" 
                                    className="w-full py-6 text-lg"
                                    disabled={status === 'pending' || loading}
                                >
                                    {status === 'pending' ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Waiting for customer to pay...
                                        </>
                                    ) : loading ? (
                                        'Sending Prompt...'
                                    ) : (
                                        'Send M-Pesa Prompt'
                                    )}
                                </Button>

                                {status === 'pending' && (
                                    <Button 
                                        type="button" 
                                        variant="outline"
                                        className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                                        onClick={handleCancel}
                                    >
                                        Cancel Waiting
                                    </Button>
                                )}
                            </div>
                        </form>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
}
