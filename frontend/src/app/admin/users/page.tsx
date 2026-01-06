'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { Plus, Search, CheckCircle, XCircle, Ban, Power, ShieldCheck } from 'lucide-react';
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

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        userId: '',
        loading: false
    });

    // Edit Modal State
    const [editModal, setEditModal] = useState({
        isOpen: false,
        userId: '',
        loading: false,
        data: { name: '', email: '', phoneNumber: '', role: 'MERCHANT' }
    });

    // Password Reset Modal State
    const [passwordModal, setPasswordModal] = useState({
        isOpen: false,
        userId: '',
        userName: '',
        loading: false,
        newPassword: ''
    });

    // Subscription Modal State
    const [subModal, setSubModal] = useState({
        isOpen: false,
        userId: '',
        userName: '',
        loading: false,
        plan: 'NONE',
        extendDays: 30,
        action: 'SET_PLAN' // SET_PLAN | EXTEND
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

    const handleEditClick = (user: any) => {
        setEditModal({
            isOpen: true,
            userId: user.id,
            loading: false,
            data: {
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role
            }
        });
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditModal(prev => ({ ...prev, loading: true }));
        try {
            await api.put(`/admin/users/${editModal.userId}`, editModal.data);
            showToast('User updated successfully', 'success');
            fetchUsers();
            setEditModal(prev => ({ ...prev, isOpen: false }));
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to update user', 'error');
        } finally {
            setEditModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleDeleteClick = (userId: string) => {
        setDeleteModal({ isOpen: true, userId, loading: false });
    };

    const confirmDelete = async () => {
        if (!deleteModal.userId) return;
        setDeleteModal(prev => ({ ...prev, loading: true }));
        try {
            await api.delete(`/admin/users/${deleteModal.userId}`);
            showToast('User deleted successfully', 'success');
            fetchUsers();
            setDeleteModal(prev => ({ ...prev, isOpen: false }));
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to delete user', 'error');
        } finally {
            setDeleteModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handlePasswordClick = (user: any) => {
        setPasswordModal({
            isOpen: true,
            userId: user.id,
            userName: user.name,
            loading: false,
            newPassword: ''
        });
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordModal(prev => ({ ...prev, loading: true }));
        try {
            await api.patch(`/admin/users/${passwordModal.userId}/password`, { password: passwordModal.newPassword });
            showToast('Password reset successfully', 'success');
            setPasswordModal(prev => ({ ...prev, isOpen: false }));
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to reset password', 'error');
        } finally {
            setPasswordModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleSubClick = (user: any) => {
        // Assume user object might have subscription info eager loaded later, 
        // for now just open modal to set/overwrite
        setSubModal({
            isOpen: true,
            userId: user.id,
            userName: user.name,
            loading: false,
            plan: 'NONE', // Default or fetch current if available
            extendDays: 30,
            action: 'SET_PLAN'
        });
    };

    const handleSubSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubModal(prev => ({ ...prev, loading: true }));
        try {
            await api.post(`/admin/users/${subModal.userId}/subscription`, {
                action: subModal.action,
                plan: subModal.plan,
                extendDays: subModal.extendDays
            });
            showToast('Subscription updated successfully', 'success');
            setSubModal(prev => ({ ...prev, isOpen: false }));
            fetchUsers();
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to update subscription', 'error');
        } finally {
            setSubModal(prev => ({ ...prev, loading: false }));
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
                                                <div className="flex justify-end gap-2">
                                                    {user.role !== 'ADMIN' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                title="Edit User"
                                                                onClick={() => handleEditClick(user)}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                title="Reset Password"
                                                                onClick={() => handlePasswordClick(user)}
                                                            >
                                                                <Power className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                title="Manage Subscription"
                                                                onClick={() => handleSubClick(user)}
                                                            >
                                                                <ShieldCheck className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant={user.status === 'ACTIVE' ? 'outline' : 'primary'}
                                                                className={user.status === 'ACTIVE' ? 'text-yellow-600 border-yellow-200 hover:bg-yellow-50' : ''}
                                                                title={user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                                                                onClick={() => initiateStatusToggle(user.id, user.status)}
                                                            >
                                                                {user.status === 'ACTIVE' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="danger"
                                                                title="Delete User"
                                                                onClick={() => handleDeleteClick(user.id)}
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
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

                {/* Edit User Modal */}
                {editModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <Card className="w-full max-w-md animate-in zoom-in-95">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Edit User</h2>
                                <button onClick={() => setEditModal(prev => ({ ...prev, isOpen: false }))}>
                                    <XCircle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                </button>
                            </div>
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <Input
                                    label="Full Name"
                                    value={editModal.data.name}
                                    onChange={e => setEditModal(prev => ({ ...prev, data: { ...prev.data, name: e.target.value } }))}
                                    required
                                />
                                <Input
                                    label="Email Address"
                                    type="email"
                                    value={editModal.data.email}
                                    onChange={e => setEditModal(prev => ({ ...prev, data: { ...prev.data, email: e.target.value } }))}
                                    required
                                />
                                <Input
                                    label="Phone Number"
                                    value={editModal.data.phoneNumber}
                                    onChange={e => setEditModal(prev => ({ ...prev, data: { ...prev.data, phoneNumber: e.target.value } }))}
                                    required
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select
                                        className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                        value={editModal.data.role}
                                        onChange={e => setEditModal(prev => ({ ...prev, data: { ...prev.data, role: e.target.value } }))}
                                    >
                                        <option value="MERCHANT">Merchant</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <Button type="button" variant="outline" onClick={() => setEditModal(prev => ({ ...prev, isOpen: false }))}>Cancel</Button>
                                    <Button type="submit" isLoading={editModal.loading}>Save Changes</Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}

                {/* Password Reset Modal */}
                {passwordModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <Card className="w-full max-w-md animate-in zoom-in-95">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Reset Password</h2>
                                <button onClick={() => setPasswordModal(prev => ({ ...prev, isOpen: false }))}>
                                    <XCircle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                                Enter a new password for <span className="font-bold">{passwordModal.userName}</span>.
                            </p>
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <Input
                                    label="New Password"
                                    type="password"
                                    value={passwordModal.newPassword}
                                    onChange={e => setPasswordModal(prev => ({ ...prev, newPassword: e.target.value }))}
                                    required
                                    placeholder="Min. 6 characters"
                                />
                                <div className="pt-4 flex justify-end gap-3">
                                    <Button type="button" variant="outline" onClick={() => setPasswordModal(prev => ({ ...prev, isOpen: false }))}>Cancel</Button>
                                    <Button type="submit" isLoading={passwordModal.loading}>Reset Password</Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}

                {/* Subscription Modal */}
                {subModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <Card className="w-full max-w-md animate-in zoom-in-95">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Manage Subscription</h2>
                                <button onClick={() => setSubModal(prev => ({ ...prev, isOpen: false }))}>
                                    <XCircle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                                Managing subscription for <span className="font-bold">{subModal.userName}</span>.
                            </p>

                            <div className="flex gap-2 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setSubModal(prev => ({ ...prev, action: 'SET_PLAN' }))}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${subModal.action === 'SET_PLAN' ? 'bg-white dark:bg-gray-700 shadow text-indigo-600' : 'text-gray-500'}`}
                                >
                                    Set Plan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSubModal(prev => ({ ...prev, action: 'EXTEND' }))}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${subModal.action === 'EXTEND' ? 'bg-white dark:bg-gray-700 shadow text-indigo-600' : 'text-gray-500'}`}
                                >
                                    Extend Validity
                                </button>
                            </div>

                            <form onSubmit={handleSubSubmit} className="space-y-4">
                                {subModal.action === 'SET_PLAN' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Plan</label>
                                        <select
                                            className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                            value={subModal.plan}
                                            onChange={e => setSubModal(prev => ({ ...prev, plan: e.target.value }))}
                                        >
                                            <option value="NONE">No Plan (Cancel)</option>
                                            <option value="BASIC">Basic Plan</option>
                                            <option value="PRO">Pro Plan</option>
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">Setting a plan will reset validity to 30 days from now.</p>
                                    </div>
                                ) : (
                                    <div>
                                        <Input
                                            label="Days to Extend"
                                            type="number"
                                            value={subModal.extendDays}
                                            onChange={e => setSubModal(prev => ({ ...prev, extendDays: Number(e.target.value) }))}
                                            min={1}
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Adds days to the current expiry date.</p>
                                    </div>
                                )}

                                <div className="pt-4 flex justify-end gap-3">
                                    <Button type="button" variant="outline" onClick={() => setSubModal(prev => ({ ...prev, isOpen: false }))}>Cancel</Button>
                                    <Button type="submit" isLoading={subModal.loading}>Save Changes</Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}

                <ConfirmModal
                    isOpen={deleteModal.isOpen}
                    onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
                    onConfirm={confirmDelete}
                    title="Delete User"
                    description="Are you sure you want to PERMANENTLY delete this user? This action cannot be undone."
                    variant="danger"
                    loading={deleteModal.loading}
                    confirmText="Delete User"
                />
            </div>
        </DashboardLayout>
    );
}
