'use client';

import { useState, useEffect } from 'react';
import { Shield, Key, Copy, CheckCircle, AlertTriangle, ExternalLink, Mail, Phone, Server, CreditCard, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function LicenseErrorPage() {
    const router = useRouter();
    const [licenseKey, setLicenseKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [serverInfo, setServerInfo] = useState<{ fingerprint: string; domain: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'activate' | 'request'>('activate');

    useEffect(() => {
        fetchServerInfo();
    }, []);

    const fetchServerInfo = async () => {
        try {
            // Use relative path for production compatibility
            const { data } = await axios.get('/api/license/fingerprint');
            setServerInfo(data);
        } catch (error) {
            console.error('Failed to fetch server info:', error);
            // Show more descriptive error
            setServerInfo({ fingerprint: 'CONNECTION-FAILED', domain: window.location.hostname });
        }
    };

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!licenseKey.trim()) return;

        setIsLoading(true);
        try {
            // Try activating as user license first
            await axios.post('/api/user-license/activate', {
                licenseKey,
                serverFingerprint: serverInfo?.fingerprint,
                domain: serverInfo?.domain
            });

            toast.success('License Activated Successfully! Redirecting...');
            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);
        } catch (error: any) {
            console.error('Activation error:', error);
            // If user license activation fails, it might be a master key attempt via the admin panel logic
            // But from this public page, we only support user license keys for now.
            const errorMsg = error.response?.data?.error || 'Activation failed. Invalid key.';
            toast.error(errorMsg);
            setIsLoading(false);
        }
    };

    const handleCopyFingerprint = () => {
        if (serverInfo?.fingerprint) {
            navigator.clipboard.writeText(serverInfo.fingerprint);
            toast.success('Server Fingerprint Copied!');
        }
    };

    const handlePurchase = () => {
        // Redirect to purchase logic or external site
        window.location.href = 'mailto:info@kkdes.co.ke?subject=Enterprise License Purchase Request';
    };

    return (
        <div className="min-h-screen bg-[#FDF8F6] flex items-center justify-center p-4">
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-3xl shadow-2xl overflow-hidden border border-red-50">

                {/* Left Side: status & Info */}
                <div className="p-8 md:p-12 flex flex-col justify-between bg-gradient-to-br from-red-50 to-white">
                    <div>
                        <div className="mb-8">
                            <div className="h-16 w-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                <Shield className="h-8 w-8 text-red-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Restricted</h1>
                            <p className="text-gray-600 text-lg">
                                This application requires a valid license to operate.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Server className="h-4 w-4" /> Server Identity
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center group">
                                        <span className="text-sm text-gray-500">Domain</span>
                                        <span className="font-mono text-sm font-medium text-gray-800 bg-gray-50 px-2 py-1 rounded">
                                            {serverInfo?.domain || 'Loading...'}
                                        </span>
                                    </div>
                                    <div className="border-t border-dashed border-gray-100 my-2"></div>
                                    <div className="flex justify-between items-center group">
                                        <span className="text-sm text-gray-500">Fingerprint</span>
                                        <button
                                            onClick={handleCopyFingerprint}
                                            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors bg-blue-50 px-2 py-1 rounded cursor-pointer"
                                        >
                                            {serverInfo?.fingerprint ? serverInfo.fingerprint.substring(0, 16) + '...' : 'Loading...'}
                                            <Copy className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 text-sm text-gray-600">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                                        <Mail className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <span>info@kkdes.co.ke</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
                                        <Phone className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <span>+254 724 454 757</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-center text-gray-400">
                        &copy; 2026 KK Dynamic Enterprise Solutions LTD
                    </div>
                </div>

                {/* Right Side: Action Forms */}
                <div className="p-8 md:p-12 md:pl-0 flex flex-col justify-center">

                    {/* Tabs */}
                    <div className="flex p-1 bg-gray-100 rounded-xl mb-8">
                        <button
                            onClick={() => setActiveTab('activate')}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'activate'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Enter License Key
                        </button>
                        <button
                            onClick={() => setActiveTab('request')}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'request'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Request Access
                        </button>
                    </div>

                    {activeTab === 'activate' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Activate Software</h2>
                                <p className="text-gray-500 text-sm">
                                    Enter your one-time license key to verify ownership and unlock full access.
                                </p>
                            </div>

                            <form onSubmit={handleActivate} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">License Key</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Key className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={licenseKey}
                                            onChange={(e) => setLicenseKey(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono uppercase placeholder-gray-400"
                                            placeholder="ENT-XXXX-XXXX-XXXX"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !licenseKey}
                                    className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <RefreshCw className="h-4 w-4 animate-spin" /> Verifying...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Activate License <CheckCircle className="h-4 w-4" />
                                        </span>
                                    )}
                                </button>
                            </form>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="px-2 bg-white text-sm text-gray-400 font-medium">OR</span>
                                </div>
                            </div>

                            <button
                                onClick={handlePurchase}
                                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-100"
                            >
                                <CreditCard className="h-4 w-4" /> Purchase Enterprise Plan
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Request Access</h2>
                                <p className="text-gray-500 text-sm">
                                    Submit a request to our sales team. We'll review your details and get back to you shortly.
                                </p>
                            </div>

                            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success('Request sent! We will contact you soon.'); }}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-700">First Name</label>
                                        <input type="text" className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="John" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-700">Last Name</label>
                                        <input type="text" className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Doe" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-700">Company Email</label>
                                    <input type="email" className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="john@company.com" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-700">Phone Number</label>
                                    <input type="tel" className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="+254..." />
                                </div>

                                <button type="submit" className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors text-sm font-medium">
                                    Submit Request <ExternalLink className="h-4 w-4" />
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
