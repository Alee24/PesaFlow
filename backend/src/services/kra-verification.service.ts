import axios from 'axios';

interface KRAVerficationResult {
    isValid: boolean;
    taxpayerName?: string;
    email?: string;
    mobileNumber?: string;
    city?: string;
    identityNumber?: string;
    pinStatus?: string; // Active, Suspended, etc.
    obligation?: string;
    message?: string;
}

// Regex for Kenyan KRA PIN (e.g., P051234567Z or A000123456Z)
// Starts with A or P, 9 digits, ends with a letter.
const KRA_PIN_REGEX = /^[A-Z][0-9]{9}[A-Z]$/;

/**
 * Service to handle KRA PIN verification via external API
 * Currently in SIMULATION mode until valid iTax API credentials are provided.
 */
export const verifyKRAPin = async (pin: string): Promise<KRAVerficationResult> => {
    // 1. Basic Format Validation
    const cleanPin = pin.toUpperCase().trim();
    if (!KRA_PIN_REGEX.test(cleanPin)) {
        return {
            isValid: false,
            message: 'Invalid KRA PIN format. Format should be A123456789Z.'
        };
    }

    try {
        console.log(`[KRA-API] Verifying PIN: ${cleanPin}...`);

        // ==================================================================================
        // REAL API INTEGRATION BLOCK
        // ==================================================================================
        // In a real production environment with iTax access, you would integrate here.
        // Example:
        // const response = await axios.post('https://itax.kra.go.ke/KRA-Portal/api/verifyPin', { pin: cleanPin }, { headers: { ... } });
        // return parseKRAResponse(response.data);
        // ==================================================================================

        // SIMULATION LOGIC for Demo/Dev
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Simulate a "Suspended" PIN for testing
        if (cleanPin === 'P000000000S') {
            return {
                isValid: false,
                message: 'KRA PIN is Suspended/Inactive.',
                pinStatus: 'Suspended'
            };
        }

        // Simulate a "Not Found" PIN
        if (cleanPin === 'P000000000X') {
            return {
                isValid: false,
                message: 'KRA PIN not found in iTax database.',
                pinStatus: 'Not Found'
            };
        }

        // Default: Valid
        return {
            isValid: true,
            taxpayerName: 'KK DYNAMIC ENTERPRISE SOLUTIONS LTD',
            email: 'info@kkdes.co.ke',
            mobileNumber: '0724454757',
            city: 'Nairobi',
            identityNumber: '27940030', // Mock ID
            pinStatus: 'Active',
            message: 'PIN is Active and Valid'
        };

    } catch (error) {
        console.error('KRA API Error:', error);
        // Fallback: If API fails, trust the regex validation but warn
        return {
            isValid: true,
            message: 'KRA API unreachable. Validated by format only.',
            pinStatus: 'Unknown'
        };
    }
};

/**
 * Helper to simply check format
 */
export const validatePinFormat = (pin: string): boolean => {
    return KRA_PIN_REGEX.test(pin.toUpperCase().trim());
};
