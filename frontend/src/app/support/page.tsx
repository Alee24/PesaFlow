'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Plus, MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Ticket {
    id: string;
    subject: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    createdAt: string;
    _count: {
        messages: number;
    };
}

export default function SupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const response = await api.get('/support');
                setTickets(response.data);
            } catch (error) {
                console.error('Failed to fetch tickets', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
            case 'CLOSED': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'HIGH': return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'MEDIUM': return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'LOW': return <CheckCircle className="w-4 h-4 text-green-500" />;
            default: return null;
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
                        <p className="text-gray-500 dark:text-gray-400">Manage your support requests</p>
                    </div>
                    <Link href="/support/new">
                        <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
                            <Plus className="w-4 h-4 mr-2" />
                            New Ticket
                        </Button>
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading tickets...</div>
                ) : tickets.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tickets yet</h3>
                        <p className="text-gray-500 mb-6">Need help? Create a new support ticket.</p>
                        <Link href="/support/new">
                            <Button>Create Ticket</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-sm font-medium border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4">Subject</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Priority</th>
                                    <th className="px-6 py-4">Messages</th>
                                    <th className="px-6 py-4">Last Updated</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {tickets.map((ticket) => (
                                    <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <Link href={`/support/${ticket.id}`} className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
                                                {ticket.subject}
                                            </Link>
                                            <div className="text-xs text-gray-500 mt-1">ID: {ticket.id.slice(0, 8)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getPriorityIcon(ticket.priority)}
                                                <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">{ticket.priority.toLowerCase()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {ticket._count.messages}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/support/${ticket.id}`}>
                                                <Button size="sm" variant="outline">View</Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
