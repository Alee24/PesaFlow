import api from '@/lib/api';

export interface SubscriptionPaymentRequest {
    plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
    phoneNumber: string;
}

export const initiateSubscriptionPayment = async (data: SubscriptionPaymentRequest) => {
    const response = await api.post('/subscription/payment/initiate', data);
    return response.data;
};

export const upgradeSubscription = async (plan: string) => {
    const response = await api.post('/subscription/upgrade', { plan });
    return response.data;
};

export const getSubscriptionStatus = async () => {
    const response = await api.get('/subscription/status');
    return response.data;
};

export const validateLicenseKey = async (licenseKey: string) => {
    const response = await api.post('/subscription/license/validate', { licenseKey });
    return response.data;
};
