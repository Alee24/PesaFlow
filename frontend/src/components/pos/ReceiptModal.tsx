import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/Button';
import { X, Printer, CheckCircle } from 'lucide-react';

interface ReceiptModalProps {
    sale: any;
    onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Receipt-${sale.receiptNumber || sale.id.slice(0, 8)}`,
        onAfterPrint: onClose
    });

    if (!sale) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header Actions */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center no-print">
                    <div className="flex items-center gap-2 text-green-600 font-bold">
                        <CheckCircle className="w-5 h-5" />
                        <span>Sale Complete</span>
                    </div>
                    <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
                </div>

                {/* Receipt Preview Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    <div
                        ref={componentRef}
                        className="bg-white p-6 shadow-sm border border-gray-100 text-sm font-mono leading-relaxed"
                        style={{ width: '100%', maxWidth: '300px', margin: '0 auto' }}
                    >
                        {/* Store Info */}
                        <div className="text-center mb-4 border-b border-dashed border-gray-300 pb-4">
                            <h2 className="font-bold text-lg uppercase">Mpesa Connect</h2>
                            <p className="text-xs text-gray-500">Nairobi, Kenya</p>
                            <p className="text-xs text-gray-500">+254 700 000 000</p>
                        </div>

                        {/* Transaction Info */}
                        <div className="mb-4 text-xs">
                            <div className="flex justify-between">
                                <span>Date:</span>
                                <span>{new Date(sale.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Receipt #:</span>
                                <span>{sale.id.slice(0, 8).toUpperCase()}</span>
                            </div>
                            {sale.customerName && (
                                <div className="flex justify-between">
                                    <span>Customer:</span>
                                    <span>{sale.customerName}</span>
                                </div>
                            )}
                        </div>

                        {/* Items */}
                        <div className="mb-4 border-b border-dashed border-gray-300 pb-4">
                            <div className="grid grid-cols-12 font-bold mb-2 border-b border-gray-200 pb-1">
                                <span className="col-span-6">Item</span>
                                <span className="col-span-2 text-center">Qty</span>
                                <span className="col-span-4 text-right">Total</span>
                            </div>
                            {sale.items.map((item: any, i: number) => (
                                <div key={i} className="grid grid-cols-12 mb-1">
                                    <span className="col-span-6 truncate">{item.product?.name || 'Item'}</span>
                                    <span className="col-span-2 text-center">x{item.quantity}</span>
                                    <span className="col-span-4 text-right">{Number(item.subtotal).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="space-y-1 mb-4 border-b border-dashed border-gray-300 pb-4">
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>{Number(sale.subtotal).toLocaleString()}</span>
                            </div>
                            {Number(sale.discountAmount) > 0 && (
                                <div className="flex justify-between text-red-500">
                                    <span>Discount:</span>
                                    <span>-{Number(sale.discountAmount).toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg mt-2">
                                <span>TOTAL:</span>
                                <span>KES {Number(sale.totalAmount).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="space-y-1 text-xs mb-4">
                            <div className="flex justify-between font-bold">
                                <span>Method:</span>
                                <span>{sale.paymentMethod}</span>
                            </div>
                            {sale.paymentMethod === 'CASH' && (
                                <>
                                    <div className="flex justify-between">
                                        <span>Cash Tendered:</span>
                                        <span>KES {Number(sale.amountPaid).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Change:</span>
                                        <span>KES {Number(sale.changeGiven).toLocaleString()}</span>
                                    </div>
                                </>
                            )}
                            {sale.paymentMethod === 'MPESA_STK' && sale.customerPhone && (
                                <div className="flex justify-between">
                                    <span>Phone:</span>
                                    <span>{sale.customerPhone}</span>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="text-center text-xs text-gray-400 mt-6">
                            <p>Thank you for shopping with us!</p>
                            <p>Powered by Mpesa Connect</p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 flex gap-3 no-print">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Close
                    </Button>
                    <Button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2">
                        <Printer className="w-4 h-4" /> Print Receipt
                    </Button>
                </div>
            </div>
            <style jsx global>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body * {
                        visibility: hidden;
                    }
                    .bg-white.p-6.shadow-sm.border.border-gray-100 {
                        visibility: visible;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        border: none;
                        box-shadow: none;
                    }
                }
            `}</style>
        </div>
    );
};
