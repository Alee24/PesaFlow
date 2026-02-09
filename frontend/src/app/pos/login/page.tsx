'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, User, Lock, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface StaffMember {
    id: string;
    name: string;
    role: string;
}

export default function POSLoginPage() {
    const router = useRouter();
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
    const [pin, setPin] = useState('');
    const [verifying, setVerifying] = useState(false);

    // Initial load checks if the device is "Authorized" (Admin logged in)
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            // If no token, we can't fetch the staff list.
            // Redirect to main login to "Authorize" this device first.
            toast.error("Device not authorized. Please log in as Admin/Merchant first.");
            router.push('/auth/login?redirect=/pos/login');
            return;
        }
        fetchStaffList();
    }, []);

    const fetchStaffList = async () => {
        try {
            const res = await api.get('/pos/auth/staff');
            setStaffList(res.data);
        } catch (error) {
            console.error("Failed to fetch staff", error);
            toast.error("Failed to load staff list");
        } finally {
            setLoading(false);
        }
    };

    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStaff || pin.length < 4) return;

        setVerifying(true);
        try {
            // 1. Verify PIN
            const res = await api.post('/pos/auth/verify-pin', {
                teamMemberId: selectedStaff.id,
                pin
            });

            // 2. Store Team Member Token (Separate from Admin Token?)
            // Ideally, we replace the token.
            // BUT: If we replace it, we lose "Device Authorization".
            // BETTER: Store 'posToken' and use that for POS requests.
            // FOR NOW: Let's simply replace 'token' and 'user'.
            // The "Kiosk" session becomes the "Staff" session.
            // To "Switch User", they must logout, which might require Admin Re-Auth?
            // "Kiosk Mode" usually implies the device STAYS authorized.
            // Let's store 'deviceToken' (Admin) in a separate key if we want persisting auth,
            // but for simplicity MVP: Replace the token. Staff logs out -> Redirects to Login.

            // WAIT: If staff logs out, we want to go back to STAFF GRID, not Admin Login.
            // So we NEED to keep the Admin Token (Device Token).

            localStorage.setItem('posToken', res.data.token);
            localStorage.setItem('posUser', JSON.stringify(res.data.user));

            // We need the APP to use 'posToken' if it exists, else 'token'.
            // This requires modifying `api.ts`.
            // Let's update `api.ts` next to check `posToken` first.

            toast.success(`Welcome, ${res.data.user.name}`);
            router.push('/pos');

        } catch (error: any) {
            toast.error(error.response?.data?.error || "Login failed");
            setPin('');
        } finally {
            setVerifying(false);
        }
    };

    const handleNumberClick = (num: string) => {
        if (pin.length < 6) setPin(prev => prev + num);
    };

    if (loading) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center">

                {/* Left: Introduction */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">POS Access</h1>
                    <p className="text-gray-500 mb-8">Select your profile to start your shift.</p>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Secure Access</h3>
                                <p className="text-xs text-gray-500">Enter your 4-digit PIN</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">
                            This device is authorized. Transactions will be recorded under your selected profile.
                        </p>
                    </div>
                </div>

                {/* Right: Staff Grid or PIN Pad */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 min-h-[500px] flex flex-col">

                    {!selectedStaff ? (
                        <div className="p-6 flex-1 overflow-y-auto">
                            <h2 className="text-lg font-semibold mb-4">Who are you?</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {staffList.map(staff => (
                                    <button
                                        key={staff.id}
                                        onClick={() => setSelectedStaff(staff)}
                                        className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-gray-100 group-hover:bg-white flex items-center justify-center text-gray-400 group-hover:text-indigo-600 mb-3 transition-colors">
                                            <User className="w-8 h-8" />
                                        </div>
                                        <span className="font-medium text-gray-900 group-hover:text-indigo-700">{staff.name}</span>
                                        <span className="text-xs text-gray-500 uppercase mt-1">{staff.role.replace('_', ' ')}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 flex-1 flex flex-col">
                            <button
                                onClick={() => { setSelectedStaff(null); setPin(''); }}
                                className="text-sm text-gray-500 hover:text-gray-900 mb-6 flex items-center"
                            >
                                ← Back to list
                            </button>

                            <div className="text-center mb-8">
                                <h2 className="text-xl font-bold text-gray-900">{selectedStaff.name}</h2>
                                <p className="text-sm text-gray-500">Enter your PIN</p>
                            </div>

                            <div className="flex justify-center mb-8 gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className={`w-4 h-4 rounded-full ${i < pin.length ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                                ))}
                            </div>

                            <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto mb-6">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => handleNumberClick(num.toString())}
                                        className="w-16 h-16 rounded-full text-xl font-semibold text-gray-700 hover:bg-gray-100 bg-white border border-gray-200 transition-colors"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <div />
                                <button
                                    onClick={() => handleNumberClick('0')}
                                    className="w-16 h-16 rounded-full text-xl font-semibold text-gray-700 hover:bg-gray-100 bg-white border border-gray-200 transition-colors"
                                >
                                    0
                                </button>
                                <button
                                    onClick={() => setPin(prev => prev.slice(0, -1))}
                                    className="w-16 h-16 rounded-full flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                >
                                    ⌫
                                </button>
                            </div>

                            <Button
                                onClick={handlePinSubmit}
                                disabled={verifying || pin.length < 4}
                                className="w-full h-12 text-lg"
                            >
                                {verifying ? <Loader2 className="animate-spin" /> : 'Login'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
