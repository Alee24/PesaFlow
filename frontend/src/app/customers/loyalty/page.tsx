'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import {
    Users,
    Search,
    UserPlus,
    Gift,
    Phone,
    CreditCard,
    IdCard,
    TrendingUp,
    Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface LoyaltyCustomer {
    id: string;
    phoneNumber?: string;
    idNumber?: string;
    cardNumber?: string;
    name?: string;
    email?: string;
    totalPoints: number;
    availablePoints: number;
    lifetimePoints: number;
    lastVisit: string;
    createdAt: string;
    _count?: {
        transactions: number;
        sales: number;
    };
}

export default function LoyaltyCustomersPage() {
    const { showToast } = useToast();
    const [customers, setCustomers] = useState<LoyaltyCustomer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // New customer form
    const [newCustomer, setNewCustomer] = useState({
        phoneNumber: '',
        idNumber: '',
        cardNumber: '',
        name: '',
        email: ''
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/loyalty/customers');
            setCustomers(res.data.customers || []);
        } catch (error) {
            console.error(error);
            showToast('Failed to load customers', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterCustomer = async () => {
        if (!newCustomer.phoneNumber && !newCustomer.idNumber && !newCustomer.cardNumber) {
            showToast('At least one identifier is required', 'error');
            return;
        }

        try {
            await api.post('/loyalty/customers', newCustomer);
            showToast('Customer registered successfully!', 'success');
            setIsAddModalOpen(false);
            setNewCustomer({
                phoneNumber: '',
                idNumber: '',
                cardNumber: '',
                name: '',
                email: ''
            });
            fetchCustomers();
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to register customer', 'error');
        }
    };

    const filteredCustomers = customers.filter(customer => {
        const query = searchQuery.toLowerCase();
        return (
            customer.name?.toLowerCase().includes(query) ||
            customer.phoneNumber?.includes(query) ||
            customer.idNumber?.includes(query) ||
            customer.cardNumber?.includes(query) ||
            customer.email?.toLowerCase().includes(query)
        );
    });

    const totalCustomers = customers.length;
    const totalPoints = customers.reduce((sum, c) => sum + c.availablePoints, 0);
    const activeCustomers = customers.filter(c => {
        const lastVisit = new Date(c.lastVisit);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return lastVisit > thirtyDaysAgo;
    }).length;

    return (
        <DashboardLayout>
            <div className="p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Loyalty Customers
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage your loyalty program members and track their points
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {totalCustomers}
                                </p>
                            </div>
                            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg">
                                <Users className="w-6 h-6 text-indigo-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Active (30 days)</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {activeCustomers}
                                </p>
                            </div>
                            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Points</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {totalPoints.toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                                <Gift className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name, phone, ID, or card number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    <Button
                        onClick={() => setIsAddModalOpen(true)}
                        className="whitespace-nowrap"
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Customer
                    </Button>
                </div>

                {/* Customers Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Points
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Activity
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Last Visit
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            No customers found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCustomers.map((customer) => (
                                        <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                                                        <Users className="w-5 h-5 text-indigo-600" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {customer.name || 'Anonymous'}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {customer.email || 'No email'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    {customer.phoneNumber && (
                                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                            <Phone className="w-4 h-4 mr-2" />
                                                            {customer.phoneNumber}
                                                        </div>
                                                    )}
                                                    {customer.idNumber && (
                                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                            <IdCard className="w-4 h-4 mr-2" />
                                                            {customer.idNumber}
                                                        </div>
                                                    )}
                                                    {customer.cardNumber && (
                                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                            <CreditCard className="w-4 h-4 mr-2" />
                                                            {customer.cardNumber}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        {customer.availablePoints.toLocaleString()} pts
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        Lifetime: {customer.lifetimePoints.toLocaleString()}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    {customer._count?.sales || 0} purchases
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                    <Calendar className="w-4 h-4 mr-2" />
                                                    {format(new Date(customer.lastVisit), 'MMM dd, yyyy')}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Customer Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Register New Customer
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <Input
                                label="Phone Number"
                                placeholder="07123456789"
                                value={newCustomer.phoneNumber}
                                onChange={(e) => setNewCustomer({ ...newCustomer, phoneNumber: e.target.value })}
                            />
                            <Input
                                label="ID Number"
                                placeholder="12345678"
                                value={newCustomer.idNumber}
                                onChange={(e) => setNewCustomer({ ...newCustomer, idNumber: e.target.value })}
                            />
                            <Input
                                label="Card Number"
                                placeholder="CARD-001"
                                value={newCustomer.cardNumber}
                                onChange={(e) => setNewCustomer({ ...newCustomer, cardNumber: e.target.value })}
                            />
                            <Input
                                label="Name (Optional)"
                                placeholder="Customer Name"
                                value={newCustomer.name}
                                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                            />
                            <Input
                                label="Email (Optional)"
                                type="email"
                                placeholder="customer@example.com"
                                value={newCustomer.email}
                                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                            />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                * At least one identifier (phone, ID, or card number) is required
                            </p>
                        </div>
                        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsAddModalOpen(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleRegisterCustomer}
                                className="flex-1"
                            >
                                Register
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
