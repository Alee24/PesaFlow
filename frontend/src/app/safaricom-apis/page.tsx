'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import {
    Activity, ShieldCheck, ArrowUpRight, Search, RefreshCw, Smartphone,
    CheckCircle, AlertCircle, Building2, Repeat, Undo2, Users, Download,
    Send, Check, Copy, ExternalLink, HelpCircle, FileText, ArrowLeftRight,
    CheckCircle2, ChevronRight, AlertTriangle, Wallet, DollarSign, Clock,
    Database, Sparkles, Settings
} from 'lucide-react';
import Link from 'next/link';

export default function SafaricomApisPage() {
    const [activeTab, setActiveTab] = useState<
        'overview' | 'balance' | 'status' | 'disbursements' | 'reversal' | 'ratiba' | 'pull' | 'kyc' | 'c2b'
    >('overview');

    const [overviewData, setOverviewData] = useState<any>(null);
    const [loadingOverview, setLoadingOverview] = useState(true);
    const { showToast } = useToast();

    // 1. Balance Query & Stored State
    const [latestBalance, setLatestBalance] = useState<{
        id?: string;
        workingAccount: number;
        utilityAccount: number;
        chargesPaidAccount: number;
        accounts?: any[];
        rawBalanceString?: string;
        queriedAt?: string;
        completedAt?: string;
        status?: string;
        shortCode?: string;
        resultDesc?: string;
    } | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(false);
    const [isPollingBalance, setIsPollingBalance] = useState(false);
    const [pollingSeconds, setPollingSeconds] = useState(0);
    const [balanceResult, setBalanceResult] = useState<any>(null);
    const [balanceRemarks, setBalanceRemarks] = useState('Float Query');

    // 2. Transaction Status State
    const [txId, setTxId] = useState('');
    const [txLoading, setTxLoading] = useState(false);
    const [txResult, setTxResult] = useState<any>(null);

    // 3. Reversal State
    const [revTxId, setRevTxId] = useState('');
    const [revAmount, setRevAmount] = useState('');
    const [revRemarks, setRevRemarks] = useState('Customer Refund');
    const [revLoading, setRevLoading] = useState(false);
    const [revResult, setRevResult] = useState<any>(null);

    // 4. Disbursements State (B2B & Pochi)
    const [disbType, setDisbType] = useState<'b2b' | 'pochi'>('b2b');
    const [b2bPartyB, setB2bPartyB] = useState('');
    const [b2bAmount, setB2bAmount] = useState('');
    const [b2bAccountRef, setB2bAccountRef] = useState('');
    const [b2bCommand, setB2bCommand] = useState<'BusinessPayBill' | 'BusinessBuyGoods'>('BusinessPayBill');
    const [pochiPhone, setPochiPhone] = useState('');
    const [pochiAmount, setPochiAmount] = useState('');
    const [disbLoading, setDisbLoading] = useState(false);
    const [disbResult, setDisbResult] = useState<any>(null);

    // 5. Ratiba State
    const [ratibaName, setRatibaName] = useState('Monthly Subscription');
    const [ratibaAmount, setRatibaAmount] = useState('500');
    const [ratibaPhone, setRatibaPhone] = useState('');
    const [ratibaFreq, setRatibaFreq] = useState('3'); // 3 = Monthly
    const [ratibaStart, setRatibaStart] = useState('20261001');
    const [ratibaEnd, setRatibaEnd] = useState('20271001');
    const [ratibaLoading, setRatibaLoading] = useState(false);
    const [ratibaResult, setRatibaResult] = useState<any>(null);

    // 6. Pull Transactions State
    const [pullStart, setPullStart] = useState('2026-09-01 00:00:00');
    const [pullEnd, setPullEnd] = useState('2026-09-20 23:59:59');
    const [pullOffset, setPullOffset] = useState('0');
    const [pullLoading, setPullLoading] = useState(false);
    const [pullResult, setPullResult] = useState<any>(null);

    // 7. KYC State
    const [kycPhone, setKycPhone] = useState('');
    const [kycLoading, setKycLoading] = useState(false);
    const [kycResult, setKycResult] = useState<any>(null);

    // 8. C2B State
    const [c2bConfUrl, setC2bConfUrl] = useState('');
    const [c2bValUrl, setC2bValUrl] = useState('');
    const [c2bSimPhone, setC2bSimPhone] = useState('254708374149');
    const [c2bSimAmount, setC2bSimAmount] = useState('100');
    const [c2bSimRef, setC2bSimRef] = useState('TestInvoice');
    const [c2bLoading, setC2bLoading] = useState(false);
    const [c2bResult, setC2bResult] = useState<any>(null);

    useEffect(() => {
        fetchOverview();
    }, []);

    const fetchLatestBalance = async () => {
        try {
            const res = await api.get('/safaricom-apis/balance-latest');
            if (res.data?.balance) {
                setLatestBalance(res.data.balance);
            }
        } catch (err) {
            console.error('Failed to fetch latest balance', err);
        }
    };

    const fetchOverview = async () => {
        setLoadingOverview(true);
        try {
            const res = await api.get('/safaricom-apis/overview');
            setOverviewData(res.data);
            if (res.data?.latestBalance) {
                setLatestBalance(res.data.latestBalance);
            } else {
                fetchLatestBalance();
            }
            if (res.data?.credentialsSummary?.callbackUrl) {
                setC2bConfUrl(res.data.credentialsSummary.callbackUrl);
                setC2bValUrl(res.data.credentialsSummary.callbackUrl);
            }
        } catch (error: any) {
            console.error('Failed to load overview', error);
            showToast('Failed to load Safaricom API diagnostics', 'error');
        } finally {
            setLoadingOverview(false);
        }
    };

    // Component to render human-readable structured responses instead of plain JSON
    const ResponseViewer = ({ result, title = 'API Response' }: { result: any; title?: string }) => {
        const [copied, setCopied] = useState(false);
        const [showRaw, setShowRaw] = useState(false);

        if (!result) return null;

        const isError = Boolean(result.error);
        const summary = result.summary || {};
        const responseDesc = result.message || result.responseDescription || result.darajaResponse?.ResponseDescription || result.darajaResponse?.errorMessage;
        const conversationId = result.conversationId || result.darajaResponse?.ConversationID;
        const originatorId = result.originatorConversationId || result.darajaResponse?.OriginatorConversationID;
        const responseCode = result.responseCode || result.darajaResponse?.ResponseCode;

        const copyJson = () => {
            navigator.clipboard.writeText(JSON.stringify(result, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        };

        return (
            <div className="space-y-3 animate-in fade-in duration-300">
                {isError ? (
                    <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/30 text-red-900 dark:text-red-300 space-y-3">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                                <h4 className="font-bold text-sm text-red-800 dark:text-red-200">Safaricom Gateway Notice</h4>
                                <p className="text-xs leading-relaxed text-red-700 dark:text-red-300">{result.error}</p>
                            </div>
                        </div>

                        {result.resolutionSteps && (
                            <div className="mt-3 pt-3 border-t border-red-200/60 dark:border-red-900/40 text-xs">
                                <p className="font-semibold text-red-800 dark:text-red-200 mb-1.5 flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Recommended Steps:
                                </p>
                                <ul className="space-y-1 list-disc list-inside text-red-700 dark:text-red-300">
                                    {result.resolutionSteps.map((step: string, idx: number) => (
                                        <li key={idx}>{step}</li>
                                    ))}
                                </ul>
                                <div className="mt-3 pt-2">
                                    <Link
                                        href="/settings"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors shadow-sm"
                                    >
                                        <Settings className="w-3.5 h-3.5" />
                                        Configure M-Pesa Initiator in Settings
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200 space-y-3">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                                <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-100">
                                    {summary.title || 'Request Dispatched Successfully'}
                                </h4>
                                <p className="text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">
                                    {summary.description || responseDesc || 'Daraja acknowledged and processed the command.'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] border-t border-emerald-200/60 dark:border-emerald-900/30">
                            {conversationId && (
                                <div>
                                    <span className="text-emerald-700/70 dark:text-emerald-400/70 block">Conversation ID</span>
                                    <code className="font-mono font-medium text-emerald-900 dark:text-emerald-200 truncate block">
                                        {conversationId}
                                    </code>
                                </div>
                            )}
                            {originatorId && (
                                <div>
                                    <span className="text-emerald-700/70 dark:text-emerald-400/70 block">Originator ID</span>
                                    <code className="font-mono font-medium text-emerald-900 dark:text-emerald-200 truncate block">
                                        {originatorId}
                                    </code>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between text-xs pt-1">
                    <button
                        onClick={() => setShowRaw(!showRaw)}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline font-medium text-[11px]"
                    >
                        {showRaw ? 'Hide Raw JSON' : 'Show Technical Daraja JSON'}
                    </button>
                    <button
                        onClick={copyJson}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                        <Copy className="w-3 h-3" />
                        {copied ? 'Copied' : 'Copy JSON'}
                    </button>
                </div>

                {showRaw && (
                    <pre className="p-3 bg-zinc-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto border border-zinc-800">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                )}
            </div>
        );
    };

    // Actions
    const handleQueryBalance = async (e: React.FormEvent) => {
        e.preventDefault();
        setBalanceLoading(true);
        setIsPollingBalance(true);
        setPollingSeconds(0);
        try {
            const res = await api.post('/safaricom-apis/account-balance', { remarks: balanceRemarks });
            setBalanceResult(res.data);
            const conversationId = res.data?.conversationId;

            if (conversationId) {
                showToast('Inquiry sent to Safaricom. Listening for live callback...', 'info');

                let attempts = 0;
                const maxAttempts = 12; // 18 seconds
                const pollInterval = setInterval(async () => {
                    attempts++;
                    setPollingSeconds(attempts * 1.5);
                    try {
                        const pollRes = await api.get(`/safaricom-apis/balance-result/${conversationId}`);
                        if (pollRes.data?.status === 'COMPLETED') {
                            clearInterval(pollInterval);
                            setIsPollingBalance(false);
                            setBalanceLoading(false);
                            setLatestBalance(pollRes.data);
                            setBalanceResult({
                                success: true,
                                summary: {
                                    title: '✅ Live Account Balance Retrieved & Saved to Database',
                                    description: `Working Float: KES ${Number(pollRes.data.workingAccount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} | Utility: KES ${Number(pollRes.data.utilityAccount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                                    shortCode: pollRes.data.shortCode,
                                    completedAt: new Date(pollRes.data.completedAt).toLocaleString()
                                },
                                ...pollRes.data
                            });
                            showToast(`Account balance synchronized: Working Float KES ${Number(pollRes.data.workingAccount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'success');
                        } else if (pollRes.data?.status === 'FAILED') {
                            clearInterval(pollInterval);
                            setIsPollingBalance(false);
                            setBalanceLoading(false);
                            setBalanceResult({
                                error: pollRes.data.resultDesc || 'Safaricom returned an error for this balance inquiry.',
                                darajaResponse: pollRes.data
                            });
                            showToast(`Balance inquiry rejected: ${pollRes.data.resultDesc || 'Failed'}`, 'error');
                        } else if (attempts >= maxAttempts) {
                            clearInterval(pollInterval);
                            setIsPollingBalance(false);
                            setBalanceLoading(false);
                            showToast('Request accepted by Safaricom. Webhook callback will update the database momentarily.', 'info');
                        }
                    } catch (pollErr) {
                        console.error('Polling error:', pollErr);
                        if (attempts >= maxAttempts) {
                            clearInterval(pollInterval);
                            setIsPollingBalance(false);
                            setBalanceLoading(false);
                        }
                    }
                }, 1500);
            } else {
                setBalanceLoading(false);
                setIsPollingBalance(false);
            }
        } catch (err: any) {
            setIsPollingBalance(false);
            setBalanceLoading(false);
            const data = err.response?.data || {};
            const msg = data.error || 'Inquiry failed';
            showToast(msg, 'error');
            setBalanceResult(data.error ? data : { error: msg, darajaResponse: data });
        }
    };

    const handleQueryTxStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!txId) {
            showToast('Enter an M-Pesa Transaction ID', 'error');
            return;
        }
        setTxLoading(true);
        try {
            const res = await api.post('/safaricom-apis/transaction-status', { transactionId: txId });
            setTxResult(res.data);
            showToast('Transaction inquiry completed', 'success');
        } catch (err: any) {
            const data = err.response?.data || {};
            const msg = data.error || 'Query failed';
            showToast(msg, 'error');
            setTxResult(data.error ? data : { error: msg, darajaResponse: data });
        } finally {
            setTxLoading(false);
        }
    };

    const handleReversal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!revTxId || !revAmount) {
            showToast('Enter Transaction ID and Amount', 'error');
            return;
        }
        setRevLoading(true);
        try {
            const res = await api.post('/safaricom-apis/reversal', {
                transactionId: revTxId,
                amount: Number(revAmount),
                remarks: revRemarks
            });
            setRevResult(res.data);
            showToast('Reversal request sent to Daraja', 'success');
        } catch (err: any) {
            const data = err.response?.data || {};
            const msg = data.error || 'Reversal failed';
            showToast(msg, 'error');
            setRevResult(data.error ? data : { error: msg, darajaResponse: data });
        } finally {
            setRevLoading(false);
        }
    };

    const handleDisbursement = async (e: React.FormEvent) => {
        e.preventDefault();
        setDisbLoading(true);
        try {
            if (disbType === 'b2b') {
                const res = await api.post('/safaricom-apis/b2b', {
                    partyB: b2bPartyB,
                    amount: Number(b2bAmount),
                    accountReference: b2bAccountRef || 'B2B Transfer',
                    commandId: b2bCommand,
                    receiverType: b2bCommand === 'BusinessBuyGoods' ? '2' : '4'
                });
                setDisbResult(res.data);
                showToast('B2B transfer dispatched', 'success');
            } else {
                const res = await api.post('/safaricom-apis/business-to-pochi', {
                    phoneNumber: pochiPhone,
                    amount: Number(pochiAmount)
                });
                setDisbResult(res.data);
                showToast('Pochi disbursement dispatched', 'success');
            }
        } catch (err: any) {
            const data = err.response?.data || {};
            const msg = data.error || 'Disbursement failed';
            showToast(msg, 'error');
            setDisbResult(data.error ? data : { error: msg, darajaResponse: data });
        } finally {
            setDisbLoading(false);
        }
    };

    const handleCreateRatiba = async (e: React.FormEvent) => {
        e.preventDefault();
        setRatibaLoading(true);
        try {
            const res = await api.post('/safaricom-apis/ratiba', {
                standingOrderName: ratibaName,
                amount: Number(ratibaAmount),
                phoneNumber: ratibaPhone,
                frequency: ratibaFreq,
                startDate: ratibaStart,
                endDate: ratibaEnd,
                accountRef: ratibaName
            });
            setRatibaResult(res.data);
            showToast('M-Pesa Ratiba standing order registered', 'success');
        } catch (err: any) {
            const data = err.response?.data || {};
            const msg = data.error || 'Standing order creation failed';
            showToast(msg, 'error');
            setRatibaResult(data.error ? data : { error: msg, darajaResponse: data });
        } finally {
            setRatibaLoading(false);
        }
    };

    const handlePullTransactions = async (e: React.FormEvent) => {
        e.preventDefault();
        setPullLoading(true);
        try {
            const res = await api.post('/safaricom-apis/pull-transactions', {
                startDate: pullStart,
                endDate: pullEnd,
                offset: pullOffset
            });
            setPullResult(res.data);
            showToast('Transactions pulled successfully', 'success');
        } catch (err: any) {
            const data = err.response?.data || {};
            const msg = data.error || 'Pull query failed';
            showToast(msg, 'error');
            setPullResult(data.error ? data : { error: msg, darajaResponse: data });
        } finally {
            setPullLoading(false);
        }
    };

    const handleKycValidation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!kycPhone) {
            showToast('Enter a phone number', 'error');
            return;
        }
        setKycLoading(true);
        try {
            const res = await api.post('/safaricom-apis/validate-mobile', { phoneNumber: kycPhone });
            setKycResult(res.data);
            showToast('Mobile validation completed', 'success');
        } catch (err: any) {
            const data = err.response?.data || {};
            const msg = data.error || 'Validation failed';
            showToast(msg, 'error');
            setKycResult(data.error ? data : { error: msg, darajaResponse: data });
        } finally {
            setKycLoading(false);
        }
    };

    const handleRegisterC2b = async () => {
        setC2bLoading(true);
        try {
            const res = await api.post('/safaricom-apis/c2b/register', {
                confirmationUrl: c2bConfUrl,
                validationUrl: c2bValUrl
            });
            setC2bResult(res.data);
            showToast('C2B Webhook URLs registered with Safaricom', 'success');
        } catch (err: any) {
            const data = err.response?.data || {};
            const msg = data.error || 'URL registration failed';
            showToast(msg, 'error');
            setC2bResult(data.error ? data : { error: msg, darajaResponse: data });
        } finally {
            setC2bLoading(false);
        }
    };

    const handleSimulateC2b = async (e: React.FormEvent) => {
        e.preventDefault();
        setC2bLoading(true);
        try {
            const res = await api.post('/safaricom-apis/c2b/simulate', {
                phoneNumber: c2bSimPhone,
                amount: Number(c2bSimAmount),
                billRefNumber: c2bSimRef
            });
            setC2bResult(res.data);
            showToast('C2B Payment simulated successfully', 'success');
        } catch (err: any) {
            const data = err.response?.data || {};
            const msg = data.error || 'Simulation failed';
            showToast(msg, 'error');
            setC2bResult(data.error ? data : { error: msg, darajaResponse: data });
        } finally {
            setC2bLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-zinc-800 pb-6">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs tracking-wider uppercase mb-1">
                            <ShieldCheck className="w-4 h-4" /> Official Safaricom Daraja Production Services
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            M-Pesa Services Hub
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-2xl">
                            Comprehensive operations console for all 11+ Safaricom production M-Pesa services: Inquire float balances, audit transactions, trigger B2B transfers & Pochi la Biashara disbursements, manage M-Pesa Ratiba standing orders, and inspect mobile KYC.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={fetchOverview}
                            disabled={loadingOverview}
                            className="flex items-center gap-2 text-sm"
                        >
                            <RefreshCw className={`w-4 h-4 ${loadingOverview ? 'animate-spin' : ''}`} />
                            Refresh Status
                        </Button>
                        <Link href="/settings">
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 text-sm">
                                M-Pesa Settings
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Quick Diagnostics Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card className="p-4 border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                        <p className="text-xs text-gray-500 font-medium">Configured Shortcode</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                            {overviewData?.credentialsSummary?.shortCode || '174379'}
                        </p>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Active Paybill/Till</span>
                    </Card>

                    <Card className="p-4 border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                        <p className="text-xs text-gray-500 font-medium">Daraja Environment</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white mt-1 uppercase">
                            {overviewData?.credentialsSummary?.environment || 'Sandbox'}
                        </p>
                        <span className="text-[10px] text-gray-500 font-medium">Safaricom Gateway</span>
                    </Card>

                    <Card className="p-4 border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                        <p className="text-xs text-gray-500 font-medium">API Health Status</p>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            {overviewData?.readyApis || 13} / {overviewData?.totalApis || 13} Ready
                        </p>
                        <span className="text-[10px] text-emerald-600 font-medium">All Endpoints Active</span>
                    </Card>

                    <Card className="p-4 border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                        <p className="text-xs text-gray-500 font-medium">Security Credential</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                            {overviewData?.credentialsSummary?.hasInitiatorPassword ? 'Configured' : 'Needs Password'}
                        </p>
                        <span className="text-[10px] text-gray-500 font-medium">Required for B2B/Reversals</span>
                    </Card>
                </div>

                {/* Persistent Live M-Pesa Float Strip */}
                {latestBalance && (
                    <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-emerald-600 text-white shrink-0">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Live Stored Float</span>
                                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Database className="w-3 h-3" /> Saved in Database
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-baseline gap-4 mt-1">
                                    <div>
                                        <span className="text-xs text-gray-500 mr-1.5">Working Float:</span>
                                        <span className="text-base font-extrabold text-gray-900 dark:text-white font-mono">
                                            KES {Number(latestBalance.workingAccount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 mr-1.5">Utility Account:</span>
                                        <span className="text-base font-extrabold text-gray-900 dark:text-white font-mono">
                                            KES {Number(latestBalance.utilityAccount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-center">
                            <button
                                onClick={() => setActiveTab('balance')}
                                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline flex items-center gap-1"
                            >
                                Manage Float & Query Live &rarr;
                            </button>
                        </div>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="border-b border-gray-200 dark:border-zinc-800 overflow-x-auto">
                    <div className="flex space-x-2 min-w-max pb-1">
                        {[
                            { id: 'overview', label: 'All M-Pesa Services (11+)', icon: Activity },
                            { id: 'balance', label: 'Account Balance', icon: Building2 },
                            { id: 'status', label: 'Transaction Status', icon: Search },
                            { id: 'disbursements', label: 'B2B & Pochi Payouts', icon: ArrowUpRight },
                            { id: 'reversal', label: 'Reversal Console', icon: Undo2 },
                            { id: 'ratiba', label: 'M-Pesa Ratiba', icon: Repeat },
                            { id: 'pull', label: 'Pull Transactions', icon: Download },
                            { id: 'kyc', label: 'Mobile & KYC Validator', icon: Smartphone },
                            { id: 'c2b', label: 'C2B URLs & Simulator', icon: ArrowLeftRight }
                        ].map(t => {
                            const Icon = t.icon;
                            const isActive = activeTab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTab(t.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all ${isActive
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{t.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* TAB 1: ALL M-PESA SERVICES (11+ Services) */}
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Production M-Pesa Services Directory (11+ Active Daraja Services)
                            </h2>
                            <span className="text-xs text-gray-500">
                                Matching Safaricom Production App Configuration
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {overviewData?.apis?.map((apiItem: any) => (
                                <Card
                                    key={apiItem.id}
                                    className="p-5 border border-gray-100 dark:border-zinc-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300">
                                                {apiItem.category}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${apiItem.status === 'READY'
                                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                                                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                                                }`}>
                                                {apiItem.status === 'READY' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                {apiItem.status}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{apiItem.name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-3">
                                            {apiItem.description}
                                        </p>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                                        <code className="text-gray-400 truncate max-w-[170px]">{apiItem.endpoint}</code>
                                        <button
                                            onClick={() => {
                                                if (apiItem.id === 'account_balance') setActiveTab('balance');
                                                else if (apiItem.id === 'transaction_status') setActiveTab('status');
                                                else if (apiItem.id === 'reversal') setActiveTab('reversal');
                                                else if (apiItem.id === 'b2b' || apiItem.id === 'business_to_pochi') setActiveTab('disbursements');
                                                else if (apiItem.id === 'mpesa_ratiba') setActiveTab('ratiba');
                                                else if (apiItem.id === 'pull_transactions') setActiveTab('pull');
                                                else if (apiItem.id === 'mobile_validation') setActiveTab('kyc');
                                                else if (apiItem.id === 'c2b_v2') setActiveTab('c2b');
                                                else if (apiItem.id === 'dynamic_qrcode') window.location.href = '/qr-generator';
                                            }}
                                            className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                                        >
                                            Launch Console &rarr;
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 2: ACCOUNT BALANCE */}
                {activeTab === 'balance' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        {/* Live Account Balance Top Cards */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-zinc-800 pb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                                        <Building2 className="w-5 h-5 text-emerald-600" />
                                        M-Pesa Multi-Account Live Balance
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Real-time ledger synchronized with Safaricom Daraja core network. Data is stored securely in your database and retained across page refreshes.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={fetchLatestBalance}
                                        className="text-xs flex items-center gap-1.5 border-gray-200 dark:border-zinc-700"
                                    >
                                        <Database className="w-3.5 h-3.5 text-emerald-600" />
                                        Sync from DB
                                    </Button>
                                    <span className="text-[11px] font-mono bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-lg">
                                        Shortcode: {latestBalance?.shortCode || overviewData?.credentialsSummary?.shortCode || '—'}
                                    </span>
                                </div>
                            </div>

                            {/* 3 Metric Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {/* Working Account Card */}
                                <div className="p-5 rounded-xl border border-emerald-200/70 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <Wallet className="w-4 h-4 text-emerald-600" /> Working Account Float
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300">
                                            Disbursements
                                        </span>
                                    </div>
                                    <p className="text-2xl sm:text-3xl font-extrabold text-emerald-950 dark:text-white font-mono tracking-tight my-2">
                                        KES {Number(latestBalance?.workingAccount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed">
                                        Available float for B2C disbursements, vendor payouts, and operational settlement.
                                    </p>
                                </div>

                                {/* Utility Account Card */}
                                <div className="p-5 rounded-xl border border-blue-200/70 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <Building2 className="w-4 h-4 text-blue-600" /> Utility Account
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/70 text-blue-700 dark:text-blue-300">
                                            Collections
                                        </span>
                                    </div>
                                    <p className="text-2xl sm:text-3xl font-extrabold text-blue-950 dark:text-white font-mono tracking-tight my-2">
                                        KES {Number(latestBalance?.utilityAccount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-[11px] text-blue-700/80 dark:text-blue-400/80 leading-relaxed">
                                        Revenue accumulated from customer Paybill and Till Number transactions.
                                    </p>
                                </div>

                                {/* Charges Paid Card */}
                                <div className="p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <DollarSign className="w-4 h-4 text-zinc-500" /> Charges Paid Account
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                            Tariffs
                                        </span>
                                    </div>
                                    <p className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white font-mono tracking-tight my-2">
                                        KES {Number(latestBalance?.chargesPaidAccount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        Cumulative Safaricom network processing tariffs and operator charges.
                                    </p>
                                </div>
                            </div>

                            {/* Sync Status Banner */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-emerald-600" />
                                    <span>
                                        Last synchronized: {latestBalance?.completedAt || latestBalance?.queriedAt ? new Date(latestBalance.completedAt || latestBalance.queriedAt!).toLocaleString() : 'Never queried yet'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Data Saved In DB & Persisted
                                    </span>
                                </div>
                            </div>

                            {/* Active Polling Status Banner */}
                            {isPollingBalance && (
                                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/30 flex items-start gap-3 animate-pulse">
                                    <RefreshCw className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-spin mt-0.5 shrink-0" />
                                    <div>
                                        <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                            Awaiting Asynchronous Safaricom Webhook Callback ({pollingSeconds}s elapsed)...
                                        </h4>
                                        <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                                            Safaricom processes balance inquiries asynchronously. The moment the callback arrives at your ResultURL, your database and these metric cards will update automatically.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Detailed Sub-Account Ledger Table */}
                            {latestBalance?.accounts && latestBalance.accounts.length > 0 && (
                                <div className="space-y-3 pt-2">
                                    <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                        Sub-Account Breakdown Ledger
                                    </h4>
                                    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-zinc-800">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-gray-50 dark:bg-zinc-800/60 text-gray-600 dark:text-gray-400 font-semibold">
                                                <tr>
                                                    <th className="py-2.5 px-4">Account Name</th>
                                                    <th className="py-2.5 px-4">Currency</th>
                                                    <th className="py-2.5 px-4 text-right">Current Balance</th>
                                                    <th className="py-2.5 px-4 text-right">Available Balance</th>
                                                    <th className="py-2.5 px-4 text-right">Reserved Balance</th>
                                                    <th className="py-2.5 px-4 text-right">Uncleared Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 font-mono">
                                                {latestBalance.accounts.map((acc: any, i: number) => (
                                                    <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                                                        <td className="py-2.5 px-4 font-sans font-medium text-gray-900 dark:text-white">
                                                            {acc.accountName}
                                                        </td>
                                                        <td className="py-2.5 px-4 text-gray-500">{acc.currency}</td>
                                                        <td className="py-2.5 px-4 text-right font-bold text-gray-900 dark:text-white">
                                                            KES {Number(acc.currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="py-2.5 px-4 text-right text-emerald-600 font-bold">
                                                            KES {Number(acc.availableBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="py-2.5 px-4 text-right text-gray-500">
                                                            KES {Number(acc.reservedBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="py-2.5 px-4 text-right text-gray-500">
                                                            KES {Number(acc.unclearedBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Inquiry Action Form & Feedback */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            <Card className="p-6 border border-gray-100 dark:border-zinc-800">
                                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-emerald-600" />
                                    Inquire Live Account Balance
                                </h2>
                                <p className="text-xs text-gray-500 mb-6">
                                    Dispatches an encrypted balance query to Safaricom Daraja. The response payload will be intercepted by your webhook and persisted to the database.
                                </p>

                                <form onSubmit={handleQueryBalance} className="space-y-4">
                                    <Input
                                        label="Query Remarks"
                                        value={balanceRemarks}
                                        onChange={(e: any) => setBalanceRemarks(e.target.value)}
                                        placeholder="e.g. Morning Float Check"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={balanceLoading || isPollingBalance}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${(balanceLoading || isPollingBalance) ? 'animate-spin' : ''}`} />
                                        {isPollingBalance ? `Syncing with Safaricom (${pollingSeconds}s)...` : balanceLoading ? 'Querying Safaricom...' : 'Inquire Live Account Balance'}
                                    </Button>
                                </form>
                            </Card>

                            <Card className="p-6 border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
                                    <span>Daraja Operational Feedback</span>
                                    {balanceResult && <span className="text-[10px] font-normal text-gray-500">Live network sync</span>}
                                </h3>
                                {balanceResult ? (
                                    <ResponseViewer result={balanceResult} title="Account Balance Result" />
                                ) : (
                                    <div className="text-center py-12 text-gray-400 text-xs">
                                        Click "Inquire Live Account Balance" to query Safaricom.
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                )}

                {/* TAB 3: TRANSACTION STATUS */}
                {activeTab === 'status' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-in fade-in duration-200">
                        <Card className="p-6 border border-gray-100 dark:border-zinc-800">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <Search className="w-5 h-5 text-emerald-600" />
                                Transaction Status & Audit Inspector
                            </h2>
                            <p className="text-xs text-gray-500 mb-6">
                                Enter any M-Pesa Receipt Number (e.g. SAB1234567, QAB1234567) to fetch transaction confirmation and network logs.
                            </p>

                            <form onSubmit={handleQueryTxStatus} className="space-y-4">
                                <Input
                                    label="M-Pesa Transaction ID"
                                    value={txId}
                                    onChange={(e: any) => setTxId(e.target.value)}
                                    placeholder="e.g. SAB1234567"
                                    required
                                />
                                <Button
                                    type="submit"
                                    disabled={txLoading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
                                >
                                    <Search className="w-4 h-4" />
                                    {txLoading ? 'Searching Network...' : 'Audit Transaction Status'}
                                </Button>
                            </form>
                        </Card>

                        <Card className="p-6 border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
                                <span>Audit Response</span>
                                {txResult && <span className="text-[10px] font-normal text-gray-500">Live query status</span>}
                            </h3>
                            {txResult ? (
                                <ResponseViewer result={txResult} title="Transaction Audit Result" />
                            ) : (
                                <div className="text-center py-12 text-gray-400 text-xs">
                                    Enter a transaction ID to inspect.
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {/* TAB 4: DISBURSEMENTS (B2B & POCHI) */}
                {activeTab === 'disbursements' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-in fade-in duration-200">
                        <Card className="p-6 border border-gray-100 dark:border-zinc-800">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                                Outbound Disbursements: B2B & Pochi
                            </h2>
                            <p className="text-xs text-gray-500 mb-6">
                                Disburse funds directly from your business shortcode to other business paybills, tills, or Pochi la Biashara.
                            </p>

                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setDisbType('b2b')}
                                    className={`py-2 text-xs font-semibold rounded-lg border ${disbType === 'b2b'
                                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                                        : 'border-gray-200 dark:border-zinc-700 text-gray-600'
                                        }`}
                                >
                                    B2B Transfer
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDisbType('pochi')}
                                    className={`py-2 text-xs font-semibold rounded-lg border ${disbType === 'pochi'
                                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                                        : 'border-gray-200 dark:border-zinc-700 text-gray-600'
                                        }`}
                                >
                                    Business to Pochi
                                </button>
                            </div>

                            <form onSubmit={handleDisbursement} className="space-y-4">
                                {disbType === 'b2b' ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setB2bCommand('BusinessPayBill')}
                                                className={`py-1.5 text-xs rounded border ${b2bCommand === 'BusinessPayBill' ? 'bg-gray-100 dark:bg-zinc-800 font-bold' : ''}`}
                                            >
                                                To Paybill
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setB2bCommand('BusinessBuyGoods')}
                                                className={`py-1.5 text-xs rounded border ${b2bCommand === 'BusinessBuyGoods' ? 'bg-gray-100 dark:bg-zinc-800 font-bold' : ''}`}
                                            >
                                                To Till Number
                                            </button>
                                        </div>

                                        <Input
                                            label={b2bCommand === 'BusinessBuyGoods' ? 'Destination Till Number' : 'Destination Paybill'}
                                            value={b2bPartyB}
                                            onChange={(e: any) => setB2bPartyB(e.target.value)}
                                            placeholder="e.g. 500201 or 600000"
                                            required
                                        />

                                        <Input
                                            label="Account Reference"
                                            value={b2bAccountRef}
                                            onChange={(e: any) => setB2bAccountRef(e.target.value)}
                                            placeholder="e.g. Invoice 101"
                                            required
                                        />

                                        <Input
                                            label="Amount (KES)"
                                            type="number"
                                            min="1"
                                            value={b2bAmount}
                                            onChange={(e: any) => setB2bAmount(e.target.value)}
                                            placeholder="100"
                                            required
                                        />
                                    </>
                                ) : (
                                    <>
                                        <Input
                                            label="Pochi la Biashara Phone Number"
                                            value={pochiPhone}
                                            onChange={(e: any) => setPochiPhone(e.target.value)}
                                            placeholder="07XX XXX XXX"
                                            required
                                        />
                                        <Input
                                            label="Amount (KES)"
                                            type="number"
                                            min="1"
                                            value={pochiAmount}
                                            onChange={(e: any) => setPochiAmount(e.target.value)}
                                            placeholder="500"
                                            required
                                        />
                                    </>
                                )}

                                <Button
                                    type="submit"
                                    disabled={disbLoading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    {disbLoading ? 'Dispatching...' : 'Submit Disbursement'}
                                </Button>
                            </form>
                        </Card>

                        <Card className="p-6 border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
                                <span>Disbursement Status</span>
                                {disbResult && <span className="text-[10px] font-normal text-gray-500">Live network sync</span>}
                            </h3>
                            {disbResult ? (
                                <ResponseViewer result={disbResult} title="Disbursement Response" />
                            ) : (
                                <div className="text-center py-12 text-gray-400 text-xs">
                                    Disbursement logs and confirmation will appear here.
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {/* TAB 5: TRANSACTION REVERSAL */}
                {activeTab === 'reversal' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-in fade-in duration-200">
                        <Card className="p-6 border border-gray-100 dark:border-zinc-800">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <Undo2 className="w-5 h-5 text-red-500" />
                                M-Pesa Transaction Reversal Console
                            </h2>
                            <p className="text-xs text-gray-500 mb-6">
                                Request a formal reversal on the M-Pesa network for transactions made to your shortcode in error.
                            </p>

                            <form onSubmit={handleReversal} className="space-y-4">
                                <Input
                                    label="Transaction ID to Reverse"
                                    value={revTxId}
                                    onChange={(e: any) => setRevTxId(e.target.value)}
                                    placeholder="e.g. QAB1234567"
                                    required
                                />
                                <Input
                                    label="Reversal Amount (KES)"
                                    type="number"
                                    min="1"
                                    value={revAmount}
                                    onChange={(e: any) => setRevAmount(e.target.value)}
                                    placeholder="100"
                                    required
                                />
                                <Input
                                    label="Reversal Remarks"
                                    value={revRemarks}
                                    onChange={(e: any) => setRevRemarks(e.target.value)}
                                    placeholder="e.g. Mistaken Customer Payment"
                                />

                                <Button
                                    type="submit"
                                    disabled={revLoading}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
                                >
                                    <Undo2 className="w-4 h-4" />
                                    {revLoading ? 'Requesting Reversal...' : 'Submit Reversal Request'}
                                </Button>
                            </form>
                        </Card>

                        <Card className="p-6 border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
                                <span>Reversal Status</span>
                                {revResult && <span className="text-[10px] font-normal text-gray-500">Live network sync</span>}
                            </h3>
                            {revResult ? (
                                <ResponseViewer result={revResult} title="Reversal Response" />
                            ) : (
                                <div className="text-center py-12 text-gray-400 text-xs">
                                    Reversal confirmation and Daraja reference will display here.
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {/* TAB 6: M-PESA RATIBA */}
                {activeTab === 'ratiba' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-in fade-in duration-200">
                        <Card className="p-6 border border-gray-100 dark:border-zinc-800">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <Repeat className="w-5 h-5 text-emerald-600" />
                                M-Pesa Ratiba (Standing Orders)
                            </h2>
                            <p className="text-xs text-gray-500 mb-6">
                                Create an automated recurring standing order on a customer's M-Pesa wallet for recurring club memberships, rent, or service subscriptions.
                            </p>

                            <form onSubmit={handleCreateRatiba} className="space-y-4">
                                <Input
                                    label="Standing Order Name"
                                    value={ratibaName}
                                    onChange={(e: any) => setRatibaName(e.target.value)}
                                    placeholder="e.g. VIP Gym Membership"
                                    required
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Customer Phone Number"
                                        value={ratibaPhone}
                                        onChange={(e: any) => setRatibaPhone(e.target.value)}
                                        placeholder="07XX XXX XXX"
                                        required
                                    />
                                    <Input
                                        label="Amount (KES)"
                                        type="number"
                                        min="1"
                                        value={ratibaAmount}
                                        onChange={(e: any) => setRatibaAmount(e.target.value)}
                                        placeholder="1000"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                        Frequency
                                    </label>
                                    <select
                                        value={ratibaFreq}
                                        onChange={(e) => setRatibaFreq(e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                    >
                                        <option value="1">Daily</option>
                                        <option value="2">Weekly</option>
                                        <option value="3">Monthly</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Start Date (YYYYMMDD)"
                                        value={ratibaStart}
                                        onChange={(e: any) => setRatibaStart(e.target.value)}
                                        placeholder="20261001"
                                        required
                                    />
                                    <Input
                                        label="End Date (YYYYMMDD)"
                                        value={ratibaEnd}
                                        onChange={(e: any) => setRatibaEnd(e.target.value)}
                                        placeholder="20271001"
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={ratibaLoading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
                                >
                                    <Repeat className="w-4 h-4" />
                                    {ratibaLoading ? 'Creating Order...' : 'Register Standing Order'}
                                </Button>
                            </form>
                        </Card>

                        <Card className="p-6 border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
                                <span>Ratiba Registration Feedback</span>
                                {ratibaResult && <span className="text-[10px] font-normal text-gray-500">Live network sync</span>}
                            </h3>
                            {ratibaResult ? (
                                <ResponseViewer result={ratibaResult} title="Ratiba Registration" />
                            ) : (
                                <div className="text-center py-12 text-gray-400 text-xs">
                                    Standing order creation feedback will appear here.
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {/* TAB 7: PULL TRANSACTIONS */}
                {activeTab === 'pull' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-in fade-in duration-200">
                        <Card className="p-6 border border-gray-100 dark:border-zinc-800">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <Download className="w-5 h-5 text-emerald-600" />
                                PullTransactions Prod Explorer
                            </h2>
                            <p className="text-xs text-gray-500 mb-6">
                                Safaricom Pull API queries transaction batches within custom date ranges for reconciliation.
                            </p>

                            <form onSubmit={handlePullTransactions} className="space-y-4">
                                <Input
                                    label="Start Date (YYYY-MM-DD HH:mm:ss)"
                                    value={pullStart}
                                    onChange={(e: any) => setPullStart(e.target.value)}
                                    placeholder="2026-09-01 00:00:00"
                                    required
                                />
                                <Input
                                    label="End Date (YYYY-MM-DD HH:mm:ss)"
                                    value={pullEnd}
                                    onChange={(e: any) => setPullEnd(e.target.value)}
                                    placeholder="2026-09-20 23:59:59"
                                    required
                                />
                                <Input
                                    label="Offset Value"
                                    value={pullOffset}
                                    onChange={(e: any) => setPullOffset(e.target.value)}
                                    placeholder="0"
                                />
                                <Button
                                    type="submit"
                                    disabled={pullLoading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    {pullLoading ? 'Pulling Data...' : 'Pull Transactions Stream'}
                                </Button>
                            </form>
                        </Card>

                        <Card className="p-6 border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
                                <span>Pulled Transaction Records</span>
                                {pullResult && <span className="text-[10px] font-normal text-gray-500">Live query status</span>}
                            </h3>
                            {pullResult ? (
                                <ResponseViewer result={pullResult} title="Pull Transactions Stream" />
                            ) : (
                                <div className="text-center py-12 text-gray-400 text-xs">
                                    Select date range to pull settlement records.
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {/* TAB 8: MOBILE NUMBER & KYC VALIDATOR */}
                {activeTab === 'kyc' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-in fade-in duration-200">
                        <Card className="p-6 border border-gray-100 dark:border-zinc-800">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-emerald-600" />
                                Mobile Number & Network Validator
                            </h2>
                            <p className="text-xs text-gray-500 mb-6">
                                Validates phone number format, carrier detection (Safaricom vs Airtel vs Telkom), and checks active network eligibility before STK push.
                            </p>

                            <form onSubmit={handleKycValidation} className="space-y-4">
                                <Input
                                    label="Phone Number to Validate"
                                    value={kycPhone}
                                    onChange={(e: any) => setKycPhone(e.target.value)}
                                    placeholder="07XX XXX XXX or 2547XX XXX XXX"
                                    required
                                />
                                <Button
                                    type="submit"
                                    disabled={kycLoading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
                                >
                                    <Smartphone className="w-4 h-4" />
                                    {kycLoading ? 'Validating...' : 'Validate Carrier & KYC'}
                                </Button>
                            </form>
                        </Card>

                        <Card className="p-6 border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Validation Result</h3>
                            {kycResult ? (
                                <div className="space-y-3">
                                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Phone:</span>
                                            <span className="font-bold">{kycResult.phoneNumber}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Carrier:</span>
                                            <span className="font-bold text-emerald-600">{kycResult.carrier}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">M-Pesa Supported:</span>
                                            <span className="font-semibold">{kycResult.isMpesaSupported ? 'Yes (Native)' : 'No (Cross-network)'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Format Valid:</span>
                                            <span className="font-semibold">{kycResult.isValidFormat ? 'Valid Kenya MSISDN' : 'Invalid'}</span>
                                        </div>
                                    </div>
                                    <pre className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 text-[11px] overflow-x-auto text-gray-800 dark:text-emerald-400 font-mono">
                                        {JSON.stringify(kycResult.darajaStatus, null, 2)}
                                    </pre>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400 text-xs">
                                    Enter phone number to validate carrier and network status.
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {/* TAB 9: C2B URL REGISTRATION & SIMULATOR */}
                {activeTab === 'c2b' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-in fade-in duration-200">
                        {/* URL Registration Card */}
                        <Card className="p-6 border border-gray-100 dark:border-zinc-800 space-y-4">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <ArrowLeftRight className="w-5 h-5 text-emerald-600" />
                                1. C2B URL Registration
                            </h2>
                            <p className="text-xs text-gray-500">
                                Registers your Confirmation and Validation webhook endpoints with Safaricom Daraja so paybill/till payments automatically notify your app.
                            </p>

                            <Input
                                label="Confirmation URL"
                                value={c2bConfUrl}
                                onChange={(e: any) => setC2bConfUrl(e.target.value)}
                                placeholder="https://mpesaconnect.co.ke/api/mpesa/callback"
                            />
                            <Input
                                label="Validation URL"
                                value={c2bValUrl}
                                onChange={(e: any) => setC2bValUrl(e.target.value)}
                                placeholder="https://mpesaconnect.co.ke/api/mpesa/callback"
                            />

                            <Button
                                onClick={handleRegisterC2b}
                                disabled={c2bLoading}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 text-xs py-2.5"
                            >
                                Register Webhooks with Safaricom
                            </Button>
                        </Card>

                        {/* Simulator Card */}
                        <Card className="p-6 border border-gray-100 dark:border-zinc-800 space-y-4">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-emerald-600" />
                                2. C2B Payment Simulator
                            </h2>
                            <p className="text-xs text-gray-500">
                                Simulate an inbound customer Paybill payment to test webhook reception and ledger updates.
                            </p>

                            <form onSubmit={handleSimulateC2b} className="space-y-3">
                                <Input
                                    label="Simulated Customer MSISDN"
                                    value={c2bSimPhone}
                                    onChange={(e: any) => setC2bSimPhone(e.target.value)}
                                    placeholder="2547XXXXXXXX"
                                    required
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        label="Amount (KES)"
                                        type="number"
                                        value={c2bSimAmount}
                                        onChange={(e: any) => setC2bSimAmount(e.target.value)}
                                        placeholder="100"
                                        required
                                    />
                                    <Input
                                        label="Bill Reference"
                                        value={c2bSimRef}
                                        onChange={(e: any) => setC2bSimRef(e.target.value)}
                                        placeholder="TestBill"
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={c2bLoading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 text-xs py-2.5"
                                >
                                    Simulate Payment to Shortcode
                                </Button>
                            </form>

                            {c2bResult && (
                                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800">
                                    <ResponseViewer result={c2bResult} title="C2B Simulation Feedback" />
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
