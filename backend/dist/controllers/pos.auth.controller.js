"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPin = exports.getStaffList = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const verifyPinSchema = zod_1.z.object({
    teamMemberId: zod_1.z.string().uuid(),
    pin: zod_1.z.string().min(4).max(6)
});
const getStaffList = async (req, res) => {
    try {
        const merchantId = req.user.userId;
        const merchant = await prisma.user.findUnique({
            where: { id: merchantId },
            select: {
                id: true,
                name: true,
                role: true
            }
        });
        const staff = await prisma.teamMember.findMany({
            where: {
                merchantId: merchantId,
                status: 'ACTIVE'
            },
            select: {
                id: true,
                name: true,
                role: true,
            }
        });
        const combinedList = [];
        if (merchant) {
            combinedList.push({
                id: merchant.id,
                name: `${merchant.name || 'Owner'} (Owner)`,
                role: 'MERCHANT',
                isOwner: true
            });
        }
        combinedList.push(...staff);
        res.json(combinedList);
    }
    catch (error) {
        console.error("Get Staff List Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getStaffList = getStaffList;
const verifyPin = async (req, res) => {
    try {
        const { teamMemberId, pin } = verifyPinSchema.parse(req.body);
        let user;
        const staff = await prisma.teamMember.findUnique({
            where: { id: teamMemberId }
        });
        if (staff) {
            user = {
                id: staff.id,
                name: staff.name,
                role: staff.role,
                pin: staff.pin,
                merchantId: staff.merchantId
            };
        }
        else {
            const merchant = await prisma.user.findUnique({
                where: { id: teamMemberId }
            });
            if (merchant) {
                user = {
                    id: merchant.id,
                    name: merchant.name,
                    role: merchant.role,
                    pin: merchant.pin,
                    merchantId: merchant.id
                };
            }
            else {
                res.status(404).json({ error: 'Person not found' });
                return;
            }
        }
        if (!user.pin) {
            res.status(400).json({ error: 'PIN not set for this person' });
            return;
        }
        const isValid = await bcryptjs_1.default.compare(pin, user.pin);
        if (!isValid) {
            res.status(401).json({ error: 'Invalid PIN' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({
            teamMemberId: user.id,
            merchantId: user.merchantId,
            role: user.role,
            isTeamMember: true
        }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '12h' });
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                merchantId: user.merchantId,
                isTeamMember: true
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Invalid data format' });
        }
        else {
            console.error("Verify PIN Error:", error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};
exports.verifyPin = verifyPin;
//# sourceMappingURL=pos.auth.controller.js.map