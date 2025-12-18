'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Printer, Download } from 'lucide-react';
import api from '@/lib/api';
import dynamic from 'next/dynamic';
import InvoicePDF from '@/components/pdf/InvoicePDF';

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    { ssr: false, loading: () => <Button disabled size="sm">Loading PDF...</Button> }
);

// ... (Interface InvoiceData remains same, keep it)

export default function InvoicePage() {
    const { id } = useParams();
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        status: '',
        title: '',
        description: '',
        variant: 'warning' as 'warning' | 'danger' | 'success' | 'info'
    });

    useEffect(() => {
        setIsClient(true);
        if (id) fetchInvoice();
    }, [id]);

    const fetchInvoice = async () => {
        try {
            const res = await api.get(`/transactions/${id}`);
            setInvoice(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return (
        <DashboardLayout>
            <div className="flex justify-center items-center h-full">Loading Invoice...</div>
        </DashboardLayout>
    );

    if (!invoice) return (
        <DashboardLayout>
            <div className="text-center py-20">Invoice not found</div>
        </DashboardLayout>
    );

    const biz = invoice.initiator?.businessProfile;

    // Parse metadata safely
    let metadata: any = {};
    if (typeof invoice.metadata === 'string') {
        try {
            metadata = JSON.parse(invoice.metadata);
        } catch (e) {
            console.error("Failed to parse metadata", e);
        }
    } else {
        metadata = invoice.metadata || {};
    }

    const initiateStatusUpdate = (newStatus: string) => {
        let title = 'Update Status';
        let description = `Are you sure you want to change status to ${newStatus}?`;
        let variant: 'warning' | 'danger' | 'success' = 'warning';

        if (newStatus === 'COMPLETED') {
            title = 'Mark as Paid';
            description = 'Are you sure you want to mark this invoice as PAID? This will record the transaction as completed and send a receipt to the client.';
            variant = 'success';
        } else if (newStatus === 'CANCELLED') {
            title = 'Cancel Invoice';
            description = 'Are you sure you want to CANCEL this invoice? This action cannot be undone.';
            variant = 'danger';
        } else if (newStatus === 'PENDING') {
            title = 'Revert to Pending';
            description = 'Are you sure you want to revert this invoice to PENDING status?';
            variant = 'warning';
        }

        setConfirmModal({
            isOpen: true,
            status: newStatus,
            title,
            description,
            variant
        });
    };

    const handleConfirmUpdate = async () => {
        setConfirmLoading(true);
        try {
            await api.patch(`/transactions/${id}/status`, { status: confirmModal.status });
            await fetchInvoice(); // Reload data
            setConfirmModal({ ...confirmModal, isOpen: false });
        } catch (error) {
            console.error(error);
            // Ideally assume global error handling or toast here, keeping it simple for now as per no toast component used in this file
            alert('Failed to update status'); // Fallback
        } finally {
            setConfirmLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
                <div className="flex justify-between items-center mb-6 print:hidden">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoice Details</h1>
                    <div className="flex gap-3">
                        {invoice && (
                            <div className="flex gap-2">
                                {invoice.status !== 'COMPLETED' && (
                                    <Button onClick={() => initiateStatusUpdate('COMPLETED')} variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
                                        Mark Paid
                                    </Button>
                                )}
                                {invoice.status === 'COMPLETED' && (
                                    <Button onClick={() => initiateStatusUpdate('PENDING')} variant="outline" className="text-yellow-600 border-yellow-200 hover:bg-yellow-50">
                                        Revert to Pending
                                    </Button>
                                )}
                                {invoice.status !== 'CANCELLED' && invoice.status !== 'COMPLETED' && (
                                    <Button onClick={() => initiateStatusUpdate('CANCELLED')} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        )}
                        <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
                            <Printer className="w-4 h-4" /> Print
                        </Button>
                        {isClient && (
                            <PDFDownloadLink document={<InvoicePDF invoice={invoice} />} fileName={`Invoice_${invoice.reference}.pdf`}>
                                {({ loading }) => (
                                    <Button disabled={loading} className="flex items-center gap-2">
                                        <Download className="w-4 h-4" /> {loading ? 'Generating...' : 'Download PDF'}
                                    </Button>
                                )}
                            </PDFDownloadLink>
                        )}
                    </div>
                </div>

                <Card id="invoice-content" className="flex-1 bg-white text-gray-900 p-10 print:shadow-none print:border-none print:p-0 print:w-full relative overflow-hidden">
                    {(invoice.status === 'COMPLETED' || invoice.status === 'PAID') && (
                        <img
                            src="https://cdn.pixabay.com/photo/2020/04/10/13/23/paid-5025785_1280.png"
                            alt="PAID"
                            className="absolute bottom-10 right-10 w-48 opacity-50 rotate-[-20deg] pointer-events-none z-0"
                        />
                    )}
                    {/* Header */}
                    <div className="flex justify-between items-start mb-12 border-b pb-8 relative z-10">
                        <div>
                            {biz?.logoUrl ? (
                                <img src={biz.logoUrl} alt="Logo" className="h-16 mb-4 object-contain" />
                            ) : (
                                <div className="text-3xl font-bold text-gray-800 uppercase mb-4">{biz?.companyName || 'YOUR LOGO'}</div>
                            )}
                            <h2 className="text-xl font-bold text-gray-900">{biz?.companyName || 'Company Name'}</h2>
                            <div className="text-sm text-gray-500 mt-2 space-y-1">
                                <p>{biz?.location || 'Location Address'}</p>
                                <p>{biz?.contactPhone || 'Phone Number'}</p>
                                <p>{biz?.email || 'Email Address'}</p>
                                {biz?.website && <p>{biz.website}</p>}
                            </div>
                        </div>
                        <div className="text-right">
                            <h3 className="text-4xl font-light text-indigo-600 mb-2">INVOICE</h3>
                            <p className="text-gray-500 font-medium">#{invoice.reference || invoice.id.slice(0, 8).toUpperCase()}</p>
                            <p className="text-gray-500 mt-1">Date: {new Date(metadata.invoiceDate || invoice.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Bill To & Details */}
                    <div className="flex justify-between items-start mb-12">
                        <div className="w-1/2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bill To:</h4>
                            <p className="font-bold text-gray-900 text-lg uppercase">{metadata.clientName || 'Walk-in Customer'}</p>
                            {metadata.clientAddress && <p className="text-gray-600 whitespace-pre-wrap">{metadata.clientAddress}</p>}
                            {metadata.clientPhone && <p className="text-gray-600">{metadata.clientPhone}</p>}
                            {metadata.clientEmail && <p className="text-gray-600">{metadata.clientEmail}</p>}
                        </div>
                        <div className="text-right">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Details</h4>
                            <p className="text-gray-900"><span className="font-medium">Total Due:</span> KES {Number(invoice.amount).toLocaleString()}</p>
                            <p className="text-sm text-gray-500 mt-1">Status: <span className={`font-bold uppercase ${invoice.status === 'PAID' ? 'text-green-600' : 'text-gray-600'}`}>{invoice.status}</span></p>
                        </div>
                    </div>

                    {/* Line Items */}
                    <table className="w-full mb-12">
                        <thead>
                            <tr className="border-b-2 border-gray-100">
                                <th className="text-left py-3 font-bold text-gray-600 uppercase text-xs tracking-wider">Description</th>
                                <th className="text-center py-3 font-bold text-gray-600 uppercase text-xs tracking-wider">Qty</th>
                                <th className="text-right py-3 font-bold text-gray-600 uppercase text-xs tracking-wider">Price</th>
                                <th className="text-right py-3 font-bold text-gray-600 uppercase text-xs tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {metadata.itemsSnapshot ? (
                                metadata.itemsSnapshot.map((item: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="py-4 text-gray-800 font-medium">{item.description || 'Item'}</td>
                                        <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                                        <td className="py-4 text-right text-gray-600">{Number(item.price).toLocaleString()}</td>
                                        <td className="py-4 text-right font-bold text-gray-900">{(Number(item.price) * Number(item.quantity)).toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : invoice.sale ? (
                                invoice.sale.items.map((item: any) => (
                                    <tr key={item.id}>
                                        <td className="py-4 text-gray-800">{item.product.name}</td>
                                        <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                                        <td className="py-4 text-right text-gray-600">{(Number(item.unitPrice)).toLocaleString()}</td>
                                        <td className="py-4 text-right font-medium text-gray-900">{(Number(item.subtotal)).toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td className="py-4 text-gray-800">Generic Invoice Item</td>
                                    <td className="py-4 text-center text-gray-600">1</td>
                                    <td className="py-4 text-right text-gray-600">{Number(invoice.amount).toLocaleString()}</td>
                                    <td className="py-4 text-right font-medium text-gray-900">{Number(invoice.amount).toLocaleString()}</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            {metadata.vatEnabled && (
                                <>
                                    <tr>
                                        <td colSpan={3} className="pt-6 text-right font-bold text-gray-600 uppercase">Subtotal</td>
                                        <td className="pt-6 text-right font-bold text-gray-600">KES {Number(metadata.subTotal || invoice.amount).toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3} className="pt-2 text-right font-bold text-gray-600 uppercase">Tax ({metadata.vatRate}%)</td>
                                        <td className="pt-2 text-right font-bold text-gray-600">KES {Number(metadata.vatAmount).toLocaleString()}</td>
                                    </tr>
                                </>
                            )}
                            <tr>
                                <td colSpan={3} className={`text-right font-bold text-gray-900 text-lg uppercase ${metadata.vatEnabled ? 'pt-4 border-t' : 'pt-6'}`}>Grand Total</td>
                                <td className={`text-right font-bold text-[#1a2b42] text-lg ${metadata.vatEnabled ? 'pt-4 border-t' : 'pt-6'}`}>KES {Number(invoice.amount).toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* Footer Info */}
                    <div className="grid grid-cols-2 gap-8 border-t pt-8">
                        {biz?.vatNumber && (
                            <div>
                                <h4 className="font-bold text-sm text-gray-700 mb-1">Tax Info</h4>
                                <p className="text-sm text-gray-500">VAT No: {biz.vatNumber}</p>
                            </div>
                        )}
                        {(biz?.bankDetails || biz?.mpesaDetails) && (
                            <div>
                                <h4 className="font-bold text-sm text-gray-700 mb-1">Payment Info</h4>
                                <div className="text-sm text-gray-500 whitespace-pre-line">
                                    {biz.bankDetails}
                                    {biz.bankDetails && biz.mpesaDetails && '\n\n'}
                                    {biz.mpesaDetails}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-12 text-center text-sm text-gray-400">
                        <p>Thank you for your business!</p>
                    </div>
                </Card>
            </div>

            <style jsx global>{`
                @media print {
                    @page { 
                        size: A4; 
                        margin: 0; 
                    }
                    body { 
                        visibility: hidden;
                        background: white;
                    }
                    
                    /* Hide everything by default */
                    #invoice-content {
                        visibility: visible;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 210mm !important;
                        min-height: 297mm !important;
                        margin: 0 !important;
                        padding: 20mm !important; /* Internal padding */
                        box-shadow: none !important;
                        border: none !important;
                        overflow: visible !important;
                        background: white !important;
                    }
                    
                    /* Ensure children are visible */
                    #invoice-content * {
                        visibility: visible;
                    }

                    /* Hide interactive elements inside invoice if any accidentally checked */
                    button, .no-print {
                        display: none !important;
                    }
                }
            `}</style>
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleConfirmUpdate}
                title={confirmModal.title}
                description={confirmModal.description}
                variant={confirmModal.variant}
                loading={confirmLoading}
            />
        </DashboardLayout>
    );
}
