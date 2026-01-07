'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { Users, UserPlus, UserX, TrendingUp } from 'lucide-react';
import api from '@/lib/api';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    role: string;
    status: string;
    createdAt: string;
}

interface StaffPerformance {
    userId: string;
    userName: string;
    userEmail: string;
    role: string;
    totalSales: number;
    totalRevenue: number;
}

export default function TeamPage() {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [performance, setPerformance] = useState<StaffPerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const router = useRouter();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        password: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);

        // Fetch team members
        try {
            const res = await api.get('/team');
            setTeam(res.data);
        } catch (error) {
            console.error("Team Fetch Error:", error);
            showToast('Failed to fetch team members', 'error');
        }

        // Fetch performance stats
        try {
            const res = await api.get('/sales/staff-performance');
            setPerformance(res.data);
        } catch (error) {
            console.error("Performance Stats Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/team', formData);
            showToast('Team member added successfully', 'success');
            setShowModal(false);
            setFormData({ name: '', email: '', phoneNumber: '', password: '' });
            fetchData();
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.error || error.message || 'Failed to add team member';
            showToast(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to suspend this team member?')) return;
        try {
            await api.delete(`/team/${id}`);
            showToast('Team member suspended', 'success');
            fetchData();
        } catch (error: any) {
            showToast('Failed to suspend member', 'error');
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading team data...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Users className="w-6 h-6" />
                            Team Management
                        </h1>
                        <p className="text-gray-500 text-sm">Manage your staff and view performance</p>
                    </div>
                    <Button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add Team Member
                    </Button>
                </header>

                {/* Team Members Table */}
                <Card>
                    <div className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Team Members</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                        <th className="py-3 px-4 font-semibold">Name</th>
                                        <th className="py-3 px-4 font-semibold">Email</th>
                                        <th className="py-3 px-4 font-semibold">Phone</th>
                                        <th className="py-3 px-4 font-semibold">Role</th>
                                        <th className="py-3 px-4 font-semibold">Status</th>
                                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-700">
                                    {team.map((member) => (
                                        <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="py-3 px-4 font-medium">{member.name}</td>
                                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{member.email}</td>
                                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{member.phoneNumber}</td>
                                            <td className="py-3 px-4">
                                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                                    {member.role}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`text-xs px-2 py-1 rounded-full ${member.status === 'ACTIVE'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {member.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(member.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <UserX className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {team.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-gray-500">
                                                No team members found. Add your staff to get started.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>

                {/* Staff Performance */}
                {performance.length > 0 && (
                    <Card>
                        <div className="p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Staff Sales Performance
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                            <th className="py-3 px-4 font-semibold">Staff Member</th>
                                            <th className="py-3 px-4 font-semibold">Role</th>
                                            <th className="py-3 px-4 font-semibold text-right">Total Sales</th>
                                            <th className="py-3 px-4 font-semibold text-right">Total Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-gray-700">
                                        {performance.map((p) => (
                                            <tr key={p.userId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="py-3 px-4">
                                                    <div className="font-medium">{p.userName}</div>
                                                    <div className="text-xs text-gray-500">{p.userEmail}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                                                        {p.role}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right font-medium">{p.totalSales}</td>
                                                <td className="py-3 px-4 text-right font-bold text-green-600">
                                                    KES {(p.totalRevenue || 0).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            {/* Add Member Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">Add Team Member</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={formData.phoneNumber}
                                    onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="07..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Password</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    isLoading={isSubmitting}
                                >
                                    Add Member
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
