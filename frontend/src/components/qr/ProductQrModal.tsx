'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Download, Printer, RefreshCw, Smartphone, Check, Copy, Tag, Store, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { getImageUrl } from '@/lib/utils';
import QRCode from 'qrcode';

interface ProductQrModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: {
        id: string;
        name: string;
        price: string | number;
        sku?: string;
        imageUrl?: string;
    } | null;
}

export const ProductQrModal: React.FC<ProductQrModalProps> = ({
    isOpen,
    onClose,
    product
}) => {
    const [loading, setLoading] = useState(false);
    const [qrData, setQrData] = useState<any>(null);
    const [trxCode, setTrxCode] = useState<'BG' | 'PB'>('BG');
    const [customAmount, setCustomAmount] = useState<string>('');
    const printRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();

    useEffect(() => {
        if (isOpen && product) {
            setCustomAmount(String(product.price));
            fetchQrCode(product.id, trxCode, Number(product.price));
        } else {
            setQrData(null);
        }
    }, [isOpen, product]);

    const fetchQrCode = async (productId: string, type: 'BG' | 'PB', amountVal?: number) => {
        setLoading(true);
        try {
            const amt = amountVal !== undefined ? amountVal : (Number(customAmount) || Number(product?.price) || 1);
            const res = await api.post('/mpesa/qr/generate', {
                refNo: product?.name?.slice(0, 20) || 'Product',
                amount: amt,
                trxCode: type,
                size: '350'
            });
            setQrData(res.data);
        } catch (error: any) {
            console.error('Failed to load Daraja QR:', error);
            // Client-side fallback generation
            try {
                const cpiFallback = '174379';
                const amt = amountVal !== undefined ? amountVal : (Number(customAmount) || 1);
                const rawPayload = `${type}|${cpiFallback}|${amt}|${product?.name || 'Item'}|Mpesa Connect`;
                const dataUrl = await QRCode.toDataURL(rawPayload, {
                    width: 350,
                    margin: 2,
                    color: { dark: '#008744', light: '#FFFFFF' }
                });
                setQrData({
                    source: 'LOCAL_FALLBACK',
                    qrCode: dataUrl,
                    details: {
                        merchantName: 'Mpesa Connect Merchant',
                        cpi: cpiFallback,
                        trxCode: type,
                        refNo: product?.name || 'Item',
                        amount: amt
                    }
                });
            } catch (fallbackErr) {
                showToast('Failed to generate QR Code', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTypeChange = (newType: 'BG' | 'PB') => {
        setTrxCode(newType);
        if (product) {
            fetchQrCode(product.id, newType);
        }
    };

    const handleAmountSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (product) {
            fetchQrCode(product.id, trxCode, Number(customAmount));
        }
    };

    const handleDownload = () => {
        if (!qrData?.qrCode) return;
        const link = document.createElement('a');
        link.href = qrData.qrCode;
        link.download = `mpesa-qr-${(product?.name || 'product').toLowerCase().replace(/\s+/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('QR Code downloaded successfully', 'success');
    };

    const handlePrint = () => {
        if (!printRef.current) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            window.print();
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>M-Pesa Payment QR - ${product?.name}</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            background-color: #f3f4f6;
                        }
                        .standee {
                            background: white;
                            width: 360px;
                            padding: 28px;
                            border-radius: 20px;
                            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                            text-align: center;
                            border: 2px solid #008744;
                        }
                        .header {
                            background: #008744;
                            color: white;
                            padding: 12px;
                            border-radius: 12px;
                            margin-bottom: 20px;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 20px;
                            letter-spacing: 1px;
                        }
                        .header p {
                            margin: 4px 0 0 0;
                            font-size: 11px;
                            opacity: 0.9;
                        }
                        .qr-img {
                            width: 250px;
                            height: 250px;
                            margin: 0 auto;
                            display: block;
                        }
                        .item-name {
                            font-size: 18px;
                            font-weight: 700;
                            margin-top: 16px;
                            color: #111827;
                        }
                        .amount {
                            font-size: 24px;
                            font-weight: 800;
                            color: #008744;
                            margin: 6px 0;
                        }
                        .details-box {
                            background: #f9fafb;
                            border: 1px dashed #d1d5db;
                            border-radius: 10px;
                            padding: 10px;
                            margin-top: 14px;
                            font-size: 13px;
                            color: #374151;
                        }
                        .footer {
                            margin-top: 18px;
                            font-size: 11px;
                            color: #6b7280;
                        }
                    </style>
                </head>
                <body>
                    <div class="standee">
                        <div class="header">
                            <h1>LIPA NA M-PESA</h1>
                            <p>SCAN TO PAY WITH M-PESA APP</p>
                        </div>
                        <img src="${qrData?.qrCode}" class="qr-img" />
                        <div class="item-name">${product?.name}</div>
                        <div class="amount">KES ${Number(customAmount || product?.price).toLocaleString()}</div>
                        <div class="details-box">
                            <div><strong>${trxCode === 'BG' ? 'Buy Goods Till:' : 'Paybill:'}</strong> ${qrData?.details?.cpi || '174379'}</div>
                            <div><strong>Account Ref:</strong> ${qrData?.details?.refNo || product?.name}</div>
                            <div><strong>Merchant:</strong> ${qrData?.details?.merchantName || 'Mpesa Connect'}</div>
                        </div>
                        <div class="footer">
                            Open M-Pesa App &bull; Tap Scan QR &bull; Confirm PIN
                        </div>
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() { window.close(); }
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    if (!product) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl p-0 overflow-hidden">
            <div className="bg-emerald-600 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Dynamic M-Pesa QR Code</h3>
                        <p className="text-xs text-emerald-100">Scan & Pay via Safaricom Daraja API</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {qrData?.source === 'DARAJA_API' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-white/20 text-white px-2.5 py-1 rounded-full font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" /> Daraja Live
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-white/10 text-emerald-100 px-2.5 py-1 rounded-full font-medium">
                            Standard QR
                        </span>
                    )}
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Product Summary Banner */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
                    <div className="h-12 w-12 rounded-lg bg-white dark:bg-zinc-800 overflow-hidden flex-shrink-0 border border-gray-200 dark:border-zinc-700 flex items-center justify-center">
                        {product.imageUrl ? (
                            <img src={getImageUrl(product.imageUrl)} className="h-full w-full object-cover" alt="" />
                        ) : (
                            <Tag className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{product.name}</h4>
                        <p className="text-xs text-gray-500">Base Price: KES {Number(product.price).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                            KES {Number(customAmount || product.price).toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Configuration Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Payment Type Switcher */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                            Payment Method
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                            <button
                                type="button"
                                onClick={() => handleTypeChange('BG')}
                                className={`py-1.5 text-xs font-medium rounded-md transition-all ${trxCode === 'BG'
                                    ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                                    }`}
                            >
                                Buy Goods (Till)
                            </button>
                            <button
                                type="button"
                                onClick={() => handleTypeChange('PB')}
                                className={`py-1.5 text-xs font-medium rounded-md transition-all ${trxCode === 'PB'
                                    ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                                    }`}
                            >
                                Paybill
                            </button>
                        </div>
                    </div>

                    {/* Quick Amount Override */}
                    <form onSubmit={handleAmountSubmit}>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                            Amount (KES)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                min="1"
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white"
                                placeholder="Amount"
                            />
                            <Button type="submit" size="sm" variant="outline" className="text-xs px-2.5" disabled={loading}>
                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </form>
                </div>

                {/* The Printable QR Display Standee */}
                <div ref={printRef} className="flex flex-col items-center justify-center p-6 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border-2 border-dashed border-emerald-500/30">
                    <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 flex flex-col items-center">
                        <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                            <span className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase">Lipa na M-Pesa</span>
                            <span className="text-[10px] font-semibold text-gray-400">{trxCode === 'BG' ? 'Buy Goods' : 'Paybill'}</span>
                        </div>

                        {loading ? (
                            <div className="w-60 h-60 flex flex-col items-center justify-center gap-2">
                                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                                <span className="text-xs text-gray-500">Generating Daraja QR...</span>
                            </div>
                        ) : qrData?.qrCode ? (
                            <img
                                src={qrData.qrCode}
                                alt="M-Pesa QR Code"
                                className="w-60 h-60 object-contain rounded-lg"
                            />
                        ) : (
                            <div className="w-60 h-60 flex items-center justify-center text-xs text-gray-400">
                                No QR code available
                            </div>
                        )}

                        <div className="w-full text-center mt-3 pt-2 border-t border-gray-100">
                            <p className="text-xs font-semibold text-gray-800">{product.name}</p>
                            <p className="text-sm font-extrabold text-emerald-600">KES {Number(customAmount || product.price).toLocaleString()}</p>
                            <p className="text-[10px] text-gray-500 mt-1">
                                {trxCode === 'BG' ? 'Till No:' : 'Shortcode:'} <strong>{qrData?.details?.cpi || '174379'}</strong> &bull; Ref: <strong>{qrData?.details?.refNo || product.name}</strong>
                            </p>
                        </div>
                    </div>

                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-4 text-center max-w-xs">
                        Customers open the <strong>M-Pesa App</strong> or <strong>mySafaricom</strong>, tap <strong>Scan QR</strong>, and verify their PIN.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handlePrint}
                        className="flex-1 flex items-center justify-center gap-2 text-sm"
                        disabled={loading || !qrData?.qrCode}
                    >
                        <Printer className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        Print Standee
                    </Button>
                    <Button
                        onClick={handleDownload}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 text-sm"
                        disabled={loading || !qrData?.qrCode}
                    >
                        <Download className="w-4 h-4" />
                        Download PNG
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
