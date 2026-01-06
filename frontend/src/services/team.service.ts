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
