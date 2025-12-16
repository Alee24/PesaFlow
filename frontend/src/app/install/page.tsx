
'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import axios from 'axios';

// Create a local axios instance to avoid the interceptors from lib/api.ts which might expect a token
const api = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: { 'Content-Type': 'application/json' }
});

export default function InstallPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const [formData, setFormData] = useState({
        // Database
        dbHost: 'localhost',
        dbPort: '3306',
        dbUser: 'root',
        dbPassword: '',
        dbName: 'mpesa_saas',

        // M-Pesa
        mpesaKey: '',
        mpesaSecret: '',
        mpesaPasskey: '',
        mpesaShortcode: '',
        mpesaEnv: 'sandbox',

        // SMTP
        smtpHost: '',
        smtpPort: '587',
        // ... existing fields
        smtpUser: '',
        smtpPassword: '',
        smtpSecure: 'false',

        // Admin
        adminEmail: '',
        adminPassword: '',
        adminPasswordConfirm: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (formData.adminPassword !== formData.adminPasswordConfirm) {
            setStatus('error');
            setMessage('Passwords do not match');
            return;
        }

        setLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const res = await api.post('/setup', formData);
            setStatus('success');
            setMessage(res.data.message);
        } catch (error: any) {
            setStatus('error');
            setMessage(error.response?.data?.error || 'Installation failed. Please check your inputs.');
            if (error.response?.data?.details) {
                setMessage(prev => prev + ' Details: ' + error.response.data.details);
            }
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    if (status === 'success') {
        const isWarning = message.includes('However') || message.includes('failed to create admin');

        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
                <Card className="max-w-xl w-full text-center p-12">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isWarning ? 'bg-yellow-100' : 'bg-green-100'}`}>
                        {isWarning ? (
                            <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        ) : (
                            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{isWarning ? 'Setup Complete (With Warnings)' : 'Installation Successful!'}</h1>
                    <p className="text-gray-600 mb-8">{message}</p>

                    {isWarning && (
                        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm mb-8 text-left border border-yellow-200">
                            <strong>Manual Action Required:</strong><br />
                            1. Check <code>backend/database_schema.sql</code>.<br />
                            2. Import it into your MySQL database manually.<br />
                            3. Restart the backend server.
                        </div>
                    )}

                    <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm mb-8">
                        <strong>Important:</strong> Please restart the backend server now for changes to take effect.
                    </div>
                    <Button onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">PesaFlow Installer</h1>
                    <p className="text-gray-500">Setup your M-Pesa SaaS Platform in 4 easy steps</p>
                </div>

                {/* Progress Bar */}
                <div className="flex justify-between mb-8 max-w-sm mx-auto">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`w-3 h-3 rounded-full ${step >= i ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                    ))}
                </div>

                <Card>
                    {status === 'error' && (
                        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg text-sm">
                            {message}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-semibold mb-4">1. Database Configuration</h2>
                                <p className="text-sm text-gray-500 mb-4">Connect to your MySQL database.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Host" name="dbHost" value={formData.dbHost} onChange={handleChange} placeholder="localhost or IP" />
                                <Input label="Port" name="dbPort" value={formData.dbPort} onChange={handleChange} placeholder="3306" />
                            </div>
                            <Input label="Database Name" name="dbName" value={formData.dbName} onChange={handleChange} placeholder="mpesa_saas" />
                            <Input label="Username" name="dbUser" value={formData.dbUser} onChange={handleChange} placeholder="root" />
                            <Input label="Password" name="dbPassword" type="password" value={formData.dbPassword} onChange={handleChange} placeholder="Database Password" />

                            <div className="flex justify-end pt-4">
                                <Button onClick={nextStep}>Next: M-Pesa Details</Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-semibold mb-4">2. M-Pesa Configuration</h2>
                                <p className="text-sm text-gray-500 mb-4">Enter your Daraja API credentials.</p>
                            </div>

                            <Input label="Consumer Key" name="mpesaKey" value={formData.mpesaKey} onChange={handleChange} />
                            <Input label="Consumer Secret" name="mpesaSecret" value={formData.mpesaSecret} onChange={handleChange} />
                            <Input label="Passkey" name="mpesaPasskey" type="password" value={formData.mpesaPasskey} onChange={handleChange} />

                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Shortcode" name="mpesaShortcode" value={formData.mpesaShortcode} onChange={handleChange} placeholder="e.g. 174379" />
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Environment</label>
                                    <select
                                        name="mpesaEnv"
                                        value={formData.mpesaEnv}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    >
                                        <option value="sandbox">Sandbox (Testing)</option>
                                        <option value="production">Production (Live)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button variant="secondary" onClick={prevStep}>Back</Button>
                                <Button onClick={nextStep}>Next: Email Setup</Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-semibold mb-4">3. Email & SMTP</h2>
                                <p className="text-sm text-gray-500 mb-4">For sending notifications (Optional, but recommended).</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input label="SMTP Host" name="smtpHost" value={formData.smtpHost} onChange={handleChange} placeholder="smtp.gmail.com" />
                                <Input label="SMTP Port" name="smtpPort" value={formData.smtpPort} onChange={handleChange} placeholder="587" />
                            </div>
                            <Input label="SMTP Username" name="smtpUser" value={formData.smtpUser} onChange={handleChange} placeholder="user@gmail.com" />
                            <Input label="SMTP Password" name="smtpPassword" type="password" value={formData.smtpPassword} onChange={handleChange} />

                            <div className="flex justify-between pt-4">
                                <Button variant="secondary" onClick={prevStep}>Back</Button>
                                <Button onClick={nextStep}>Next: Admin Account</Button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-semibold mb-4">4. Super Admin Setup</h2>
                                <p className="text-sm text-gray-500 mb-4">Create your primary administrator account.</p>
                            </div>

                            <Input label="Admin Email" name="adminEmail" type="email" value={formData.adminEmail} onChange={handleChange} required />
                            <Input label="Admin Password" name="adminPassword" type="password" value={formData.adminPassword} onChange={handleChange} required />
                            <Input label="Confirm Password" name="adminPasswordConfirm" type="password" value={formData.adminPasswordConfirm} onChange={handleChange} required />

                            <div className="flex justify-between pt-4">
                                <Button variant="secondary" onClick={prevStep}>Back</Button>
                                <Button onClick={handleSubmit} isLoading={loading}>Complete Installation</Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
