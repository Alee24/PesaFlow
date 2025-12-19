/**
 * Normalizes Kenyan phone numbers to international format (254xxx)
 * Accepts: 07123456789, 7123456789, 254123456789, +254123456789
 * Returns: 254123456789
 */
export function normalizePhoneNumber(phone: string): string {
    if (!phone) return '';

    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Handle different formats
    if (cleaned.startsWith('254')) {
        // Already in correct format
        return cleaned;
    } else if (cleaned.startsWith('0')) {
        // Remove leading 0 and add 254
        return '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
        // Add 254 prefix
        return '254' + cleaned;
    }

    return cleaned;
}

/**
 * Formats phone number for display (07xx xxx xxx)
 */
export function formatPhoneForDisplay(phone: string): string {
    if (!phone) return '';

    const normalized = normalizePhoneNumber(phone);

    // Convert 254xxx to 07xxx for display
    if (normalized.startsWith('254')) {
        const localNumber = '0' + normalized.substring(3);
        // Format as 07xx xxx xxx
        if (localNumber.length === 10) {
            return `${localNumber.substring(0, 4)} ${localNumber.substring(4, 7)} ${localNumber.substring(7)}`;
        }
        return localNumber;
    }

    return phone;
}

/**
 * Validates Kenyan phone number format
 */
export function isValidKenyanPhone(phone: string): boolean {
    const normalized = normalizePhoneNumber(phone);
    // Kenyan numbers should be 254 + 9 digits (7xx or 1xx)
    return /^254[71]\d{8}$/.test(normalized);
}
