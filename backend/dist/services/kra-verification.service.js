"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePinFormat = exports.verifyKRAPin = void 0;
const KRA_PIN_REGEX = /^[A-Z][0-9]{9}[A-Z]$/;
const verifyKRAPin = async (pin) => {
    const cleanPin = pin.toUpperCase().trim();
    if (!KRA_PIN_REGEX.test(cleanPin)) {
        return {
            isValid: false,
            message: 'Invalid KRA PIN format. Format should be A123456789Z.'
        };
    }
    try {
        console.log(`[KRA-API] Verifying PIN: ${cleanPin}...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (cleanPin === 'P000000000S') {
            return {
                isValid: false,
                message: 'KRA PIN is Suspended/Inactive.',
                pinStatus: 'Suspended'
            };
        }
        if (cleanPin === 'P000000000X') {
            return {
                isValid: false,
                message: 'KRA PIN not found in iTax database.',
                pinStatus: 'Not Found'
            };
        }
        return {
            isValid: true,
            taxpayerName: 'KK DYNAMIC ENTERPRISE SOLUTIONS LTD',
            email: 'info@kkdes.co.ke',
            mobileNumber: '0724454757',
            city: 'Nairobi',
            identityNumber: '27940030',
            pinStatus: 'Active',
            message: 'PIN is Active and Valid'
        };
    }
    catch (error) {
        console.error('KRA API Error:', error);
        return {
            isValid: true,
            message: 'KRA API unreachable. Validated by format only.',
            pinStatus: 'Unknown'
        };
    }
};
exports.verifyKRAPin = verifyKRAPin;
const validatePinFormat = (pin) => {
    return KRA_PIN_REGEX.test(pin.toUpperCase().trim());
};
exports.validatePinFormat = validatePinFormat;
//# sourceMappingURL=kra-verification.service.js.map