import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SMSConfig {
    partnerId?: string | null;
    apiKey?: string | null;
    shortcode?: string | null;
}

/**
 * Normalizes Kenyan phone numbers to international standard format 254XXXXXXXXX
 */
export const normalizeKenyanPhone = (rawPhone: string): string => {
    if (!rawPhone) return '';
    let cleaned = rawPhone.replace(/\D/g, ''); // Remove non-numeric characters

    if (cleaned.startsWith('0') && cleaned.length === 10) {
        // e.g. 0712345678 or 0112345678 -> 254712345678 / 254112345678
        cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7') && cleaned.length === 9) {
        cleaned = '254' + cleaned;
    } else if (cleaned.startsWith('1') && cleaned.length === 9) {
        cleaned = '254' + cleaned;
    } else if (cleaned.startsWith('254') && cleaned.length === 12) {
        // already valid
    }

    return cleaned;
};

/**
 * Dispatches an SMS via Advanta SMS API
 */
export const sendAdvantaSMS = async (
    phone: string,
    message: string,
    config?: SMSConfig
): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
        const normalizedPhone = normalizeKenyanPhone(phone);
        if (!normalizedPhone || normalizedPhone.length < 10) {
            console.warn(`[Advanta SMS] Invalid phone number provided: ${phone}`);
            return { success: false, error: 'Invalid phone number format' };
        }

        let partnerID = config?.partnerId;
        let apikey = config?.apiKey;
        let shortcode = config?.shortcode;

        // Fallback to Global System Settings if not provided
        if (!partnerID || !apikey) {
            const systemSettings = await prisma.systemSettings.findFirst();
            partnerID = partnerID || systemSettings?.advantaPartnerId || process.env.ADVANTA_PARTNER_ID;
            apikey = apikey || systemSettings?.advantaApiKey || process.env.ADVANTA_API_KEY;
            shortcode = shortcode || systemSettings?.advantaShortcode || process.env.ADVANTA_SHORTCODE || 'MpesaConnect';
        }

        if (!partnerID || !apikey) {
            console.log('[Advanta SMS] Skipped: No Advanta SMS credentials configured.');
            return { success: false, error: 'SMS credentials not configured' };
        }

        console.log(`[Advanta SMS] Sending SMS to ${normalizedPhone} via sender ${shortcode || 'Default'}`);

        const payload = {
            partnerID: partnerID.trim(),
            apikey: apikey.trim(),
            message: message.trim(),
            shortcode: (shortcode || 'MpesaConnect').trim(),
            mobile: normalizedPhone,
        };

        const response = await axios.post(
            'https://quicksms.advantasms.com/api/services/sendsms/',
            payload,
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000,
            }
        );

        console.log('[Advanta SMS Response]', response.data);
        return { success: true, data: response.data };
    } catch (error: any) {
        console.error('[Advanta SMS Error]:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'SMS dispatch failed',
        };
    }
};
