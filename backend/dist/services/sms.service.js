"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAdvantaSMS = exports.normalizeKenyanPhone = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const normalizeKenyanPhone = (rawPhone) => {
    if (!rawPhone)
        return '';
    let cleaned = rawPhone.replace(/\D/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 10) {
        cleaned = '254' + cleaned.substring(1);
    }
    else if (cleaned.startsWith('7') && cleaned.length === 9) {
        cleaned = '254' + cleaned;
    }
    else if (cleaned.startsWith('1') && cleaned.length === 9) {
        cleaned = '254' + cleaned;
    }
    else if (cleaned.startsWith('254') && cleaned.length === 12) {
    }
    return cleaned;
};
exports.normalizeKenyanPhone = normalizeKenyanPhone;
const sendAdvantaSMS = async (phone, message, config) => {
    try {
        const normalizedPhone = (0, exports.normalizeKenyanPhone)(phone);
        if (!normalizedPhone || normalizedPhone.length < 10) {
            console.warn(`[Advanta SMS] Invalid phone number provided: ${phone}`);
            return { success: false, error: 'Invalid phone number format' };
        }
        let partnerID = config?.partnerId;
        let apikey = config?.apiKey;
        let shortcode = config?.shortcode;
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
        const response = await axios_1.default.post('https://quicksms.advantasms.com/api/services/sendsms/', payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
        });
        console.log('[Advanta SMS Response]', response.data);
        return { success: true, data: response.data };
    }
    catch (error) {
        console.error('[Advanta SMS Error]:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'SMS dispatch failed',
        };
    }
};
exports.sendAdvantaSMS = sendAdvantaSMS;
//# sourceMappingURL=sms.service.js.map