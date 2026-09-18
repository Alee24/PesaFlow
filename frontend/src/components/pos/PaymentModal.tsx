
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, CheckCircle, Smartphone, Banknote, Gift, UserPlus, SkipForward, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { normalizePhoneNumber } from '@/lib/phoneUtils';
import toast from 'react-hot-toast';

interface PaymentModalProps {
    totalAmount: number;
    items: any[];
    discountType?: 'PERCENTAGE' | 'FIXED';
    discountValue?: number;
    onClose: () => void;
    onSuccess: (sale: any) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ totalAmount, items, discountType, discountValue, onClose, onSuccess }) => {
    const [method, setMethod] = useState<'CASH' | 'MPESA'>('CASH');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'payment' | 'loyalty' | 'mpesa-pending'>('payment');

    // Cash State
    const [tendered, setTendered] = useState<string>('');
    const change = Number(tendered) - totalAmount;

    // M-Pesa State
    const [phone, setPhone] = useState('');
    const [mpesaStatus, setMpesaStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
    const [checkoutRequestId, setCheckoutRequestId] = useState<string>('');
    const [checkAttempts, setCheckAttempts] = useState(0);
    const [lastSaleCheck, setLastSaleCheck] = useState<any>(null);

    // Loyalty State
    const [loyaltyPhone, setLoyaltyPhone] = useState('');
    const [loyaltyIdNumber, setLoyaltyIdNumber] = useState('');
    const [loyaltyName, setLoyaltyName] = useState('');
    const [loyaltyCustomer, setLoyaltyCustomer] = useState<any>(null);
    const [pointsToEarn, setPointsToEarn] = useState(0);

    const [mpesaEnabled, setMpesaEnabled] = useState(true);

    useEffect(() => {
        const checkMpesaStatus = async () => {
            try {
                const res = await api.get('/profile');
                if (res.data && res.data.mpesaConsumerKey && res.data.useCustomMpesa) {
                    setMpesaEnabled(true);
                } else if (!res.data.useCustomMpesa && res.data.mpesaConsumerKey) {
                    // System default Mpesa might be in use
                    setMpesaEnabled(true);
                } else if (!res.data.mpesaConsumerKey && !res.data.useCustomMpesa) {
                    // It's possible the system default is active. Let's assume false if skipped.
                    // Wait, if they skipped, they have no mpesaConsumerKey. Let's check backend endpoint or assume disabled if no keys.
                    // To be safe, we'll try to let it enabled if system config is valid, but here we can just check if they have keys or system keys.
                    // But if they skipped, they don't have custom keys. We will hide it if they explicitly have no keys and it's not custom.
                    // For now, let's keep it simple: fetch /mpesa/test to see if it's configured, but that triggers an SMS/Token.
                    // We'll trust the profile: if no mpesaConsumerKey, hide it (assuming they skipped).
                    setMpesaEnabled(!!res.data.mpesaConsumerKey);
                }
            } catch (err) {
                console.error(err);
            }
        };
        checkMpesaStatus();
    }, []);

    // Auto-check payment status every 3 seconds when pending
    useEffect(() => {
        if (step === 'mpesa-pending' && checkoutRequestId) {
            const interval = setInterval(() => {
                checkPaymentStatus();
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [step, checkoutRequestId]);

    // Search or register loyalty customer
    const handleLoyaltySearch = async (identifier: string) => {
        try {
            const res = await api.get(`/loyalty/customers/search?query=${identifier}`);
            setLoyaltyCustomer(res.data);
            toast.success(`Welcome back, ${res.data.name || 'Customer'}!`);

            // Calculate points to earn
            const profile = await api.get('/profile');
            const pointsPerKES = profile.data.pointsPerKES || 1;
            setPointsToEarn(Math.floor(totalAmount / pointsPerKES));
        } catch (error) {
            // Customer not found - will register new
            setLoyaltyCustomer(null);
        }
    };

    const checkPaymentStatus = async () => {
        if (!checkoutRequestId) return;

        try {
            setLoading(true);
            // Check if a sale was created with this checkout request
            const res = await api.get(`/sales?checkoutRequestId=${checkoutRequestId}`);

            if (res.data && res.data.length > 0) {
                const sale = res.data[0];
                if (sale.paymentStatus === 'PAID') {
                    toast.success('Payment confirmed! Sale completed.');
                    onSuccess(sale);
                    return;
                }
            }

            setCheckAttempts(prev => prev + 1);
            toast('Payment still pending...', { icon: '⏳' });
        } catch (error) {
            console.error('Error checking payment status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCashPay = async () => {
        if (Number(tendered) < totalAmount) return;

        // For cash, show loyalty registration option
        if (step === 'payment') {
            setStep('loyalty');
            return;
        }

        // Complete sale with optional loyalty
        await completeSale('CASH', Number(tendered));
    };

    const completeSale = async (paymentMethod: string, amountPaid: number, skipLoyalty = false) => {
        setLoading(true);
        try {
            let loyaltyData = null;

            // Register or find loyalty customer if not skipped
            if (!skipLoyalty && (loyaltyPhone || loyaltyIdNumber)) {
                try {
                    if (!loyaltyCustomer) {
                        // Register new customer
                        const registerRes = await api.post('/loyalty/customers', {
                            phoneNumber: loyaltyPhone || null,
                            idNumber: loyaltyIdNumber || null,
                            name: loyaltyName || null
                        });
                        loyaltyData = registerRes.data;
                    } else {
                        loyaltyData = loyaltyCustomer;
                    }
                } catch (error) {
                    console.error('Loyalty registration failed:', error);
                    // Continue with sale even if loyalty fails
                }
            }

            const res = await api.post('/sales/cash', {
                items,
                totalAmount,
                discountType,
                discountValue,
                amountPaid,
                paymentMethod,
                loyaltyCustomerId: loyaltyData?.id || null
            });

            // Award points if loyalty customer
            if (loyaltyData && res.data.sale) {
                try {
                    await api.post('/loyalty/earn', {
                        customerId: loyaltyData.id,
                        saleId: res.data.sale.id,
                        amount: totalAmount
                    });
                    toast.success(`🎉 ${pointsToEarn} loyalty points earned!`);
                } catch (error) {
                    console.error('Failed to award points:', error);
                }
            }

            onSuccess(res.data.sale);
        } catch (error: any) {
            console.error("Sale Failed", error);
            const errorMessage = error.response?.data?.error || "Failed to process sale";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleMpesaTrigger = async () => {
        setMpesaStatus('pending');
        setLoading(true);

        try {
            // Auto-register loyalty customer with M-Pesa phone
            let loyaltyData = null;
            try {
                const searchRes = await api.get(`/loyalty/customers/search?query=${normalizePhoneNumber(phone)}`);
                loyaltyData = searchRes.data;
            } catch (error) {
                // Register new customer automatically
                try {
                    const registerRes = await api.post('/loyalty/customers', {
                        phoneNumber: normalizePhoneNumber(phone),
                        name: null
                    });
                    loyaltyData = registerRes.data;
                    toast.success('Customer registered for loyalty program!');
                } catch (regError) {
                    console.error('Auto-registration failed:', regError);
                }
            }

            // Trigger STK Push
            const res = await api.post('/mpesa/stk-push', {
                amount: totalAmount,
                phoneNumber: normalizePhoneNumber(phone),
                items,
                discountType,
                discountValue,
                loyaltyCustomerId: loyaltyData?.id || null
            });

            // Store checkout request ID for status checking
            if (res.data.CheckoutRequestID) {
                setCheckoutRequestId(res.data.CheckoutRequestID);
            }

            toast.success('STK Push Sent! Customer should enter PIN on their phone.');
            setMpesaStatus('success');
            setStep('mpesa-pending');

        } catch (error: any) {
            console.error(error);
            setMpesaStatus('failed');
            const errorMessage = error?.response?.data?.error || "Payment Failed. Please try again.";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelPayment = () => {
        if (confirm('Are you sure you want to cancel this payment? The transaction may still be processing.')) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">
                        {step === 'payment' ? 'Checkout' : step === 'loyalty' ? 'Loyalty Program' : 'Payment Pending'}
                    </h2>
                    <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {step === 'payment' && (
                        <>
                            <div className="text-center mb-8">
                                <p className="text-gray-500 text-sm">Amount Due</p>
                                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">KES {totalAmount.toLocaleString()}</h1>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <button
                                    onClick={() => setMethod('CASH')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${method === 'CASH' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-200'}`}
                                >
                                    <Banknote className="w-8 h-8 mb-2" />
                                    <span className="font-bold">Cash</span>
                                </button>
                                {mpesaEnabled && (
                                    <button
                                        onClick={() => setMethod('MPESA')}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${method === 'MPESA' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-200'}`}
                                    >
                                        <Smartphone className="w-8 h-8 mb-2" />
                                        <span className="font-bold">M-Pesa</span>
                                    </button>
                                )}
                            </div>

                            {method === 'CASH' && (
                                <div className="space-y-4">
                                    <Input
                                        label="Amount Tendered"
                                        type="number"
                                        value={tendered}
                                        onChange={(e) => setTendered(e.target.value)}
                                        autoFocus
                                        className="text-lg"
                                    />
                                    {Number(tendered) > 0 && (
                                        <div className={`p-4 rounded-lg flex justify-between items-center ${change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            <span className="font-semibold">{change >= 0 ? 'Change' : 'Short'}</span>
                                            <span className="text-xl font-bold">{Math.abs(change).toLocaleString()}</span>
                                        </div>
                                    )}
                                    <Button
                                        className="w-full py-3 text-lg"
                                        onClick={handleCashPay}
                                        disabled={change < 0 || loading}
                                        isLoading={loading}
                                    >
                                        Continue to Loyalty
                                    </Button>
                                </div>
                            )}

                            {method === 'MPESA' && (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                                        <div className="flex items-start gap-2">
                                            <Gift className="w-5 h-5 text-blue-600 mt-0.5" />
                                            <div className="text-sm text-blue-800 dark:text-blue-200">
                                                <p className="font-semibold">Automatic Loyalty Registration</p>
                                                <p>Customer will be registered for loyalty points automatically</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Input
                                        label="Customer Phone"
                                        placeholder="07123456789 or 7123456789"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                    <Button
                                        className="w-full py-3 text-lg bg-green-600 hover:bg-green-700"
                                        onClick={handleMpesaTrigger}
                                        disabled={!phone || loading}
                                        isLoading={loading}
                                    >
                                        {loading ? 'Sending Request...' : 'Send M-Pesa Request'}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}

                    {step === 'mpesa-pending' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4 animate-pulse">
                                    <Clock className="w-10 h-10 text-yellow-600" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Payment Pending</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                    Waiting for customer to complete payment on their phone
                                </p>
                                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">KES {totalAmount.toLocaleString()}</p>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                    <div className="flex items-center gap-2 justify-center text-blue-800 dark:text-blue-200">
                                        <AlertCircle className="w-4 h-4" />
                                        <p className="text-sm">Auto-checking every 3 seconds...</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    className="w-full py-3 text-lg"
                                    onClick={checkPaymentStatus}
                                    disabled={loading}
                                    isLoading={loading}
                                >
                                    <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                    Check Payment Status Now
                                </Button>

                                {checkAttempts >= 1 && (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="w-full py-3 text-lg border-green-300 text-green-600 hover:bg-green-50"
                                            onClick={async () => {
                                                try {
                                                    setLoading(true);
                                                    // Fetch the most recent sale for this amount
                                                    const res = await api.get(`/sales?limit=10`);
                                                    const recentSale = res.data.find((s: any) =>
                                                        Math.abs(parseFloat(s.totalAmount) - totalAmount) < 1 &&
                                                        s.paymentMethod === 'MPESA_STK'
                                                    );

                                                    if (recentSale) {
                                                        toast.success('Receipt found!');
                                                        onSuccess(recentSale);
                                                    } else {
                                                        toast.error('No matching receipt found. Payment may still be processing.');
                                                    }
                                                } catch (error) {
                                                    toast.error('Failed to fetch receipt');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            disabled={loading}
                                        >
                                            <CheckCircle className="w-5 h-5 mr-2" />
                                            Show Receipt (If Paid)
                                        </Button>

                                        <Button
                                            className="w-full py-3 text-lg bg-green-600 hover:bg-green-700 text-white"
                                            onClick={async () => {
                                                if (!confirm('Confirm that customer has completed M-Pesa payment?')) {
                                                    return;
                                                }

                                                try {
                                                    setLoading(true);

                                                    // Create sale record manually
                                                    const res = await api.post('/sales/mpesa-manual', {
                                                        items,
                                                        totalAmount,
                                                        discountType,
                                                        discountValue,
                                                        phoneNumber: phone,
                                                        checkoutRequestId: checkoutRequestId || 'MANUAL_COMPLETION'
                                                    });

                                                    toast.success('Payment marked as complete! Sale created.');
                                                    onSuccess(res.data.sale);
                                                } catch (error: any) {
                                                    console.error('Manual completion error:', error);
                                                    toast.error(error.response?.data?.error || 'Failed to complete payment');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            disabled={loading}
                                            isLoading={loading}
                                        >
                                            <CheckCircle className="w-5 h-5 mr-2" />
                                            Mark as Complete
                                        </Button>
                                    </>
                                )}

                                {checkAttempts >= 2 && (
                                    <Button
                                        variant="outline"
                                        className="w-full py-3 text-lg border-red-300 text-red-600 hover:bg-red-50"
                                        onClick={handleCancelPayment}
                                    >
                                        <X className="w-5 h-5 mr-2" />
                                        Cancel Payment
                                    </Button>
                                )}

                                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                    Attempts: {checkAttempts}
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 'loyalty' && method === 'CASH' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
                                    <Gift className="w-8 h-8 text-indigo-600" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Join Our Loyalty Program</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Earn points with every purchase and get rewards!
                                </p>
                            </div>

                            <div className="space-y-4">
                                <Input
                                    label="Phone Number (Optional)"
                                    placeholder="07123456789"
                                    value={loyaltyPhone}
                                    onChange={(e) => {
                                        setLoyaltyPhone(e.target.value);
                                        if (e.target.value.length >= 10) {
                                            handleLoyaltySearch(e.target.value);
                                        }
                                    }}
                                />
                                <Input
                                    label="ID Number (Optional)"
                                    placeholder="12345678"
                                    value={loyaltyIdNumber}
                                    onChange={(e) => {
                                        setLoyaltyIdNumber(e.target.value);
                                        if (e.target.value.length >= 7) {
                                            handleLoyaltySearch(e.target.value);
                                        }
                                    }}
                                />
                                <Input
                                    label="Name (Optional)"
                                    placeholder="Customer Name"
                                    value={loyaltyName}
                                    onChange={(e) => setLoyaltyName(e.target.value)}
                                />

                                {loyaltyCustomer && (
                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                        <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                                            ✓ Customer Found: {loyaltyCustomer.name || 'Registered Customer'}
                                        </p>
                                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                            Current Points: {loyaltyCustomer.availablePoints} | Will earn: {pointsToEarn} points
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    className="w-full py-3"
                                    onClick={() => completeSale('CASH', Number(tendered), true)}
                                    disabled={loading}
                                >
                                    <SkipForward className="w-4 h-4 mr-2" />
                                    Skip
                                </Button>
                                <Button
                                    className="w-full py-3"
                                    onClick={() => completeSale('CASH', Number(tendered), false)}
                                    disabled={loading || (!loyaltyPhone && !loyaltyIdNumber)}
                                    isLoading={loading}
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Complete Sale
                                </Button>
                            </div>

                            <button
                                onClick={() => setStep('payment')}
                                className="w-full text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                ← Back to Payment
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
