'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Printer, Download } from 'lucide-react';
import api from '@/lib/api';

interface InvoiceData {
    id: string;
    createdAt: string;
    amount: string;
    reference: string;
    initiator: {
        email: string;
        businessProfile?: {
            companyName: string;
            logoUrl?: string;
            contactPhone?: string;
            email?: string;
            location?: string;
            vatNumber?: string;
            website?: string;
            bankDetails?: string;
            mpesaDetails?: string;
        };
    };
    sale?: {
        items: Array<{
            id: string;
            quantity: number;
            unitPrice: string;
            subtotal: string;
            product: {
                name: string;
            };
        }>;
    };
}

export default function InvoicePage() {
    const { id } = useParams();
    const [invoice, setInvoice] = useState<InvoiceData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchInvoice();
    }, [id]);

    const fetchInvoice = async () => {
        try {
            const res = await api.get(`/transactions/${id}`);
            setInvoice(res.data);
        } catch (error) {
            console.error(error);
            alert("Failed to load invoice");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-full">Loading Invoice...</div>
            </DashboardLayout>
        );
    }

    if (!invoice) {
        return (
            <DashboardLayout>
                <div className="text-center py-20">Invoice not found</div>
            </DashboardLayout>
        );
    }

    const biz = invoice.initiator.businessProfile;

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
                <div className="flex justify-between items-center mb-6 print:hidden">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoice Details</h1>
                    <Button onClick={handlePrint} className="flex items-center gap-2">
                        <Printer className="w-4 h-4" /> Print Invoice
                    </Button>
                </div>

                <Card className="flex-1 bg-white text-gray-900 p-10 print:shadow-none print:border-none print:p-0">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-12 border-b pb-8">
                        <div>
                            {biz?.logoUrl && (
                                <img src={biz.logoUrl} alt="Logo" className="h-16 mb-4 object-contain" />
                            )}
                            <h2 className="text-2xl font-bold text-gray-900">{biz?.companyName || 'Company Name'}</h2>
                            <div className="text-sm text-gray-500 mt-2 space-y-1">
                                <p>{biz?.location || 'Location Address'}</p>
                                <p>{biz?.contactPhone || 'Phone Number'}</p>
                                <p>{biz?.email || 'Email Address'}</p>
                                <p>{biz?.website}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h3 className="text-4xl font-light text-indigo-600 mb-2">INVOICE</h3>
                            <p className="text-gray-500 font-medium">#{invoice.reference || invoice.id.slice(0, 8).toUpperCase()}</p>
                            <p className="text-gray-500 mt-1">Date: {new Date(invoice.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Bill To & Details */}
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bill To</h4>
                            <p className="font-semibold text-gray-900">Walk-in Customer</p>
                        </div>
                        <div className="text-right">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Details</h4>
                            <p className="text-gray-900"><span className="font-medium">Total Due:</span> KES {Number(invoice.amount).toLocaleString()}</p>
                            <p className="text-sm text-gray-500 mt-1">Status: <span className="text-green-600 font-bold uppercase">Paid</span></p>
                        </div>
                    </div>

                    {/* Line Items */}
                    <table className="w-full mb-12">
                        <thead>
                            <tr className="border-b-2 border-gray-100">
                                <th className="text-left py-3 font-bold text-gray-600">Item Description</th>
                                <th className="text-center py-3 font-bold text-gray-600">Qty</th>
                                <th className="text-right py-3 font-bold text-gray-600">Price</th>
                                <th className="text-right py-3 font-bold text-gray-600">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {invoice.sale ? (
                                invoice.sale.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-4 text-gray-800">{item.product.name}</td>
                                        <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                                        <td className="py-4 text-right text-gray-600">{(Number(item.unitPrice)).toLocaleString()}</td>
                                        <td className="py-4 text-right font-medium text-gray-900">{(Number(item.subtotal)).toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td className="py-4 text-gray-800">General M-Pesa Payment</td>
                                    <td className="py-4 text-center text-gray-600">1</td>
                                    <td className="py-4 text-right text-gray-600">{Number(invoice.amount).toLocaleString()}</td>
                                    <td className="py-4 text-right font-medium text-gray-900">{Number(invoice.amount).toLocaleString()}</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={3} className="pt-6 text-right font-bold text-gray-900 text-lg">Total Amount</td>
                                <td className="pt-6 text-right font-bold text-indigo-600 text-lg">KES {Number(invoice.amount).toLocaleString()}</td>
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
                        background: white; 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact; 
                    }
                    nav, aside, button, .print\\:hidden { display: none !important; }
                    
                    /* Layout Reset */
                    body, html, #__next, .flex, .flex-col {
                        height: auto !important;
                        overflow: visible !important;
                        display: block !important;
                    }

                    .bg-white.text-gray-900.p-10 {
                        width: 210mm !important;
                        min-height: 297mm !important;
                        margin: 0 auto !important;
                        padding: 20mm !important; /* Add internal padding for print */
                        box-shadow: none !important;
                        border: none !important;
                        position: static !important;
                    }

                    main { 
                        padding: 0 !important; 
                        margin: 0 auto !important; 
                        width: 100% !important; 
                        display: block !important;
                    }
                }
            `}</style>
        </DashboardLayout>
    );
}
