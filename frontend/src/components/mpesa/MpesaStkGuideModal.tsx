'use client';

import React, { useState } from 'react';
import {
    X, Smartphone, KeyRound, ExternalLink, ShieldCheck, CheckCircle2,
    HelpCircle, Copy, Check, MessageSquare, Phone, Send, ArrowRight,
    Sparkles, AlertCircle, Building2, Terminal
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import api from '@/lib/api';

interface MpesaStkGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentEnv?: 'sandbox' | 'production';
}

export default function MpesaStkGuideModal({ isOpen, onClose, currentEnv = 'sandbox' }: MpesaStkGuideModalProps) {
    const [activeTab, setActiveTab] = useState<'requirements' | 'steps' | 'links' | 'support'>('requirements');
    const [copiedPasskey, setCopiedPasskey] = useState(false);
    const [copiedShortcode, setCopiedShortcode] = useState(false);

    // Support Form State
    const [supportPhone, setSupportPhone] = useState('');
    const [supportMessage, setSupportMessage] = useState('');
    const [supportLoading, setSupportLoading] = useState(false);
    const [supportSuccess, setSupportSuccess] = useState<string | null>(null);
    const [supportError, setSupportError] = useState<string | null>(null);

    if (!isOpen) return null;

    const SANDBOX_PASSKEY = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
    const SANDBOX_SHORTCODE = '174379';

    const handleCopy = (text: string, type: 'passkey' | 'shortcode') => {
        navigator.clipboard.writeText(text);
        if (type === 'passkey') {
            setCopiedPasskey(true);
            setTimeout(() => setCopiedPasskey(false), 2000);
        } else {
            setCopiedShortcode(true);
            setTimeout(() => setCopiedShortcode(false), 2000);
        }
    };

    const handleSupportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSupportLoading(true);
        setSupportError(null);
        setSupportSuccess(null);

        if (!supportPhone.trim()) {
            setSupportError('Please enter a valid contact phone number.');
            setSupportLoading(false);
            return;
        }

        if (!supportMessage.trim()) {
            setSupportError('Please describe what you need assistance with.');
            setSupportLoading(false);
            return;
        }

        try {
            const finalMessage = `Contact Phone: ${supportPhone.trim()}\nEnvironment: ${currentEnv.toUpperCase()}\n\n${supportMessage.trim()}`;
            const res = await api.post('/support', {
                subject: 'M-Pesa STK Push Integration Assistance',
                priority: 'HIGH',
                message: finalMessage
            });

            setSupportSuccess(`Ticket #${res.data?.id?.slice(0, 8) || 'Created'} submitted successfully! Our technical team will reach out via ${supportPhone.trim()}.`);
            setSupportMessage('');
        } catch (err: any) {
            console.error('Failed to submit support ticket:', err);
            const msg = err.response?.data?.details || err.response?.data?.error || err.message || 'Failed to submit ticket';
            setSupportError(msg);
        } finally {
            setSupportLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-gray-900 dark:text-zinc-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-zinc-800 bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white dark:from-emerald-950/40 dark:via-zinc-900 dark:to-zinc-900 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                        <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-600/20 shrink-0">
                            <Smartphone className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                                    <ShieldCheck className="w-3 h-3" /> Official Daraja STK Push
                                </span>
                                <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
                                    Lipa Na M-Pesa Online
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                                How to Make M-Pesa STK Push Work
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 mt-0.5">
                                Everything you need to trigger automated PIN prompts on customer phones directly to your Paybill or Till.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-zinc-800 px-4 sm:px-6 bg-gray-50/50 dark:bg-zinc-900/50 overflow-x-auto text-xs sm:text-sm">
                    <button
                        onClick={() => setActiveTab('requirements')}
                        className={`py-3 px-3 font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                            activeTab === 'requirements'
                                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                                : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
                        }`}
                    >
                        <KeyRound className="w-4 h-4" /> What You Need (4 Keys)
                    </button>
                    <button
                        onClick={() => setActiveTab('steps')}
                        className={`py-3 px-3 font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                            activeTab === 'steps'
                                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                                : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
                        }`}
                    >
                        <Sparkles className="w-4 h-4" /> Step-by-Step Guide
                    </button>
                    <button
                        onClick={() => setActiveTab('links')}
                        className={`py-3 px-3 font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                            activeTab === 'links'
                                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                                : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
                        }`}
                    >
                        <ExternalLink className="w-4 h-4" /> Safaricom Links
                    </button>
                    <button
                        onClick={() => setActiveTab('support')}
                        className={`py-3 px-3 font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                            activeTab === 'support'
                                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                                : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
                        }`}
                    >
                        <MessageSquare className="w-4 h-4" /> Ask for Support
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                    {/* TAB 1: REQUIREMENTS */}
                    {activeTab === 'requirements' && (
                        <div className="space-y-5">
                            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed">
                                <b>How STK Push Works:</b> When a sale is triggered, M-Pesa Connect sends an encrypted payload to Safaricom Daraja. Safaricom instantly pops up a PIN dialog on the customer&apos;s phone. Once the customer enters their PIN, the money is credited directly into your Paybill/Till, and M-Pesa sends an automated receipt confirmation back!
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Key 1 */}
                                <div className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                                        <KeyRound className="w-4 h-4" /> 1. Consumer Key &amp; Secret
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                                        Your unique API keys issued by Safaricom Daraja when you create an App in the developer portal. They identify your business to Safaricom.
                                    </p>
                                    <div className="text-[11px] text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-900 p-2 rounded-lg font-mono">
                                        Generated in: Daraja &gt; My Apps
                                    </div>
                                </div>

                                {/* Key 2 */}
                                <div className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                                        <Building2 className="w-4 h-4" /> 2. Business Shortcode
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                                        Your Safaricom <b>Paybill Number</b> or <b>Buy Goods Till Number</b> (Store Number) where customer payments are deposited.
                                    </p>
                                    <div className="text-[11px] text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-900 p-2 rounded-lg flex items-center justify-between">
                                        <span>Sandbox test code: <b className="font-mono text-emerald-600 dark:text-emerald-400">{SANDBOX_SHORTCODE}</b></span>
                                        <button 
                                            onClick={() => handleCopy(SANDBOX_SHORTCODE, 'shortcode')}
                                            className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                                        >
                                            {copiedShortcode ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                                            {copiedShortcode ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                </div>

                                {/* Key 3 */}
                                <div className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                                        <ShieldCheck className="w-4 h-4" /> 3. Lipa Na M-Pesa Passkey
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                                        A secret key used to generate the timestamped password required by Safaricom to authorize the push notification on the customer&apos;s phone.
                                    </p>
                                    <div className="text-[11px] text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-900 p-2 rounded-lg flex items-center justify-between">
                                        <span className="truncate pr-2 font-mono">Sandbox Passkey ({SANDBOX_PASSKEY.slice(0, 10)}...)</span>
                                        <button 
                                            onClick={() => handleCopy(SANDBOX_PASSKEY, 'passkey')}
                                            className="text-xs text-emerald-600 hover:underline flex items-center gap-1 shrink-0"
                                        >
                                            {copiedPasskey ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                                            {copiedPasskey ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                </div>

                                {/* Key 4 */}
                                <div className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                                        <CheckCircle2 className="w-4 h-4" /> 4. Automated Callbacks
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                                        M-Pesa Connect automatically handles the callback and webhook URLs for you. You do not need to configure external servers or public ngrok proxies.
                                    </p>
                                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg font-medium flex items-center gap-1.5">
                                        <Check className="w-3.5 h-3.5" /> Built-in automated instant webhook verification
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setActiveTab('steps')}
                                    className="text-xs"
                                >
                                    View Step-by-Step Walkthrough &rarr;
                                </Button>
                                <Button 
                                    type="button" 
                                    size="sm" 
                                    onClick={() => setActiveTab('support')}
                                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                                >
                                    <MessageSquare className="w-3.5 h-3.5" /> Ask for Setup Support
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: STEP-BY-STEP */}
                    {activeTab === 'steps' && (
                        <div className="space-y-4">
                            <div className="space-y-3">
                                {[
                                    {
                                        step: '1',
                                        title: 'Create an Account on Safaricom Daraja',
                                        desc: 'Visit developer.safaricom.co.ke and sign up for a developer account (or log in if you already have one).',
                                        link: 'https://developer.safaricom.co.ke',
                                        linkLabel: 'Open Daraja Portal'
                                    },
                                    {
                                        step: '2',
                                        title: 'Create a New App on Daraja',
                                        desc: 'Navigate to "My Apps" and click "Add a New App". Enter an App Name and ensure you check the checkbox for "Lipa Na M-Pesa Sandbox" (or "Lipa Na M-Pesa" in production).',
                                        link: 'https://developer.safaricom.co.ke/MyApps',
                                        linkLabel: 'Go to My Apps'
                                    },
                                    {
                                        step: '3',
                                        title: 'Copy Consumer Key & Consumer Secret',
                                        desc: 'Once your App is created, click on it to reveal your Consumer Key and Consumer Secret. Copy both keys into the M-Pesa Settings form.',
                                    },
                                    {
                                        step: '4',
                                        title: 'Fill in Shortcode and Passkey',
                                        desc: 'For testing, select "Sandbox", enter Shortcode 174379, and copy the standard Sandbox Passkey. For Live production, enter your live Paybill/Till and your production passkey provided by Safaricom.',
                                    },
                                    {
                                        step: '5',
                                        title: 'Click "Test Connection" Before Saving',
                                        desc: 'Hit the "Test Connection" button right on the settings page. It connects to Safaricom in real-time to confirm your keys are 100% valid before you even click save!',
                                    },
                                    {
                                        step: '6',
                                        title: 'Going Live to Accept Real Money',
                                        desc: 'To process real customer payments, log into Daraja and submit the Go-Live form with your business certificate (KRA PIN, Certificate of Incorporation/Business Registration, ID copies). Safaricom will approve and send your live passkey.',
                                        link: 'https://developer.safaricom.co.ke/go-live',
                                        linkLabel: 'Safaricom Go-Live Portal'
                                    }
                                ].map((item) => (
                                    <div key={item.step} className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 flex items-start gap-3.5">
                                        <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                                            {item.step}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {item.title}
                                                </h4>
                                                {item.link && (
                                                    <a
                                                        href={item.link}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
                                                    >
                                                        {item.linkLabel} <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <div>
                                    <b>Buy Goods / Till Users Note:</b> Safaricom requires Buy Goods Tills to use their Store Number or Online Shortcode as the shortcode when initiating STK Push. Contact Safaricom developer support if you are unsure of your till shortcode.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: OFFICIAL SAFARICOM LINKS */}
                    {activeTab === 'links' && (
                        <div className="space-y-4">
                            <p className="text-xs text-gray-600 dark:text-zinc-400">
                                Official Safaricom resources for developer portal management, credentials generation, and business portal operations:
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {[
                                    {
                                        title: 'Safaricom Daraja Portal',
                                        desc: 'Create developer accounts, manage apps, and generate Consumer Keys & Secrets.',
                                        url: 'https://developer.safaricom.co.ke'
                                    },
                                    {
                                        title: 'Daraja Test Credentials Tool',
                                        desc: 'Generate test credentials, view sandbox test phone numbers, and generate security credentials.',
                                        url: 'https://developer.safaricom.co.ke/test_credentials'
                                    },
                                    {
                                        title: 'Daraja Go-Live Application',
                                        desc: 'Submit KYC documents (KRA PIN, Incorporation, ID) to move your app from Sandbox to Production.',
                                        url: 'https://developer.safaricom.co.ke/go-live'
                                    },
                                    {
                                        title: 'Safaricom M-Pesa Org Portal',
                                        desc: 'Manage your live Paybill/Till, create API Operators, and check direct settlements.',
                                        url: 'https://org.ke.m-pesa.com'
                                    }
                                ].map((res) => (
                                    <a
                                        key={res.title}
                                        href={res.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all group flex flex-col justify-between"
                                    >
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                    {res.title}
                                                </h4>
                                                <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                                                {res.desc}
                                            </p>
                                        </div>
                                        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-3 truncate">
                                            {res.url.replace('https://', '')}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 4: ASK FOR SUPPORT */}
                    {activeTab === 'support' && (
                        <div className="space-y-5">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/20 border border-indigo-100 dark:border-indigo-900/50">
                                <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    Get Direct Integration Support
                                </h3>
                                <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-1 leading-relaxed">
                                    Having trouble obtaining your credentials or getting errors when testing your Paybill? Submit your phone number and request below—our engineering team will contact you directly to help you complete your setup!
                                </p>
                            </div>

                            {supportSuccess ? (
                                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-center space-y-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 mx-auto flex items-center justify-center">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-sm text-green-900 dark:text-green-200">
                                            Support Ticket Created
                                        </h4>
                                        <p className="text-xs text-green-700 dark:text-green-300">
                                            {supportSuccess}
                                        </p>
                                    </div>
                                    <div className="flex justify-center gap-3 pt-1">
                                        <Link href="/support">
                                            <Button size="sm" variant="outline" className="text-xs">
                                                View Support Tickets
                                            </Button>
                                        </Link>
                                        <Button 
                                            size="sm" 
                                            onClick={() => setSupportSuccess(null)}
                                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            Submit Another Request
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSupportSubmit} className="space-y-4">
                                    {supportError && (
                                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            <span>{supportError}</span>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                                            Your Phone Number (M-Pesa / WhatsApp) *
                                        </label>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="tel"
                                                required
                                                placeholder="e.g. 0712345678 or +254712345678"
                                                value={supportPhone}
                                                onChange={(e) => setSupportPhone(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-emerald-500 outline-none text-xs sm:text-sm text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        <p className="text-[11px] text-gray-400 mt-1">
                                            We will reach out directly on this number to assist you.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                                            What do you need help with? *
                                        </label>
                                        <textarea
                                            required
                                            rows={4}
                                            placeholder="E.g. I have a Paybill 123456 and need help generating my Daraja passkey and testing STK push..."
                                            value={supportMessage}
                                            onChange={(e) => setSupportMessage(e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-emerald-500 outline-none text-xs sm:text-sm text-gray-900 dark:text-white resize-none"
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                                        <Link 
                                            href={`/support/new?subject=M-Pesa%20STK%20Push%20Integration%20Assistance&phone=${encodeURIComponent(supportPhone)}&message=${encodeURIComponent(supportMessage)}`}
                                            className="text-xs text-gray-500 hover:text-indigo-600 dark:text-zinc-400 inline-flex items-center gap-1"
                                        >
                                            <span>Open full ticket page</span>
                                            <ArrowRight className="w-3 h-3" />
                                        </Link>

                                        <Button
                                            type="submit"
                                            isLoading={supportLoading}
                                            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-6 py-2.5"
                                        >
                                            <Send className="w-3.5 h-3.5 mr-1.5" />
                                            Submit Support Request
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="text-gray-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Ready to accept payments? Test your connection before clicking save.</span>
                    </div>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            className="text-xs"
                        >
                            Close Guide
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
