
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';
import { normalizePhoneNumber } from '@/lib/phoneUtils';

import { ShieldCheck, User, Building2, FileUp, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<any>({
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        companyName: '',
        location: '',
        idNumber: '',
        kraPinNumber: '',
        dataPolicyAccepted: false,
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
            if (!formData.email || !formData.phoneNumber || !formData.password) {
                setError('Please fill in all fields');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return;
            }
        }
        if (step === 2) {
            if (!formData.companyName || !formData.idNumber || !formData.kraPinNumber || !formData.location) {
                setError('Please fill in all business details');
                return;
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
            // Normalize phone number before sending
            const normalizedData = {
                ...formData,
                phoneNumber: normalizePhoneNumber(formData.phoneNumber)
            };
            Object.keys(normalizedData).forEach(key => data.append(key, normalizedData[key]));
            Object.keys(files).forEach(key => {
                if (files[key]) data.append(key, files[key]);
            });

            const res = await api.post('/auth/register', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Even if pending verification, we might give them a token but restrictive access
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            // Redirect to a specific "Pending Verification" landing or dashboard
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to submit registration');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4 animate-in fade-in duration-500">
                        <div className="flex items-center gap-2 text-indigo-600 mb-2">
                            <User className="w-5 h-5" />
                            <h3 className="font-semibold">Account Details</h3>
                        </div>
                        <Input
                            label="Email Address"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            placeholder="you@example.com"
                        />
                        <Input
                            label="Phone Number (M-Pesa Registered)"
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            required
                            placeholder="07123456789 or 7123456789"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                placeholder="••••••••"
                            />
                            <Input
                                label="Confirm Password"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                                placeholder="••••••••"
                            />
                        </div>
                        <Button type="button" onClick={nextStep} className="w-full mt-4">
                            Next: Business Info
                        </Button>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4 animate-in slide-in-from-right duration-500">
                        <div className="flex items-center gap-2 text-indigo-600 mb-2">
                            <Building2 className="w-5 h-5" />
                            <h3 className="font-semibold">Business Identity</h3>
                        </div>
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
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="ID/Passport Number"
                                value={formData.idNumber}
                                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                                required
                                placeholder="12345678"
                            />
                            <Input
                                label="KRA PIN Number"
                                value={formData.kraPinNumber}
                                onChange={(e) => setFormData({ ...formData, kraPinNumber: e.target.value })}
                                required
                                placeholder="A012345678Z"
                            />
                        </div>
                        <div className="flex gap-4 mt-6">
                            <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                                Back
                            </Button>
                            <Button type="button" onClick={nextStep} className="flex-1">
                                Next: Documents
                            </Button>
                        </div>
                    </div>
                );
            case 3:
                return (
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
                                    I hereby consent to PesaFlow collecting and processing my data for verification in accordance with the <b>Kenya Data Protection Act (2019)</b>. I verify that all documents provided are authentic.
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-6">
                            <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                                Back
                            </Button>
                            <Button type="submit" className="flex-1" isLoading={loading}>
                                <ShieldCheck className="w-4 h-4 mr-2" /> Complete Sign Up
                            </Button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 py-12">
            <div className="w-full max-w-xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
                        PesaFlow
                    </h1>
                    <p className="text-gray-500 mt-2">Professional Merchant Onboarding</p>

                    <div className="flex items-center justify-center gap-2 mt-6">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`h-1.5 w-12 rounded-full transition-all duration-300 ${s <= step ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                            />
                        ))}
                    </div>
                </div>

                <Card className="shadow-2xl border-none">
                    <form onSubmit={handleSubmit} className="p-2">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm mb-6 flex items-center gap-2 border border-red-100 dark:border-red-900/50">
                                <span className="font-bold">Error:</span> {error}
                            </div>
                        )}

                        {renderStep()}

                        <div className="text-center text-sm text-gray-500 mt-8">
                            Already have a verified account?{' '}
                            <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-500 font-bold">
                                Sign In
                            </Link>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}

