import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { activateLicense } from '../middlewares/license.middleware';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}

/**
 * Submit a license request (public - no auth required)
 */
export const submitLicenseRequest = async (req: Request, res: Response) => {
    try {
        const {
            companyName,
            contactEmail,
            contactPhone,
            domain,
            fingerprint,
            hostname,
            requestedUsers,
            requestedDays,
            purpose
        } = req.body;

        // Validate required fields
        if (!companyName || !contactEmail || !contactPhone || !domain || !fingerprint) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['companyName', 'contactEmail', 'contactPhone', 'domain', 'fingerprint']
            });
        }

        // Check if request already exists for this domain
        const existing = await prisma.licenseRequest.findFirst({
            where: {
                domain,
                status: 'PENDING'
            }
        });

        if (existing) {
            return res.status(400).json({
                error: 'A pending license request already exists for this domain',
                requestId: existing.id
            });
        }

        // Create license request
        const request = await prisma.licenseRequest.create({
            data: {
                companyName,
                contactEmail,
                contactPhone,
                domain,
                fingerprint,
                hostname,
                requestedUsers: requestedUsers || 100,
                requestedDays: requestedDays || 365,
                purpose,
                status: 'PENDING'
            }
        });

        res.json({
            success: true,
            message: 'License request submitted successfully',
            requestId: request.id,
            note: 'Your request will be reviewed by our team. You will receive an email once approved.'
        });
    } catch (error: any) {
        console.error('License request error:', error);
        res.status(500).json({
            error: 'Failed to submit license request',
            details: error.message
        });
    }
};

/**
 * Get all license requests (admin only)
 */
export const getAllLicenseRequests = async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.query;

        const where: any = {};
        if (status) {
            where.status = status;
        }

        const requests = await prisma.licenseRequest.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            }
        });

        const stats = {
            total: requests.length,
            pending: requests.filter(r => r.status === 'PENDING').length,
            approved: requests.filter(r => r.status === 'APPROVED').length,
            rejected: requests.filter(r => r.status === 'REJECTED').length
        };

        res.json({
            requests,
            stats
        });
    } catch (error: any) {
        console.error('Get license requests error:', error);
        res.status(500).json({
            error: 'Failed to fetch license requests',
            details: error.message
        });
    }
};

/**
 * Approve license request and activate license (admin only)
 */
export const approveLicenseRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { requestId } = req.params;
        const { maxUsers, durationDays, features } = req.body;

        // Get the request
        const request = await prisma.licenseRequest.findUnique({
            where: { id: requestId }
        });

        if (!request) {
            return res.status(404).json({ error: 'License request not found' });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({ error: 'Request has already been processed' });
        }

        // Activate the license using the existing activation logic
        const mockReq = {
            body: {
                domain: request.domain,
                maxUsers: maxUsers || request.requestedUsers,
                durationDays: durationDays || request.requestedDays,
                features: features || ['all']
            }
        } as Request;

        const mockRes = {
            json: (data: any) => data,
            status: (code: number) => ({
                json: (data: any) => ({ statusCode: code, ...data })
            })
        } as any;

        // Call the activation function
        await activateLicense(mockReq, mockRes);

        // Update request status
        await prisma.licenseRequest.update({
            where: { id: requestId },
            data: {
                status: 'APPROVED',
                approvedBy: req.user?.email || 'admin',
                approvedAt: new Date()
            }
        });

        res.json({
            success: true,
            message: 'License request approved and license activated',
            domain: request.domain
        });
    } catch (error: any) {
        console.error('Approve license error:', error);
        res.status(500).json({
            error: 'Failed to approve license request',
            details: error.message
        });
    }
};

/**
 * Reject license request (admin only)
 */
export const rejectLicenseRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { requestId } = req.params;
        const { reason } = req.body;

        const request = await prisma.licenseRequest.findUnique({
            where: { id: requestId }
        });

        if (!request) {
            return res.status(404).json({ error: 'License request not found' });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({ error: 'Request has already been processed' });
        }

        await prisma.licenseRequest.update({
            where: { id: requestId },
            data: {
                status: 'REJECTED',
                rejectionReason: reason,
                approvedBy: req.user?.email || 'admin',
                approvedAt: new Date()
            }
        });

        res.json({
            success: true,
            message: 'License request rejected'
        });
    } catch (error: any) {
        console.error('Reject license error:', error);
        res.status(500).json({
            error: 'Failed to reject license request',
            details: error.message
        });
    }
};

/**
 * Delete license request (admin only)
 */
export const deleteLicenseRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { requestId } = req.params;

        await prisma.licenseRequest.delete({
            where: { id: requestId }
        });

        res.json({
            success: true,
            message: 'License request deleted'
        });
    } catch (error: any) {
        console.error('Delete license request error:', error);
        res.status(500).json({
            error: 'Failed to delete license request',
            details: error.message
        });
    }
};
