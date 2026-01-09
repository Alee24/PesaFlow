
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, CheckCircle, Smartphone, Banknote } from 'lucide-react';
import api from '@/lib/api';
import { normalizePhoneNumber } from '@/lib/phoneUtils';

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

    // Cash State
    const [tendered, setTendered] = useState<string>('');
    const change = Number(tendered) - totalAmount;

    // M-Pesa State
    const [phone, setPhone] = useState('');
    const [mpesaStatus, setMpesaStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');

    const handleCashPay = async () => {
        if (Number(tendered) < totalAmount) return; // Prevent underpayment
        setLoading(true);
        try {
            const res = await api.post('/sales/cash', {
                items,
                totalAmount,
                discountType,
                discountValue,
                amountPaid: Number(tendered),
                paymentMethod: 'CASH'
            });
            onSuccess(res.data.sale);
        } catch (error) {
            console.error("Cash Sale Failed", error);
            alert("Failed to process sale");
        } finally {
            setLoading(false);
        }
    };

    const handleMpesaTrigger = async () => {
        setMpesaStatus('pending');
        setLoading(true);
        try {
            // 1. Trigger STK Push (Real world: wait for callback)
            const stkRes = await api.post('/mpesa/stk-push', {
                amount: totalAmount,
                phoneNumber: normalizePhoneNumber(phone)
            });

            // 2. For Prototype/MVP: Record the sale immediately as if it succeeded
            // In production, we'd poll status or wait for webhook
            const saleRes = await api.post('/sales/cash', {
                items,
                totalAmount,
                discountType,
                discountValue,
                customerPhone: phone,
                amountPaid: totalAmount,
                paymentMethod: 'MPESA_STK'
            });

            alert(`STK Sent! Recording sale...`);
            setMpesaStatus('success');
            onSuccess(saleRes.data.sale);

        } catch (error) {
            console.error(error);
            setMpesaStatus('failed');
            alert("Payment Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Checkout</h2>
                    <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="text-center mb-8">
                        <p className="text-gray-500 text-sm">Amount Due</p>
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">KES {totalAmount.toLocaleString()}</h1>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <button
                            onClick={() => setMethod('CASH')}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${method === 'CASH' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-indigo-200'}`}
                        >
                            <Banknote className="w-8 h-8 mb-2" />
                            <span className="font-bold">Cash</span>
                        </button>
                        <button
                            onClick={() => setMethod('MPESA')}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${method === 'MPESA' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-200'}`}
                        >
                            <Smartphone className="w-8 h-8 mb-2" />
                            <span className="font-bold">M-Pesa</span>
                        </button>
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
                                Complete Sale
                            </Button>
                        </div>
                    )}

                    {method === 'MPESA' && (
                        <div className="space-y-4">
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
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
