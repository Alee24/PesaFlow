'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Step 1: Profile
    const [profileData, setProfileData] = useState({
        companyName: '',
        contactPhone: '',
        location: '',
        website: '',
        kraPinNumber: '',
    });
    
    // Step 2: M-Pesa
    const [mpesaData, setMpesaData] = useState({
        mpesaConsumerKey: '',
        mpesaConsumerSecret: '',
        mpesaShortcode: '',
        mpesaPasskey: '',
        mpesaEnv: 'sandbox',
        useCustomMpesa: false
    });
    
    const [logo, setLogo] = useState<File | null>(null);
    const [mpesaTestStatus, setMpesaTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleMpesaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setMpesaData({ ...mpesaData, [name]: (e.target as HTMLInputElement).checked });
        } else {
            setMpesaData({ ...mpesaData, [name]: value });
        }
    };

    const submitProfile = async () => {
        if (!profileData.companyName) {
            toast.error('Company Name is required');
            return;
        }
        
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('companyName', profileData.companyName);
            formData.append('contactPhone', profileData.contactPhone);
            formData.append('location', profileData.location);
            formData.append('website', profileData.website);
            formData.append('kraPinNumber', profileData.kraPinNumber);
            
            if (logo) {
                formData.append('logo', logo);
            }
            
            await api.put('/profile', formData);
            toast.success('Business profile saved');
            setStep(2);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to save profile');
        } finally {
            setLoading(false);
        }
    };

    const testMpesa = async () => {
        try {
            setMpesaTestStatus('idle');
            const res = await api.post('/mpesa/test', {
                consumerKey: mpesaData.mpesaConsumerKey,
                consumerSecret: mpesaData.mpesaConsumerSecret,
                env: mpesaData.mpesaEnv
            });
            setMpesaTestStatus('success');
            toast.success('M-Pesa Test Successful!');
        } catch (error: any) {
            setMpesaTestStatus('error');
            toast.error(error.response?.data?.message || 'M-Pesa Test Failed');
        }
    };

    const finishOnboarding = async (skipMpesa = false) => {
        try {
            setLoading(true);
            
            const formData = new FormData();
            if (!skipMpesa && mpesaData.useCustomMpesa) {
                formData.append('mpesaConsumerKey', mpesaData.mpesaConsumerKey);
                formData.append('mpesaConsumerSecret', mpesaData.mpesaConsumerSecret);
                formData.append('mpesaShortcode', mpesaData.mpesaShortcode);
                formData.append('mpesaPasskey', mpesaData.mpesaPasskey);
                formData.append('mpesaEnv', mpesaData.mpesaEnv);
                formData.append('useCustomMpesa', 'true');
            } else if (skipMpesa) {
                formData.append('useCustomMpesa', 'false');
            }
            
            formData.append('onboardingCompleted', 'true');
            formData.append('companyName', profileData.companyName); // Required by schema
            
            await api.put('/profile', formData);
            
            toast.success('Onboarding complete!');
            router.push('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to complete onboarding');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Welcome to PesaFlow!
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {step === 1 ? 'Let\'s set up your business profile.' : 'Set up M-Pesa Integration (Optional)'}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {step === 1 && (
                        <div className="space-y-6">
                            <Input
                                label="Company Name *"
                                name="companyName"
                                value={profileData.companyName}
                                onChange={handleProfileChange}
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Logo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => e.target.files && setLogo(e.target.files[0])}
                                    className="mt-1 block w-full text-sm text-gray-500"
                                />
                            </div>
                            <Input
                                label="Contact Phone"
                                name="contactPhone"
                                value={profileData.contactPhone}
                                onChange={handleProfileChange}
                            />
                            <Input
                                label="Location"
                                name="location"
                                value={profileData.location}
                                onChange={handleProfileChange}
                            />
                            <Button className="w-full" onClick={submitProfile} isLoading={loading}>
                                Continue
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center mb-4">
                                <input
                                    type="checkbox"
                                    id="useCustomMpesa"
                                    name="useCustomMpesa"
                                    checked={mpesaData.useCustomMpesa}
                                    onChange={handleMpesaChange}
                                    className="h-4 w-4 text-green-600 border-gray-300 rounded"
                                />
                                <label htmlFor="useCustomMpesa" className="ml-2 block text-sm text-gray-900">
                                    Enable Custom M-Pesa Configuration
                                </label>
                            </div>

                            {mpesaData.useCustomMpesa && (
                                <>
                                    <Input
                                        label="Consumer Key"
                                        name="mpesaConsumerKey"
                                        value={mpesaData.mpesaConsumerKey}
                                        onChange={handleMpesaChange}
                                    />
                                    <Input
                                        label="Consumer Secret"
                                        name="mpesaConsumerSecret"
                                        type="password"
                                        value={mpesaData.mpesaConsumerSecret}
                                        onChange={handleMpesaChange}
                                    />
                                    <Input
                                        label="Shortcode"
                                        name="mpesaShortcode"
                                        value={mpesaData.mpesaShortcode}
                                        onChange={handleMpesaChange}
                                    />
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                                        <select
                                            name="mpesaEnv"
                                            value={mpesaData.mpesaEnv}
                                            onChange={handleMpesaChange}
                                            className="w-full border border-gray-300 rounded-md p-2"
                                        >
                                            <option value="sandbox">Sandbox</option>
                                            <option value="production">Production</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" className="flex-1" onClick={testMpesa}>
                                            Test Connection
                                        </Button>
                                    </div>
                                    {mpesaTestStatus === 'success' && <p className="text-green-600 text-sm mt-1">Connection verified!</p>}
                                    {mpesaTestStatus === 'error' && <p className="text-red-600 text-sm mt-1">Connection failed.</p>}
                                </>
                            )}
                            
                            <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
                                <Button className="w-full" onClick={() => finishOnboarding(false)} isLoading={loading}>
                                    Complete Setup
                                </Button>
                                <Button variant="outline" className="w-full text-gray-500" onClick={() => finishOnboarding(true)} disabled={loading}>
                                    Skip M-Pesa Setup
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
