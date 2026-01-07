'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import crmService from '@/services/crm.service';
import {
    ArrowLeft,
    Mail,
    Phone,
    Building2,
    MapPin,
    Edit,
    Trash2,
    DollarSign,
    ShoppingBag,
    Calendar,
    MessageSquare,
    PhoneCall,
    Send
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function CustomerDetailPage() {
    const router = useRouter();
    const params = useParams();
    const customerId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [customer, setCustomer] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [noteContent, setNoteContent] = useState('');
    const [interactionData, setInteractionData] = useState({
        type: 'CALL',
        subject: '',
        description: '',
        outcome: ''
    });

    useEffect(() => {
        fetchCustomer();
    }, [customerId]);

    const fetchCustomer = async () => {
        try {
            const data = await crmService.getCustomer(customerId);
            setCustomer(data);
        } catch (error: any) {
            console.error('Failed to fetch customer:', error);
            router.push('/customers');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!noteContent.trim()) return;

        try {
            await crmService.addNote(customerId, { content: noteContent });
            setNoteContent('');
            fetchCustomer();
        } catch (error: any) {
            console.error('Failed to add note:', error);
        }
    };

    const handleAddInteraction = async () => {
        if (!interactionData.type) return;

        try {
            await crmService.addInteraction(customerId, interactionData);
            setInteractionData({
                type: 'CALL',
                subject: '',
                description: '',
                outcome: ''
            });
            fetchCustomer();
        } catch (error: any) {
            console.error('Failed to add interaction:', error);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this customer?')) return;

        try {
            await crmService.deleteCustomer(customerId);
            router.push('/customers');
        } catch (error: any) {
            console.error('Failed to delete customer:', error);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES'
        }).format(amount);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!customer) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <p className="text-gray-500">Customer not found</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {customer.name}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400">
                                Customer Details
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/customers/${customerId}/edit`)}
                            className="flex items-center gap-2"
                        >
                            <Edit className="w-4 h-4" />
                            Edit
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleDelete}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Customer Info Card */}
                <Card className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                Contact Information
                            </h3>
                            <div className="space-y-2">
                                {customer.email && (
                                    <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <a href={`mailto:${customer.email}`} className="hover:underline">
                                            {customer.email}
                                        </a>
                                    </div>
                                )}
                                {customer.phone && (
                                    <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <a href={`tel:${customer.phone}`} className="hover:underline">
                                            {customer.phone}
                                        </a>
                                    </div>
                                )}
                                {customer.company && (
                                    <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                                        <Building2 className="w-4 h-4 text-gray-400" />
                                        {customer.company}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                Address
                            </h3>
                            <div className="flex items-start gap-2 text-gray-900 dark:text-white">
                                <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                                <div>
                                    {customer.address && <p>{customer.address}</p>}
                                    {customer.city && <p>{customer.city}</p>}
                                    {customer.country && <p>{customer.country}</p>}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                Statistics
                            </h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-900 dark:text-white">
                                        {formatCurrency(Number(customer.lifetimeValue))} Lifetime Value
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-900 dark:text-white">
                                        {customer.totalPurchases} Purchases
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Added {formatDistanceToNow(new Date(customer.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex gap-4">
                        {['overview', 'notes', 'interactions', 'sales'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 font-medium capitalize ${activeTab === tab
                                        ? 'border-b-2 border-indigo-600 text-indigo-600'
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Customer Information
                            </h3>
                            <dl className="space-y-3">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                                    <dd className="mt-1">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${customer.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                customer.status === 'LEAD' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                            }`}>
                                            {customer.status}
                                        </span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Source</dt>
                                    <dd className="mt-1 text-gray-900 dark:text-white">{customer.source}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Purchase</dt>
                                    <dd className="mt-1 text-gray-900 dark:text-white">
                                        {customer.lastPurchaseDate
                                            ? format(new Date(customer.lastPurchaseDate), 'PPP')
                                            : 'No purchases yet'
                                        }
                                    </dd>
                                </div>
                            </dl>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Quick Stats
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500 dark:text-gray-400">Notes</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {customer._count?.notes || 0}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500 dark:text-gray-400">Interactions</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {customer._count?.interactions || 0}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500 dark:text-gray-400">Sales</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {customer._count?.sales || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <Card className="p-6">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Add Note
                                </h3>
                                <div className="flex gap-2">
                                    <textarea
                                        value={noteContent}
                                        onChange={(e) => setNoteContent(e.target.value)}
                                        placeholder="Add a note..."
                                        rows={3}
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                                    />
                                    <Button onClick={handleAddNote} className="self-start">
                                        <MessageSquare className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Notes History
                                </h3>
                                <div className="space-y-4">
                                    {customer.notes?.map((note: any) => (
                                        <div key={note.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {note.user.name}
                                                </span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 dark:text-gray-300">{note.content}</p>
                                        </div>
                                    ))}
                                    {(!customer.notes || customer.notes.length === 0) && (
                                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                            No notes yet
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {activeTab === 'interactions' && (
                    <Card className="p-6">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Log Interaction
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <select
                                        value={interactionData.type}
                                        onChange={(e) => setInteractionData({ ...interactionData, type: e.target.value })}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                                    >
                                        <option value="CALL">Phone Call</option>
                                        <option value="EMAIL">Email</option>
                                        <option value="MEETING">Meeting</option>
                                        <option value="SUPPORT">Support</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Subject"
                                        value={interactionData.subject}
                                        onChange={(e) => setInteractionData({ ...interactionData, subject: e.target.value })}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                                    />
                                    <textarea
                                        placeholder="Description"
                                        value={interactionData.description}
                                        onChange={(e) => setInteractionData({ ...interactionData, description: e.target.value })}
                                        rows={3}
                                        className="md:col-span-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Outcome"
                                        value={interactionData.outcome}
                                        onChange={(e) => setInteractionData({ ...interactionData, outcome: e.target.value })}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                                    />
                                    <Button onClick={handleAddInteraction} className="flex items-center gap-2">
                                        <PhoneCall className="w-4 h-4" />
                                        Log Interaction
                                    </Button>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Interaction History
                                </h3>
                                <div className="space-y-4">
                                    {customer.interactions?.map((interaction: any) => (
                                        <div key={interaction.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {interaction.type}
                                                    </span>
                                                    {interaction.subject && (
                                                        <span className="text-gray-600 dark:text-gray-400 ml-2">
                                                            - {interaction.subject}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {format(new Date(interaction.interactionDate), 'PPp')}
                                                </span>
                                            </div>
                                            {interaction.description && (
                                                <p className="text-gray-700 dark:text-gray-300 mb-2">
                                                    {interaction.description}
                                                </p>
                                            )}
                                            {interaction.outcome && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Outcome: {interaction.outcome}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                By {interaction.user.name}
                                            </p>
                                        </div>
                                    ))}
                                    {(!customer.interactions || customer.interactions.length === 0) && (
                                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                            No interactions yet
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {activeTab === 'sales' && (
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Purchase History
                        </h3>
                        <div className="space-y-4">
                            {customer.sales?.map((sale: any) => (
                                <div key={sale.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                Sale #{sale.id.substring(0, 8)}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {format(new Date(sale.createdAt), 'PPP')}
                                            </p>
                                        </div>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {formatCurrency(Number(sale.totalAmount))}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {(!customer.sales || customer.sales.length === 0) && (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                    No purchases yet
                                </p>
                            )}
                        </div>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
