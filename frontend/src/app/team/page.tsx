'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTeamMembers, createTeamMember, deleteTeamMember, TeamMember, getStaffPerformance, StaffPerformance } from '@/services/team.service';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function TeamPage() {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [performance, setPerformance] = useState<StaffPerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const router = useRouter();
    const { showToast } = useToast();

    // Form state
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
        // Fetch team members first (Critical)
        try {
            const teamData = await getTeamMembers();
            setTeam(teamData);
        } catch (error) {
            console.error("Team Fetch Error:", error);
            showToast('Failed to fetch team members', 'error');
        }

        // Fetch performance stats separately (Non-critical)
        try {
            const perfData = await getStaffPerformance();
            setPerformance(perfData);
        } catch (error) {
            console.error("Performance Stats Error:", error);
            // Don't show toast for this to avoid annoyance if it's just empty data
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createTeamMember(formData);
            showToast('Team member added successfully', 'success');
            setShowModal(false);
            setFormData({ name: '', email: '', phoneNumber: '', password: '' });
            fetchData();
        } catch (error: any) {
            console.error(error);
            let msg = error.response?.data?.error || error.message || 'Failed to add team member';

            // Append validation details if available
            if (Array.isArray(error.response?.data?.details)) {
                try {
                    const details = error.response.data.details.map((d: any) => {
                        const field = Array.isArray(d.path) ? d.path.join('.') : 'unknown';
                        return `${field}: ${d.message}`;
                    }).join(', ');
                    msg += ` (${details})`;
                } catch (err) {
                    msg += ` (${JSON.stringify(error.response.data.details)})`;
                }
            }

            showToast(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to suspend this team member?')) return;
        try {
            await deleteTeamMember(id);
            showToast('Team member suspended', 'success');
            fetchData();
        } catch (error: any) {
            showToast('Failed to suspend member', 'error');
        }
    };

    if (loading) return (
        <DashboardLayout>
            <div className="p-8">Loading...</div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Team Management</h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Add Team Member
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Phone</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {team.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium">{member.name}</td>
                                    <td className="p-4 text-gray-600">{member.email}</td>
                                    <td className="p-4 text-gray-600">{member.phoneNumber}</td>
                                    <td className="p-4">
                                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-xs px-2 py-1 rounded-full ${member.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {member.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleDelete(member.id)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            Suspend
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {team.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        No team members found. Add your staff to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Add Member Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">Add Team Member</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        className="w-full border rounded-lg p-2"
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
                                        className="w-full border rounded-lg p-2"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Adding...' : 'Add Member'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
