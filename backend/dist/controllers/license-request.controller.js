"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLicenseRequest = exports.rejectLicenseRequest = exports.approveLicenseRequest = exports.getAllLicenseRequests = exports.submitLicenseRequest = void 0;
const client_1 = require("@prisma/client");
const license_middleware_1 = require("../middlewares/license.middleware");
const prisma = new client_1.PrismaClient();
const submitLicenseRequest = async (req, res) => {
    try {
        const { companyName, contactEmail, contactPhone, domain, fingerprint, hostname, requestedUsers, requestedDays, purpose } = req.body;
        if (!companyName || !contactEmail || !contactPhone || !domain || !fingerprint) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['companyName', 'contactEmail', 'contactPhone', 'domain', 'fingerprint']
            });
        }
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
    }
    catch (error) {
        console.error('License request error:', error);
        res.status(500).json({
            error: 'Failed to submit license request',
            details: error.message
        });
    }
};
exports.submitLicenseRequest = submitLicenseRequest;
const getAllLicenseRequests = async (req, res) => {
    try {
        const { status } = req.query;
        const where = {};
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
    }
    catch (error) {
        console.error('Get license requests error:', error);
        res.status(500).json({
            error: 'Failed to fetch license requests',
            details: error.message
        });
    }
};
exports.getAllLicenseRequests = getAllLicenseRequests;
const approveLicenseRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { maxUsers, durationDays, features } = req.body;
        const request = await prisma.licenseRequest.findUnique({
            where: { id: requestId }
        });
        if (!request) {
            return res.status(404).json({ error: 'License request not found' });
        }
        if (request.status !== 'PENDING') {
            return res.status(400).json({ error: 'Request has already been processed' });
        }
        const mockReq = {
            body: {
                domain: request.domain,
                maxUsers: maxUsers || request.requestedUsers,
                durationDays: durationDays || request.requestedDays,
                features: features || ['all']
            }
        };
        const mockRes = {
            json: (data) => data,
            status: (code) => ({
                json: (data) => ({ statusCode: code, ...data })
            })
        };
        await (0, license_middleware_1.activateLicense)(mockReq, mockRes);
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
    }
    catch (error) {
        console.error('Approve license error:', error);
        res.status(500).json({
            error: 'Failed to approve license request',
            details: error.message
        });
    }
};
exports.approveLicenseRequest = approveLicenseRequest;
const rejectLicenseRequest = async (req, res) => {
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
    }
    catch (error) {
        console.error('Reject license error:', error);
        res.status(500).json({
            error: 'Failed to reject license request',
            details: error.message
        });
    }
};
exports.rejectLicenseRequest = rejectLicenseRequest;
const deleteLicenseRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        await prisma.licenseRequest.delete({
            where: { id: requestId }
        });
        res.json({
            success: true,
            message: 'License request deleted'
        });
    }
    catch (error) {
        console.error('Delete license request error:', error);
        res.status(500).json({
            error: 'Failed to delete license request',
            details: error.message
        });
    }
};
exports.deleteLicenseRequest = deleteLicenseRequest;
//# sourceMappingURL=license-request.controller.js.map