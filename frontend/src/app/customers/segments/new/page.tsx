'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import crmService from '@/services/crm.service';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface Criterion {
    field: string;
    operator: string;
    value: string;
}

export default function NewSegmentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [criteria, setCriteria] = useState<Criterion[]>([
        { field: 'status', operator: 'equals', value: 'ACTIVE' }
    ]);

    const handleAddCriterion = () => {
        setCriteria([...criteria, { field: 'status', operator: 'equals', value: '' }]);
    };

    const handleRemoveCriterion = (index: number) => {
        setCriteria(criteria.filter((_, i) => i !== index));
    };

    const handleCriterionChange = (index: number, field: keyof Criterion, value: string) => {
        const newCriteria = [...criteria];
        newCriteria[index][field] = value;
        setCriteria(newCriteria);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Convert criteria array to JSON logic
        const criteriaJson: any = {};
        criteria.forEach(c => {
            // Simplified logic: strict check or simple object construction
            // Backend expects something it can parse or use. For now let's construct a simple filter object.
            // Example: { "status": "ACTIVE", "totalPurchases": { "gt": 5 } }

            if (c.operator === 'equals') {
                criteriaJson[c.field] = c.value;
            } else {
                criteriaJson[c.field] = { [c.operator]: isNaN(Number(c.value)) ? c.value : Number(c.value) };
            }
        });

        try {
            await crmService.createSegment({
                name,
                description,
                criteria: criteriaJson,
                autoUpdate: true
            });
            router.push('/customers/segments');
        } catch (error: any) {
            console.error('Failed to create segment:', error);
            alert('Failed to create segment. Please check if you have PRO features enabled.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
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
                            Create New Segment
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Define criteria to automatically group customers
                        </p>
                    </div>
                </div>

                {/* Form */}
                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Segment Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                                    placeholder="e.g., High Value Customers"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                                    placeholder="Brief description of this segment"
                                />
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Filters & Criteria
                                </h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddCriterion}
                                    className="flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Criteria
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {criteria.map((criterion, index) => (
                                    <div key={index} className="flex gap-4 items-start bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                        <div className="w-1/3">
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                Field
                                            </label>
                                            <select
                                                value={criterion.field}
                                                onChange={(e) => handleCriterionChange(index, 'field', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800 dark:text-white"
                                            >
                                                <option value="status">Status</option>
                                                <option value="totalPurchases">Total Purchases</option>
                                                <option value="lifetimeValue">Lifetime Value</option>
                                                <option value="city">City</option>
                                                <option value="country">Country</option>
                                                <option value="source">Source</option>
                                            </select>
                                        </div>

                                        <div className="w-1/4">
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                Operator
                                            </label>
                                            <select
                                                value={criterion.operator}
                                                onChange={(e) => handleCriterionChange(index, 'operator', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800 dark:text-white"
                                            >
                                                <option value="equals">Equals</option>
                                                <option value="gt">Greater Than</option>
                                                <option value="lt">Less Than</option>
                                                <option value="gte">Greater or Equal</option>
                                                <option value="lte">Less or Equal</option>
                                                <option value="contains">Contains</option>
                                            </select>
                                        </div>

                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                Value
                                            </label>
                                            <input
                                                type="text"
                                                value={criterion.value}
                                                onChange={(e) => handleCriterionChange(index, 'value', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800 dark:text-white"
                                                placeholder="Value..."
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCriterion(index)}
                                            className="mt-6 p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                            >
                                {loading ? 'Creating...' : 'Create Segment'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </DashboardLayout>
    );
}
