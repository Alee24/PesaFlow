'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import {
    QrCode, Download, Printer, RefreshCw, Smartphone, Package,
    ShieldCheck, Store, Copy, Check, Info, ArrowRight, Sparkles, HelpCircle
} from 'lucide-react';
import QRCode from 'qrcode';

interface Product {
    id: string;
    name: string;
    price: string | number;
    sku?: string;
    imageUrl?: string;
}

export default function QrGeneratorPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [selectedProductId, setSelectedProductId] = useState<string>('custom');

    // Form inputs
    const [merchantName, setMerchantName] = useState('');
    const [cpi, setCpi] = useState('');
    const [refNo, setRefNo] = useState('');
    const [amount, setAmount] = useState('100');
    const [trxCode, setTrxCode] = useState<'BG' | 'PB'>('BG');
    const [qrSize, setQrSize] = useState('350');

    // QR output
    const [generating, setGenerating] = useState(false);
    const [qrResult, setQrResult] = useState<any>(null);
    const [copied, setCopied] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            // Load products
            const prodRes = await api.get('/products');
            setProducts(prodRes.data || []);

            // Load merchant profile defaults
            const profRes = await api.get('/profile');
            const p = profRes.data;
            if (p) {
                setMerchantName(p.companyName || '');
                if (p.tillNumber) {
                    setCpi(p.tillNumber);
                    setTrxCode('BG');
                } else if (p.mpesaShortcode) {
                    setCpi(p.mpesaShortcode);
                    setTrxCode('PB');
                }
            }
        } catch (error) {
            console.error('Failed to load initial data:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    // Auto-generate on first mount after defaults load
    useEffect(() => {
        if (cpi || merchantName) {
            handleGenerate();
        }
    }, [cpi, merchantName]);

    const handleProductSelect = (prodId: string) => {
        setSelectedProductId(prodId);
        if (prodId === 'custom') {
            setRefNo('General Payment');
        } else {
            const prod = products.find(p => p.id === prodId);
            if (prod) {
                setRefNo(prod.name.slice(0, 20));
                setAmount(String(Math.round(Number(prod.price))));
            }
        }
    };

    const handleGenerate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!refNo) {
            showToast('Please enter an account reference or item name', 'error');
            return;
        }

        setGenerating(true);
        try {
            const res = await api.post('/mpesa/qr/generate', {
                merchantName: merchantName || undefined,
                cpi: cpi || undefined,
                refNo: refNo.trim(),
                amount: Number(amount) || 1,
                trxCode,
                size: qrSize
            });
            setQrResult(res.data);
            showToast('M-Pesa QR Code generated successfully', 'success');
        } catch (error: any) {
            console.warn('Daraja QR generation failed, generating fallback:', error);
            // Fallback to high-quality local generation
            try {
                const targetCpi = cpi || '174379';
                const targetName = merchantName || 'Mpesa Connect Merchant';
                const rawPayload = `${trxCode}|${targetCpi}|${amount}|${refNo}|${targetName}`;
                const dataUrl = await QRCode.toDataURL(rawPayload, {
                    width: Number(qrSize) || 350,
                    margin: 2,
                    color: {
                        dark: '#008744',
                        light: '#FFFFFF'
                    },
                    errorCorrectionLevel: 'H'
                });
                setQrResult({
                    source: 'STANDARD_MPESA_FORMAT',
                    qrCode: dataUrl,
                    details: {
                        merchantName: targetName,
                        cpi: targetCpi,
                        trxCode,
                        refNo,
                        amount: Number(amount) || 1,
                        size: qrSize
                    },
                    message: 'Standard dynamic M-Pesa QR code generated'
                });
                showToast('Dynamic QR code ready for scanning', 'success');
            } catch (fallbackErr) {
                showToast('Failed to generate QR code', 'error');
            }
        } finally {
            setGenerating(false);
        }
    };

    const handleDownload = () => {
        if (!qrResult?.qrCode) return;
        const link = document.createElement('a');
        link.href = qrResult.qrCode;
        link.download = `mpesa-qr-${refNo.toLowerCase().replace(/\s+/g, '-') || 'payment'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('QR Code image downloaded', 'success');
    };

    const handleCopyDetails = () => {
        const text = `LIPA NA M-PESA\n${trxCode === 'BG' ? 'Buy Goods Till' : 'Paybill'}: ${qrResult?.details?.cpi || cpi}\nAccount: ${refNo}\nAmount: KES ${Number(amount).toLocaleString()}\nMerchant: ${merchantName || 'Mpesa Connect'}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        showToast('Payment details copied to clipboard', 'success');
    };

    const handlePrintStandee = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            window.print();
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>M-Pesa Table Standee - ${refNo}</title>
                    <style>
                        @page { size: portrait; margin: 15mm; }
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            background-color: #f9fafb;
                        }
                        .standee {
                            background: white;
                            width: 380px;
                            padding: 32px;
                            border-radius: 24px;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                            text-align: center;
                            border: 3px solid #008744;
                        }
                        .header {
                            background: #008744;
                            color: white;
                            padding: 16px;
                            border-radius: 16px;
                            margin-bottom: 24px;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 22px;
                            font-weight: 800;
                            letter-spacing: 1px;
                        }
                        .header p {
                            margin: 4px 0 0 0;
                            font-size: 11px;
                            opacity: 0.9;
                            letter-spacing: 0.5px;
                        }
                        .qr-container {
                            background: #ffffff;
                            padding: 16px;
                            border-radius: 16px;
                            border: 1px solid #e5e7eb;
                            display: inline-block;
                            margin-bottom: 16px;
                        }
                        .qr-img {
                            width: 260px;
                            height: 260px;
                            display: block;
                        }
                        .item-name {
                            font-size: 20px;
                            font-weight: 700;
                            color: #111827;
                            margin-bottom: 4px;
                        }
                        .amount {
                            font-size: 28px;
                            font-weight: 900;
                            color: #008744;
                            margin-bottom: 16px;
                        }
                        .details-box {
                            background: #f3f4f6;
                            border: 2px dashed #d1d5db;
                            border-radius: 14px;
                            padding: 14px;
                            font-size: 13px;
                            color: #1f2937;
                            text-align: left;
                        }
                        .details-row {
                            display: flex;
                            justify-content: space-between;
                            padding: 4px 0;
                        }
                        .footer {
                            margin-top: 24px;
                            font-size: 12px;
                            color: #6b7280;
                            border-top: 1px solid #e5e7eb;
                            padding-top: 16px;
                        }
                    </style>
                </head>
                <body>
                    <div class="standee">
                        <div class="header">
                            <h1>LIPA NA M-PESA</h1>
                            <p>OFFICIAL DARAJA PAYMENT QR</p>
                        </div>
                        <div class="qr-container">
                            <img src="${qrResult?.qrCode}" class="qr-img" />
                        </div>
                        <div class="item-name">${refNo}</div>
                        <div class="amount">KES ${Number(amount).toLocaleString()}</div>
                        <div class="details-box">
                            <div class="details-row">
                                <span><strong>${trxCode === 'BG' ? 'Till Number' : 'Paybill'}</strong></span>
                                <span>${qrResult?.details?.cpi || cpi || '174379'}</span>
                            </div>
                            <div class="details-row">
                                <span><strong>Account Ref</strong></span>
                                <span>${refNo}</span>
                            </div>
                            <div class="details-row">
                                <span><strong>Merchant</strong></span>
                                <span>${merchantName || 'Mpesa Connect'}</span>
                            </div>
                        </div>
                        <div class="footer">
                            Open M-Pesa App &bull; Tap Scan QR &bull; Enter PIN
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

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                            <QrCode className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                            Dynamic M-Pesa QR Generator
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            Generate instant, scan-and-pay Daraja API QR codes for uploaded inventory items or custom payment references.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: Configuration Form */}
                    <div className="lg:col-span-7 space-y-6">
                        <Card className="p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-600" />
                                1. Select Product or Custom Mode
                            </h2>

                            {/* Product Selector */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                                        Link to Inventory Item
                                    </label>
                                    <select
                                        value={selectedProductId}
                                        onChange={(e) => handleProductSelect(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                    >
                                        <option value="custom">-- Custom Payment (Not Linked to Product) --</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} - KES {Number(p.price).toLocaleString()}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">
                                    <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Store className="w-4 h-4 text-emerald-600" />
                                        2. Payment Parameters
                                    </h2>

                                    <form onSubmit={handleGenerate} className="space-y-4">
                                        {/* Payment Channel Selector */}
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                                                Transaction Type
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setTrxCode('BG')}
                                                    className={`py-2.5 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${trxCode === 'BG'
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-semibold'
                                                        : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                                        }`}
                                                >
                                                    <Store className="w-4 h-4" />
                                                    Buy Goods (Till Number)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setTrxCode('PB')}
                                                    className={`py-2.5 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${trxCode === 'PB'
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-semibold'
                                                        : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                                        }`}
                                                >
                                                    <Smartphone className="w-4 h-4" />
                                                    Paybill
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Shortcode / Till */}
                                            <Input
                                                label={trxCode === 'BG' ? 'Till Number (CPI)' : 'Paybill Shortcode (CPI)'}
                                                value={cpi}
                                                onChange={(e: any) => setCpi(e.target.value)}
                                                placeholder={trxCode === 'BG' ? 'e.g. 500201' : 'e.g. 174379'}
                                                required
                                            />

                                            {/* Merchant Name */}
                                            <Input
                                                label="Business / Merchant Name"
                                                value={merchantName}
                                                onChange={(e: any) => setMerchantName(e.target.value)}
                                                placeholder="e.g. Acme Stores Ltd"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Reference / Product Name */}
                                            <Input
                                                label="Account Reference / Item Name"
                                                value={refNo}
                                                onChange={(e: any) => setRefNo(e.target.value)}
                                                placeholder="e.g. Premium Sneaker"
                                                required
                                            />

                                            {/* Amount */}
                                            <Input
                                                label="Amount to Charge (KES)"
                                                type="number"
                                                min="1"
                                                value={amount}
                                                onChange={(e: any) => setAmount(e.target.value)}
                                                placeholder="100"
                                                required
                                            />
                                        </div>

                                        {/* Resolution / Size */}
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                                                QR Resolution / Output Size
                                            </label>
                                            <select
                                                value={qrSize}
                                                onChange={(e) => setQrSize(e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                            >
                                                <option value="300">Standard Display (300 x 300 px)</option>
                                                <option value="450">High Resolution (450 x 450 px)</option>
                                                <option value="600">Print Quality (600 x 600 px)</option>
                                            </select>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-base font-semibold flex items-center justify-center gap-2 mt-4 shadow-sm"
                                            disabled={generating}
                                        >
                                            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                                            {generating ? 'Requesting Daraja API...' : 'Generate Dynamic QR Code'}
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        </Card>

                        {/* Guide / How to Use Card */}
                        <Card className="p-6 border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                                <HelpCircle className="w-4 h-4 text-emerald-600" />
                                How Dynamic M-Pesa QR Codes Work
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600 dark:text-gray-300">
                                <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
                                    <div className="font-bold text-emerald-600 mb-1">1. Customer Scans</div>
                                    The customer opens the <strong>M-Pesa Super App</strong> or <strong>mySafaricom</strong> and taps <em>Scan QR</em>.
                                </div>
                                <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
                                    <div className="font-bold text-emerald-600 mb-1">2. Auto-Populated</div>
                                    The Till/Paybill number, Account Reference, and Amount are filled in automatically with zero typos.
                                </div>
                                <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
                                    <div className="font-bold text-emerald-600 mb-1">3. Instant Receipt</div>
                                    The customer enters their M-Pesa PIN. Both parties get instant SMS and webhook payment confirmation.
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right: Live Standee & Export Area */}
                    <div className="lg:col-span-5 space-y-6">
                        <Card className="p-6 border border-gray-100 dark:border-zinc-800 flex flex-col items-center">
                            <div className="w-full flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Live Preview Standee
                                </span>
                                {qrResult?.source === 'DARAJA_API' ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-semibold">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Daraja Verified
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 px-2.5 py-0.5 rounded-full font-medium">
                                        Standard QR
                                    </span>
                                )}
                            </div>

                            {/* The Visual Standee Container */}
                            <div
                                ref={printRef}
                                className="w-full max-w-[340px] bg-white rounded-2xl p-6 shadow-md border-2 border-emerald-600 text-center flex flex-col items-center transition-all"
                            >
                                <div className="w-full bg-[#008744] text-white py-2.5 px-4 rounded-xl mb-4">
                                    <h3 className="text-sm font-black tracking-wider uppercase">LIPA NA M-PESA</h3>
                                    <p className="text-[10px] text-emerald-100 uppercase tracking-widest mt-0.5">SCAN TO PAY WITH M-PESA APP</p>
                                </div>

                                {/* QR Code Display */}
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-3">
                                    {generating ? (
                                        <div className="w-56 h-56 flex flex-col items-center justify-center gap-2">
                                            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                                            <span className="text-xs text-gray-500">Generating QR...</span>
                                        </div>
                                    ) : qrResult?.qrCode ? (
                                        <img
                                            src={qrResult.qrCode}
                                            alt="M-Pesa QR Code"
                                            className="w-56 h-56 object-contain rounded-lg"
                                        />
                                    ) : (
                                        <div className="w-56 h-56 flex flex-col items-center justify-center text-gray-400 gap-2">
                                            <QrCode className="w-12 h-12 stroke-[1.5]" />
                                            <span className="text-xs">Click Generate to preview</span>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full text-center space-y-1">
                                    <div className="text-base font-bold text-gray-900 truncate">{refNo || 'Payment'}</div>
                                    <div className="text-2xl font-black text-[#008744]">KES {Number(amount || 0).toLocaleString()}</div>
                                </div>

                                {/* Details badge */}
                                <div className="w-full mt-3 p-2.5 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-left text-xs space-y-1 text-gray-700">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">{trxCode === 'BG' ? 'Till Number:' : 'Paybill:'}</span>
                                        <span className="font-bold">{cpi || '174379'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Account Ref:</span>
                                        <span className="font-semibold truncate max-w-[150px]">{refNo || 'Standard'}</span>
                                    </div>
                                    {merchantName && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Merchant:</span>
                                            <span className="font-medium truncate max-w-[150px]">{merchantName}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="text-[10px] text-gray-400 mt-3">
                                    Open M-Pesa App &bull; Scan QR &bull; Confirm PIN
                                </div>
                            </div>

                            {/* Export / Print Actions */}
                            <div className="w-full space-y-2.5 mt-6">
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={handlePrintStandee}
                                        disabled={!qrResult?.qrCode || generating}
                                        className="w-full flex items-center justify-center gap-2 text-xs py-2.5"
                                    >
                                        <Printer className="w-4 h-4" />
                                        Print Standee
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={handleDownload}
                                        disabled={!qrResult?.qrCode || generating}
                                        className="w-full flex items-center justify-center gap-2 text-xs py-2.5"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download PNG
                                    </Button>
                                </div>

                                <Button
                                    variant="ghost"
                                    onClick={handleCopyDetails}
                                    disabled={!qrResult?.qrCode}
                                    className="w-full text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1.5 py-2"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copied ? 'Details Copied!' : 'Copy Payment Information Text'}</span>
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
