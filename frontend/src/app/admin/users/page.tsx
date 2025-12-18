'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { Plus, Search, CheckCircle, XCircle, Ban, Power } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export default function UserManagementPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { showToast } = useToast();

    // Status Modal State
    const [statusModal, setStatusModal] = useState({
        isOpen: false,
        userId: '',
        targetStatus: '',
        loading: false
    });

    // Create Form State
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: 'MERCHANT'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (error) {
            console.error(error);
            showToast('Failed to load users', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/users', newUser);
            showToast('User created successfully', 'success');
            setShowCreateModal(false);
            fetchUsers();
            setNewUser({ name: '', email: '', phoneNumber: '', password: '', role: 'MERCHANT' });
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to create user', 'error');
        }
    };

    const initiateStatusToggle = (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        setStatusModal({
            isOpen: true,
            userId,
            targetStatus: newStatus,
            loading: false
        });
    };

    const confirmStatusChange = async () => {
        if (!statusModal.userId) return;
        setStatusModal(prev => ({ ...prev, loading: true }));
        try {
            await api.patch(`/admin/users/${statusModal.userId}/status`, { status: statusModal.targetStatus });
            showToast(`User ${statusModal.targetStatus.toLowerCase()} successfully`, 'success');
            fetchUsers();
            setStatusModal(prev => ({ ...prev, isOpen: false }));
        } catch (error: any) {
            showToast('Failed to update status', 'error');
        } finally {
            setStatusModal(prev => ({ ...prev, loading: false }));
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto pb-12">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                        <p className="text-gray-500 text-sm">Create, monitor, and manage user accounts.</p>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add User
                    </Button>
                </div>

                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                                <tr>
                                    <th className="p-4 text-xs uppercase text-gray-500 font-semibold">User</th>
                                    <th className="p-4 text-xs uppercase text-gray-500 font-semibold">Contact</th>
                                    <th className="p-4 text-xs uppercase text-gray-500 font-semibold">Role</th>
                                    <th className="p-4 text-xs uppercase text-gray-500 font-semibold">Stats</th>
                                    <th className="p-4 text-xs uppercase text-gray-500 font-semibold text-center">Status</th>
                                    <th className="p-4 text-xs uppercase text-gray-500 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loading ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading users...</td></tr>
                                ) : users.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">No users found</td></tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                                                <div className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-gray-600 dark:text-gray-300">{user.email}</div>
                                                <div className="text-xs text-gray-500">{user.phoneNumber}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs text-gray-500">
                                                <div>Sales: {user._count?.sales || 0}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                        user.status === 'PENDING_VERIFICATION' ? 'bg-yellow-100 text-yellow-700' :
                                                            user.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                                'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {user.role !== 'ADMIN' && (
                                                    <Button
                                                        size="sm"
                                                        variant={user.status === 'ACTIVE' ? 'outline' : 'primary'}
                                                        className={user.status === 'ACTIVE' ? 'text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50' : ''}
                                                        onClick={() => initiateStatusToggle(user.id, user.status)}
                                                    >
                                                        {user.status === 'ACTIVE' ? (
                                                            <><Ban className="w-3 h-3 mr-1" /> Suspend</>
                                                        ) : (
                                                            <><CheckCircle className="w-3 h-3 mr-1" /> Activate</>
                                                        )}
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Create User Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <Card className="w-full max-w-md animate-in zoom-in-95">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Add New User</h2>
                                <button onClick={() => setShowCreateModal(false)}><XCircle className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
                            </div>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <Input label="Full Name" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} required />
                                <Input label="Email Address" type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                                <Input label="Phone Number" value={newUser.phoneNumber} onChange={e => setNewUser({ ...newUser, phoneNumber: e.target.value })} required placeholder="07..." />
                                <Input label="Password" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select
                                        className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                        value={newUser.role}
                                        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                    >
                                        <option value="MERCHANT">Merchant</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                                    <Button type="submit">Create Account</Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}
                <ConfirmModal
                    isOpen={statusModal.isOpen}
                    onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
                    onConfirm={confirmStatusChange}
                    title={statusModal.targetStatus === 'SUSPENDED' ? 'Suspend User' : 'Activate User'}
                    description={statusModal.targetStatus === 'SUSPENDED'
                        ? 'Are you sure you want to SUSPEND this user? They will not be able to log in or process transactions.'
                        : 'Are you sure you want to ACTIVATE this user? They will regain access to their account.'}
                    variant={statusModal.targetStatus === 'SUSPENDED' ? 'danger' : 'success'}
                    loading={statusModal.loading}
                    confirmText={statusModal.targetStatus === 'SUSPENDED' ? 'Suspend' : 'Activate'}
                />
            </div>
        </DashboardLayout>
    );
}
