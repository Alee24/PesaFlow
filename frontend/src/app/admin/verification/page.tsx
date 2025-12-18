'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { CheckCircle, XCircle, Eye, FileText, Download } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { Modal } from '@/components/ui/Modal';

interface PendingUser {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    status: string;
    createdAt: string;
    businessProfile?: {
        companyName: string;
        idNumber: string;
        kraPinNumber: string;
        location: string;
        idFrontUrl?: string;
        idBackUrl?: string;
        businessPermitUrl?: string;
        registrationCertUrl?: string;
        kraCertUrl?: string;
        dataPolicyAccepted: boolean;
        verificationNotes?: string;
    };
}

export default function VerificationPage() {
    const [users, setUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            const pending = res.data.filter((u: PendingUser) => u.status === 'PENDING_VERIFICATION');
            setUsers(pending);
        } catch (error) {
            console.error(error);
            showToast('Failed to load pending users', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (user: PendingUser, action: 'approve' | 'reject') => {
        setSelectedUser(user);
        setActionType(action);
        setNotes('');
        setShowModal(true);
    };

    const confirmAction = async () => {
        if (!selectedUser) return;

        setProcessing(true);
        try {
            const newStatus = actionType === 'approve' ? 'ACTIVE' : 'REJECTED';
            await api.patch(`/admin/users/${selectedUser.id}/status`, {
                status: newStatus,
                notes: actionType === 'reject' ? notes : null
            });

            showToast(
                `User ${actionType === 'approve' ? 'activated' : 'rejected'} successfully`,
                'success'
            );

            setShowModal(false);
            fetchPendingUsers();
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to update user status', 'error');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto pb-12">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Merchant Verification</h1>
                    <p className="text-gray-500 text-sm">Review and approve merchant registration applications.</p>
                </div>

                {loading ? (
                    <Card className="p-8 text-center">
                        <p className="text-gray-500">Loading pending applications...</p>
                    </Card>
                ) : users.length === 0 ? (
                    <Card className="p-8 text-center">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <p className="text-gray-500">No pending applications to review.</p>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {users.map((user) => (
                            <Card key={user.id} className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                            {user.businessProfile?.companyName || user.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">{user.email} • {user.phoneNumber}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Applied: {new Date(user.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
                                        PENDING
                                    </span>
                                </div>

                                {user.businessProfile && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold">ID Number</p>
                                            <p className="text-sm text-gray-900 dark:text-white">{user.businessProfile.idNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold">KRA PIN</p>
                                            <p className="text-sm text-gray-900 dark:text-white">{user.businessProfile.kraPinNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold">Location</p>
                                            <p className="text-sm text-gray-900 dark:text-white">{user.businessProfile.location}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold">Data Policy</p>
                                            <p className="text-sm text-gray-900 dark:text-white">
                                                {user.businessProfile.dataPolicyAccepted ? '✓ Accepted' : '✗ Not Accepted'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* KYC Documents */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">KYC Documents</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        {user.businessProfile?.idFrontUrl && (
                                            <a
                                                href={user.businessProfile.idFrontUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <FileText className="w-8 h-8 text-indigo-600" />
                                                <span className="text-xs text-center font-medium">ID Front</span>
                                            </a>
                                        )}
                                        {user.businessProfile?.idBackUrl && (
                                            <a
                                                href={user.businessProfile.idBackUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <FileText className="w-8 h-8 text-indigo-600" />
                                                <span className="text-xs text-center font-medium">ID Back</span>
                                            </a>
                                        )}
                                        {user.businessProfile?.businessPermitUrl && (
                                            <a
                                                href={user.businessProfile.businessPermitUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <FileText className="w-8 h-8 text-indigo-600" />
                                                <span className="text-xs text-center font-medium">Business Permit</span>
                                            </a>
                                        )}
                                        {user.businessProfile?.registrationCertUrl && (
                                            <a
                                                href={user.businessProfile.registrationCertUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <FileText className="w-8 h-8 text-indigo-600" />
                                                <span className="text-xs text-center font-medium">Registration Cert</span>
                                            </a>
                                        )}
                                        {user.businessProfile?.kraCertUrl && (
                                            <a
                                                href={user.businessProfile.kraCertUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <FileText className="w-8 h-8 text-indigo-600" />
                                                <span className="text-xs text-center font-medium">KRA Certificate</span>
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 justify-end">
                                    <Button
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => handleAction(user, 'reject')}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                    </Button>
                                    <Button
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => handleAction(user, 'approve')}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approve & Activate
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {showModal && selectedUser && (
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title={actionType === 'approve' ? 'Approve Merchant' : 'Reject Application'}
                >
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {actionType === 'approve'
                                ? `Are you sure you want to activate ${selectedUser.businessProfile?.companyName || selectedUser.name}? They will gain full access to all platform features.`
                                : `Are you sure you want to reject ${selectedUser.businessProfile?.companyName || selectedUser.name}'s application?`
                            }
                        </p>

                        {actionType === 'reject' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Reason for Rejection (Required)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
                                    rows={4}
                                    placeholder="Please provide a clear reason for rejection..."
                                    required
                                />
                            </div>
                        )}

                        <div className="flex gap-3 justify-end pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowModal(false)}
                                disabled={processing}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant={actionType === 'approve' ? 'primary' : 'danger'}
                                onClick={confirmAction}
                                isLoading={processing}
                                disabled={actionType === 'reject' && !notes.trim()}
                            >
                                {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </DashboardLayout>
    );
}
