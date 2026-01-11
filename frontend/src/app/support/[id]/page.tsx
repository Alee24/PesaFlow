'use client';

import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Send, Paperclip, User as UserIcon, Shield } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
    id: string;
    message: string;
    sender: {
        name: string;
        role: string;
    };
    isAdmin: boolean;
    createdAt: string;
}

interface Ticket {
    id: string;
    subject: string;
    status: string;
    priority: string;
    messages: Message[];
}

export default function TicketChatPage() {
    const params = useParams();
    const { user } = useAuth();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchTicket = async () => {
        try {
            const response = await api.get(`/support/${params.id}`);
            setTicket(response.data);
        } catch (error) {
            console.error('Failed to fetch ticket', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTicket();
        // Auto-refresh removed - ticket only updates on manual page refresh
    }, [params.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [ticket?.messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reply.trim()) return;

        setSending(true);
        try {
            await api.post(`/support/${params.id}/reply`, { message: reply });
            setReply('');
            await fetchTicket();
        } catch (error) {
            console.error('Failed to send reply', error);
        } finally {
            setSending(false);
        }
    };

    if (loading) return <DashboardLayout>Loading...</DashboardLayout>;
    if (!ticket) return <DashboardLayout>Ticket not found</DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-64px)] flex flex-col">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 px-6 flex justify-between items-center shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <Link href="/support" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-500" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                {ticket.subject}
                                <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-wide bg-gray-100 text-gray-600`}>
                                    {ticket.status}
                                </span>
                            </h1>
                            <p className="text-xs text-gray-500 mt-1">Ticket ID: {ticket.id}</p>
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-900">
                    {ticket.messages.map((msg) => {
                        const isMe = !msg.isAdmin; // Assuming user is always "Me" in their view. Admin view would invert this if implementing admin side.
                        // Actually, backend sets isAdmin=false for User messages.
                        // Ideally checking sender.id === user.id is better, but this works for simple case.

                        return (
                            <div key={msg.id} className={`flex gap-4 ${msg.isAdmin ? 'flex-row' : 'flex-row-reverse'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.isAdmin ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-600'}`}>
                                    {msg.isAdmin ? <Shield className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                                </div>

                                <div className={`max-w-[70%] space-y-1`}>
                                    <div className={`flex items-center gap-2 ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                            {msg.isAdmin ? 'Support Team' : 'You'}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            {format(new Date(msg.createdAt), 'HH:mm')}
                                        </span>
                                    </div>

                                    <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.isAdmin
                                        ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700'
                                        : 'bg-indigo-600 text-white rounded-tr-none'
                                        }`}>
                                        {msg.message}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 px-6">
                    <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex gap-4">
                        <input
                            type="text"
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 px-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                        />
                        <button
                            type="submit"
                            disabled={!reply.trim() || sending}
                            className="bg-indigo-600 text-white p-4 rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-transform active:scale-95"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
