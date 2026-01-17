import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { verifyKRAPin } from '../services/kra-verification.service';

const SETTINGS_FILE = path.join(__dirname, '../../kra-settings.json');

// Helper to read settings
const readSettings = () => {
    try {
        if (!fs.existsSync(SETTINGS_FILE)) return {};
        return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    } catch (error) {
        return {};
    }
};

// Helper to save settings
const saveSettings = (settings: any) => {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
};

export const validatePin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { pin } = req.body;
        if (!pin) {
            res.status(400).json({ error: 'PIN is required' });
            return;
        }

        // Use service to verify
        // Service should ideally read the settings too if it was "Real"
        // For now, we pass the PIN.
        const result = await verifyKRAPin(pin);

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
        } else {
            res.status(400).json({
                valid: false,
                error: result.message
            });
        }

    } catch (error) {
        console.error('Validate PIN Error:', error);
        res.status(500).json({ error: 'Validation failed' });
    }
};

export const getKRASettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const settings = readSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

export const updateKRASettings = async (req: Request, res: Response): Promise<void> => {
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

    } catch (error) {
        res.status(500).json({ error: 'Failed to save settings' });
    }
};
