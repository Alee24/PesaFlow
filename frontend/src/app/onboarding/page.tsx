'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import Toast from '@/components/ui/Toast';
import api from '@/lib/api';
import { Building2, FileUp, CheckCircle2, ShieldCheck, LogOut } from 'lucide-react';

export default function OnboardingPage() {
    const router = useRouter();

    // Manual logout since AuthContext is not available
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
    };

    const [step, setStep] = useState(1); // 1: Business Info, 2: Documents
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success' | 'error' | 'info' });
    const [formData, setFormData] = useState({
        companyName: '',
        location: '',
        idNumber: '',
        kraPinNumber: '',
        dataPolicyAccepted: false,
        email: '',
        contactPhone: ''
    });
    const [files, setFiles] = useState<any>({
        idFront: null,
        idBack: null,
        businessPermit: null,
        registrationCert: null,
        kraCert: null,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        if (e.target.files) {
            setFiles({ ...files, [field]: e.target.files[0] });
        }
    };

    const nextStep = () => {
        if (step === 1) {
            if (!formData.companyName || !formData.idNumber || !formData.location) {
                setError('Please fill in all business details');
                return;
            }
            // Optional KRA PIN Format Check
            if (formData.kraPinNumber) {
                const kraRegex = /^[A-Z][0-9]{9}[A-Z]$/i;
                if (!kraRegex.test(formData.kraPinNumber)) {
                    setError('Invalid KRA PIN format. Example: P051234567Z');
                    return;
                }
            }
        }
        setError('');
        setStep(step + 1);
    };

    const prevStep = () => {
        setStep(step - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.dataPolicyAccepted) {
            setError('You must accept the Data Protection Policy');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => data.append(key, (formData as any)[key]));
            Object.keys(files).forEach(key => {
                if (files[key]) data.append(key, files[key]);
            });

            await api.post('/auth/complete-profile', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Update local storage to prevent redirect loop
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...currentUser, isProfileComplete: true }));

            // Redirect to dashboard
            window.location.href = '/dashboard';
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to submit profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        localStorage.setItem('onboarding_skipped', 'true');
        // Update local user object's isProfileComplete status to avoid immediate dashboard redirects
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...currentUser, isProfileComplete: true }));
        window.location.href = '/dashboard';
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 py-12">
            <Toast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, visible: false })} />
            <div className="w-full max-w-xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
                        Complete Setup
                    </h1>
                    <p className="text-gray-500 mt-2">Finish your business profile to verify your account</p>
                </div>

                <Card className="shadow-2xl border-none">
                    <form onSubmit={handleSubmit} className="p-2">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm mb-6 flex items-center gap-2 border border-red-100 dark:border-red-900/50">
                                <span className="font-bold">Error:</span> {error}
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-4 animate-in slide-in-from-right duration-500">
                                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                                    <Building2 className="w-5 h-5" />
                                    <h3 className="font-semibold">Business Identity</h3>
                                </div>

                                <Input
                                    label="KRA PIN Number (Optional)"
                                    value={formData.kraPinNumber}
                                    onChange={(e) => setFormData({ ...formData, kraPinNumber: e.target.value })}
                                    placeholder="A012345678Z"
                                />

                                <Input
                                    label="Registered Business Name"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    required
                                    placeholder="Safiri Solutions Ltd"
                                />
                                <Input
                                    label="Physical Location / Address"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    required
                                    placeholder="Nairobi, CBD - Bihi Towers 4th Floor"
                                />
                                <Input
                                    label="ID/Passport Number"
                                    value={formData.idNumber}
                                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                                    required
                                    placeholder="12345678"
                                />

                                <Button type="button" onClick={nextStep} className="w-full mt-4">
                                    Next: Upload Documents
                                </Button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4 animate-in slide-in-from-right duration-500">
                                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                                    <FileUp className="w-5 h-5" />
                                    <h3 className="font-semibold">KYC Document Uploads</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors">
                                        <label className="cursor-pointer block">
                                            <span className="text-xs font-semibold text-gray-500 uppercase block mb-2">ID Front Side</span>
                                            <input type="file" onChange={(e) => handleFileChange(e, 'idFront')} className="hidden" accept="image/*" />
                                            {files.idFront ? <div className="text-sm text-green-600 font-medium flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4" /> {files.idFront.name}</div> : <div className="text-sm text-gray-400">Click to upload ID Front</div>}
                                        </label>
                                    </div>
                                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors">
                                        <label className="cursor-pointer block">
                                            <span className="text-xs font-semibold text-gray-500 uppercase block mb-2">Registration Certificate</span>
                                            <input type="file" onChange={(e) => handleFileChange(e, 'registrationCert')} className="hidden" accept="image/*,application/pdf" />
                                            {files.registrationCert ? <div className="text-sm text-green-600 font-medium flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4" /> {files.registrationCert.name}</div> : <div className="text-sm text-gray-400">Click to upload Business Cert</div>}
                                        </label>
                                    </div>
                                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors">
                                        <label className="cursor-pointer block">
                                            <span className="text-xs font-semibold text-gray-500 uppercase block mb-2">KRA PIN Certificate</span>
                                            <input type="file" onChange={(e) => handleFileChange(e, 'kraCert')} className="hidden" accept="image/*,application/pdf" />
                                            {files.kraCert ? <div className="text-sm text-green-600 font-medium flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4" /> {files.kraCert.name}</div> : <div className="text-sm text-gray-400">Click to upload PIN Cert</div>}
                                        </label>
                                    </div>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mt-6">
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            id="dataConsent"
                                            checked={formData.dataPolicyAccepted}
                                            onChange={(e) => setFormData({ ...formData, dataPolicyAccepted: e.target.checked })}
                                            className="mt-1 w-4 h-4 text-indigo-600 rounded"
                                        />
                                        <label htmlFor="dataConsent" className="text-xs text-blue-800 dark:text-blue-300">
                                            I hereby consent to Mpesa Connect collecting and processing my data for verification in accordance with the <b>Kenya Data Protection Act (2019)</b>.
                                        </label>
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-6">
                                    <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                                        Back
                                    </Button>
                                    <Button type="submit" className="flex-1" isLoading={loading}>
                                        <ShieldCheck className="w-4 h-4 mr-2" /> Submit Profile
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 text-center">
                            <button type="button" onClick={handleSkip} className="text-sm text-gray-500 hover:text-indigo-600 flex items-center justify-center gap-1 mx-auto transition-colors">
                                [→ Skip Setup]
                            </button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
