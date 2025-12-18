
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, CheckCircle, Smartphone, Banknote } from 'lucide-react';
import api from '@/lib/api';

interface PaymentModalProps {
    totalAmount: number;
    items: any[];
    onClose: () => void;
    onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ totalAmount, items, onClose, onSuccess }) => {
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
            await api.post('/sales/cash', {
                items,
                totalAmount
            });
            onSuccess(); // Triggers receipt and clears cart
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
            // Initiate STK Status
            // NOTE: The current backend initiateSTKPush creates a Transaction, but doesn't auto-create a Sale record linked to items yet unless we refactor.
            // For now, we assume this is a "Payment Request". After success, we might need to "Record Sale".
            // Implementation Plan update: We might need a specific '/sales/mpesa' endpoint that does both (STK + Record Pending Sale).
            // Let's use the existingSTK for now and maybe poll. 
            // Actually, for POS, best flow is: 
            // 1. Trigger STK. 
            // 2. Poll Transaction Status. 
            // 3. If Success -> Record Sale via API (or Backend callback does it? Callback is async/hook based).
            // Simplest for now: Trigger STK. Poll Check Status. If Paid -> Call /sales/cash (or similar) but mark as M-Pesa?
            // Actually, let's keep it simple: We need a backend endpoint that handles "Full M-Pesa POS Sale".

            // For this iteration, let's just simulate interface or use basic STK.
            const res = await api.post('/mpesa/stkpush', {
                amount: totalAmount,
                phoneNumber: phone
            });

            // In a real POS, we'd poll here. For prototype, we show "Sent".
            // User manually confirms on phone, then clicks "Confirm Payment" to finalize local record if we don't have autosync.
            // Or better: We just Wait.

            alert(`STK Push Sent: ${res.data.CheckoutRequestID}. Checks not fully implemented yet.`);
            setMpesaStatus('success'); // Faking success for UI flow
            onSuccess();

        } catch (error) {
            console.error(error);
            setMpesaStatus('failed');
            alert("STK Push Failed");
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
                                placeholder="2547..."
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
