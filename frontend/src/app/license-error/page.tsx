'use client';

import { useEffect, useState } from 'react';
import { Shield, Mail, Phone, AlertTriangle, Server, Key } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function LicenseErrorPage() {
    const [serverInfo, setServerInfo] = useState<any>(null);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Form fields
    const [companyName, setCompanyName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [purpose, setPurpose] = useState('');

    useEffect(() => {
        // Try to get server fingerprint (will fail if not authenticated, but that's ok)
        fetch('/api/license/fingerprint')
            .then(res => res.json())
            .then(data => setServerInfo(data))
            .catch(() => {
                // If fingerprint endpoint fails, set basic info
                setServerInfo({
                    domain: window.location.hostname,
                    fingerprint: 'Contact admin for fingerprint'
                });
            });
    }, []);

    const handleSubmitRequest = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!serverInfo) return;

        try {
            setSubmitting(true);
            const response = await fetch('/api/license/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName,
                    contactEmail,
                    contactPhone,
                    domain: serverInfo.domain,
                    fingerprint: serverInfo.fingerprint,
                    hostname: serverInfo.hostname || window.location.hostname,
                    purpose
                })
            });

            if (response.ok) {
                setSubmitted(true);
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to submit request');
            }
        } catch (error) {
            alert('Failed to submit license request');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                {/* Main Error Card */}
                <Card className="p-8 border-2 border-red-500 bg-white shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                            <Shield className="w-10 h-10 text-red-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Software Unlicensed
                        </h1>
                        <p className="text-lg text-red-600 font-semibold mb-4">
                            This application requires a valid license to operate
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <p className="text-sm text-red-800">
                                Access Denied - No Valid License Found
                            </p>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">
                            Contact Us for License Activation
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-center gap-3">
                                <Mail className="w-5 h-5 text-indigo-600" />
                                <a
                                    href="mailto:info@kkdes.co.ke"
                                    className="text-indigo-600 hover:text-indigo-800 font-semibold text-lg"
                                >
                                    info@kkdes.co.ke
                                </a>
                            </div>
                            <div className="flex items-center justify-center gap-3">
                                <Phone className="w-5 h-5 text-indigo-600" />
                                <a
                                    href="tel:+254724454757"
                                    className="text-indigo-600 hover:text-indigo-800 font-semibold text-lg"
                                >
                                    +254 724 454 757
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Server Information */}
                    {serverInfo && (
                        <div className="bg-blue-50 rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Server className="w-5 h-5 text-blue-600" />
                                <h3 className="font-semibold text-gray-900">Server Information</h3>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-gray-600">Domain:</span>
                                    <span className="ml-2 font-mono font-semibold">{serverInfo.domain}</span>
                                </div>
                                {serverInfo.fingerprint && serverInfo.fingerprint !== 'Contact admin for fingerprint' && (
                                    <div>
                                        <span className="text-gray-600">Fingerprint:</span>
                                        <div className="mt-1 p-2 bg-white rounded font-mono text-xs break-all">
                                            {serverInfo.fingerprint}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-3">
                                Please provide this information when contacting support
                            </p>
                        </div>
                    )}

                    {/* Request License Button */}
                    {!showRequestForm && !submitted && (
                        <div className="text-center">
                            <Button
                                onClick={() => setShowRequestForm(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3"
                            >
                                <Key className="w-5 h-5 mr-2" />
                                Request License Online
                            </Button>
                            <p className="text-xs text-gray-500 mt-2">
                                Submit a license request and we'll get back to you
                            </p>
                        </div>
                    )}

                    {/* License Request Form */}
                    {showRequestForm && !submitted && (
                        <form onSubmit={handleSubmitRequest} className="space-y-4">
                            <div className="border-t pt-4">
                                <h3 className="font-semibold text-gray-900 mb-4">Request License</h3>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Company Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Contact Email *
                                        </label>
                                        <input
                                            type="email"
                                            value={contactEmail}
                                            onChange={(e) => setContactEmail(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Contact Phone *
                                        </label>
                                        <input
                                            type="tel"
                                            value={contactPhone}
                                            onChange={(e) => setContactPhone(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Purpose (Optional)
                                        </label>
                                        <textarea
                                            value={purpose}
                                            onChange={(e) => setPurpose(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            rows={3}
                                            placeholder="Tell us about your use case..."
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Request'}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setShowRequestForm(false)}
                                        variant="outline"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* Success Message */}
                    {submitted && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                <Key className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold text-green-900 mb-2">
                                Request Submitted Successfully!
                            </h3>
                            <p className="text-green-700 mb-4">
                                Your license request has been received. Our team will review it and contact you shortly.
                            </p>
                            <p className="text-sm text-green-600">
                                You will receive an email once your license is approved.
                            </p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                        <p className="text-xs text-gray-500">
                            © 2026 KK Dynamic Enterprise Solutions LTD. All rights reserved.
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            This software is protected by copyright and licensing agreements.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
