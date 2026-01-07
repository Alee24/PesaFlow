import api from '@/lib/api';

export interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    city?: string;
    country?: string;
    source?: string;
    status: string;
    lifetimeValue: number;
    totalPurchases: number;
    lastPurchaseDate?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CustomerNote {
    id: string;
    content: string;
    type: string;
    createdAt: string;
    user: {
        name: string;
        email: string;
    };
}

export interface CustomerInteraction {
    id: string;
    type: string;
    subject?: string;
    description?: string;
    outcome?: string;
    duration?: number;
    interactionDate: string;
    user: {
        name: string;
        email: string;
    };
}

export interface CustomerSegment {
    id: string;
    name: string;
    description?: string;
    criteria: any;
    autoUpdate: boolean;
    createdAt: string;
}

export interface EmailCampaign {
    id: string;
    name: string;
    subject: string;
    content: string;
    status: string;
    scheduledAt?: string;
    sentAt?: string;
    totalRecipients: number;
    sentCount: number;
    openedCount: number;
    clickedCount: number;
    createdAt: string;
}

class CRMService {
    // Customer Management
    async getCustomers(params?: {
        search?: string;
        status?: string;
        page?: number;
        limit?: number;
    }) {
        const response = await api.get('/crm/customers', { params });
        return response.data;
    }

    async getCustomer(id: string) {
        const response = await api.get(`/crm/customers/${id}`);
        return response.data;
    }

    async createCustomer(data: Partial<Customer>) {
        const response = await api.post('/crm/customers', data);
        return response.data;
    }

    async updateCustomer(id: string, data: Partial<Customer>) {
        const response = await api.put(`/crm/customers/${id}`, data);
        return response.data;
    }

    async deleteCustomer(id: string) {
        const response = await api.delete(`/crm/customers/${id}`);
        return response.data;
    }

    async getCustomerStats() {
        const response = await api.get('/crm/customers/stats');
        return response.data;
    }

    // Notes
    async addNote(customerId: string, data: { content: string; type?: string }) {
        const response = await api.post(`/crm/customers/${customerId}/notes`, data);
        return response.data;
    }

    // Interactions
    async addInteraction(customerId: string, data: {
        type: string;
        subject?: string;
        description?: string;
        outcome?: string;
        duration?: number;
        interactionDate?: string;
    }) {
        const response = await api.post(`/crm/customers/${customerId}/interactions`, data);
        return response.data;
    }

    // Segments (PRO)
    async createSegment(data: {
        name: string;
        description?: string;
        criteria: any;
        autoUpdate?: boolean;
    }) {
        const response = await api.post('/crm/segments', data);
        return response.data;
    }

    async getSegments() {
        const response = await api.get('/crm/segments');
        return response.data;
    }

    async getSegmentCustomers(id: string) {
        const response = await api.get(`/crm/segments/${id}/customers`);
        return response.data;
    }

    // Campaigns (PRO)
    async createCampaign(data: {
        name: string;
        subject: string;
        content: string;
        segmentId?: string;
        scheduledAt?: string;
    }) {
        const response = await api.post('/crm/campaigns', data);
        return response.data;
    }

    async getCampaigns() {
        const response = await api.get('/crm/campaigns');
        return response.data;
    }

    async sendCampaign(id: string) {
        const response = await api.post(`/crm/campaigns/${id}/send`);
        return response.data;
    }

    async getCampaignAnalytics(id: string) {
        const response = await api.get(`/crm/campaigns/${id}/analytics`);
        return response.data;
    }
}

export default new CRMService();
