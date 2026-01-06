import api from '@/lib/api';

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    role: string;
    status: string;
    createdAt: string;
}

export const getTeamMembers = async (): Promise<TeamMember[]> => {
    const response = await api.get('/team');
    return response.data;
};

export const createTeamMember = async (data: any): Promise<TeamMember> => {
    const response = await api.post('/team', data);
    return response.data;
};

export const deleteTeamMember = async (id: string): Promise<void> => {
    await api.delete(`/team/${id}`);
};

export interface StaffPerformance {
    userId: string;
    userName: string;
    role: string;
    totalSales: number;
    totalRevenue: number;
}

export const getStaffPerformance = async (startDate?: string, endDate?: string): Promise<StaffPerformance[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    // Using sales route for this analytics data
    const response = await api.get(`/sales/staff-performance?${params.toString()}`);
    return response.data;
};
