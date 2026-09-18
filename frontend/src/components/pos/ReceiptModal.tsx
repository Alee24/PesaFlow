import React, { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/Button';
import { X, Printer, CheckCircle, Mail } from 'lucide-react';
import { EmailModal } from '@/components/ui/EmailModal';
import { pdf } from '@react-pdf/renderer';
import ReceiptPDF from '@/components/pdf/ReceiptPDF';
import toast from 'react-hot-toast';

interface ReceiptModalProps {
    sale: any;
    onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
    const componentRef = useRef<HTMLDivElement>(null);
    const [logo, setLogo] = useState<string>('/logo.png');
    const [companyName, setCompanyName] = useState<string>('Mpesa Connect');
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);

    React.useEffect(() => {
        // Fetch current merchant's profile, fallback is handled in backend
        import('@/lib/api').then(({ default: api }) => {
            api.get('/profile').then((res) => {
                if (res.data) {
                    if (res.data.companyName) setCompanyName(res.data.companyName);
                    
                    if (res.data.logoUrl) {
                        setLogo(res.data.logoUrl.startsWith('http') ? res.data.logoUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || ''}${res.data.logoUrl}`);
                    } else {
                        // If no logo, fetch public settings which should have the platform logo
                        api.get('/settings/public').then((pubRes) => {
                            if (pubRes.data?.logoUrl) {
                                setLogo(pubRes.data.logoUrl.startsWith('http') ? pubRes.data.logoUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || ''}${pubRes.data.logoUrl}`);
                            }
                        });
                    }
                }
            }).catch(console.error);
        });
    }, []);

    const handleSendEmail = async (email: string) => {
        setSendingEmail(true);
        try {
            // Generate PDF Blob using the standalone PDF component
            const transactionForPdf = { sale, status: 'COMPLETED', reference: sale.receiptNumber, amount: sale.totalAmount, type: 'SALE', id: sale.id };
            const blob = await pdf(<ReceiptPDF transaction={transactionForPdf} globalLogo={logo} />).toBlob();

            const formData = new FormData();
            formData.append('to', email);
            formData.append('file', blob, `Receipt_${sale.receiptNumber || sale.id.slice(0, 8)}.pdf`);

            const api = (await import('@/lib/api')).default;
            await api.post(`/sales/${sale.id}/email`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            toast.success('Receipt sent successfully');
            setIsEmailModalOpen(false);
        } catch (error) {
            console.error('Failed to send email', error);
            toast.error('Failed to send email');
        } finally {
            setSendingEmail(false);
        }
    };

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
                    <div className={`flex items-center gap-2 font-bold ${sale.paymentStatus === 'PAID' ? 'text-green-600' :
                        sale.paymentStatus === 'PENDING' ? 'text-yellow-600' :
                            'text-red-600'
                        }`}>
                        <CheckCircle className="w-5 h-5" />
                        <span>
                            {sale.paymentStatus === 'PAID' ? 'Sale Complete' :
                                sale.paymentStatus === 'PENDING' ? 'PAYMENT PENDING' :
                                    'SALE INCOMPLETE'}
                        </span>
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
                            <div className="flex justify-center mb-2">
                                <img src={logo} alt={companyName} className="h-20 w-auto object-contain" />
                            </div>
                            <p className="font-bold text-lg uppercase hidden">{companyName}</p>
                            <p className="text-xs text-gray-500">Nairobi, Kenya</p>
                            <p className="text-xs text-gray-500">www.mpesaconnect.co.ke</p>
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
                            {sale.paymentMethod === 'MPESA_STK' && sale.transaction?.feeCharged && Number(sale.transaction.feeCharged) > 0 && (
                                <div className="flex justify-between text-orange-600">
                                    <span>Service Charge:</span>
                                    <span>-{Number(sale.transaction.feeCharged).toLocaleString()}</span>
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

                        {/* Notes / KRA Info */}
                        {sale.notes && (
                            <div className="mb-4 text-[10px] text-gray-600 border-t border-dashed border-gray-300 pt-2 whitespace-pre-wrap text-center">
                                {sale.notes}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="text-center text-xs text-gray-400 mt-6">
                            <p>Thank you for shopping with us!</p>
                            <p className="font-bold mt-1">Powered by KK Dynamic Enterprise Solutions LTD</p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 flex gap-3 no-print flex-wrap">
                    <Button variant="outline" onClick={onClose} className="flex-1 min-w-[100px]">
                        Close
                    </Button>
                    <Button variant="outline" onClick={() => setIsEmailModalOpen(true)} className="flex-1 min-w-[100px] flex items-center justify-center gap-2">
                        <Mail className="w-4 h-4" /> Email
                    </Button>
                    <Button onClick={handlePrint} className="flex-1 min-w-[140px] flex items-center justify-center gap-2">
                        <Printer className="w-4 h-4" /> Print Receipt
                    </Button>
                </div>
            </div>

            <EmailModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                onSend={handleSendEmail}
                isLoading={sendingEmail}
                title="Email Receipt"
                defaultEmail={sale?.customerEmail || ''}
            />
        </div>
    );
};
