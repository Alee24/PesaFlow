"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateKRASettings = exports.getKRASettings = exports.validatePin = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const kra_verification_service_1 = require("../services/kra-verification.service");
const SETTINGS_FILE = path_1.default.join(__dirname, '../../kra-settings.json');
const readSettings = () => {
    try {
        if (!fs_1.default.existsSync(SETTINGS_FILE))
            return {};
        return JSON.parse(fs_1.default.readFileSync(SETTINGS_FILE, 'utf-8'));
    }
    catch (error) {
        return {};
    }
};
const saveSettings = (settings) => {
    fs_1.default.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
};
const validatePin = async (req, res) => {
    try {
        const { pin } = req.body;
        if (!pin) {
            res.status(400).json({ error: 'PIN is required' });
            return;
        }
        const result = await (0, kra_verification_service_1.verifyKRAPin)(pin);
        if (result.isValid) {
            res.json({
                valid: true,
                message: result.message,
                taxpayerName: result.taxpayerName || 'VERIFIED ENTITY',
                email: result.email,
                mobileNumber: result.mobileNumber,
                city: result.city,
                identityNumber: result.identityNumber
            });
        }
        else {
            res.status(400).json({
                valid: false,
                error: result.message
            });
        }
    }
    catch (error) {
        console.error('Validate PIN Error:', error);
        res.status(500).json({ error: 'Validation failed' });
    }
};
exports.validatePin = validatePin;
const getKRASettings = async (req, res) => {
    try {
        const settings = readSettings();
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};
exports.getKRASettings = getKRASettings;
const updateKRASettings = async (req, res) => {
    try {
        const { portalUrl, clientId, clientSecret, searchEndpoint } = req.body;
        const settings = {
            portalUrl,
            clientId,
            clientSecret,
            searchEndpoint,
            updatedAt: new Date().toISOString()
        };
        saveSettings(settings);
        res.json({ message: 'KRA Settings updated successfully', settings });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to save settings' });
    }
};
exports.updateKRASettings = updateKRASettings;
//# sourceMappingURL=kra-integration.controller.js.map
