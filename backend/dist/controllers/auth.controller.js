"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendVerification = exports.getCurrentUser = exports.updateUser = exports.login = exports.completeProfile = exports.verifyEmail = exports.register = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const kra_verification_service_1 = require("../services/kra-verification.service");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    phoneNumber: zod_1.z.string().min(10),
    password: zod_1.z.string().min(6),
    role: zod_1.z.string().optional().default('MERCHANT'),
});
const completeProfileSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(1),
    idNumber: zod_1.z.string().min(1),
    kraPinNumber: zod_1.z.string().regex(/^[A-P][0-9]{9}[A-Z]$/i, "Invalid KRA PIN format. Example: P051234567Z").optional().nullable().or(zod_1.z.literal('')),
    location: zod_1.z.string().min(1),
    dataPolicyAccepted: zod_1.z.any().transform(v => v === 'true' || v === true || v === 'on'),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
const crypto_1 = __importDefault(require("crypto"));
const email_service_1 = require("../services/email.service");
const register = async (req, res) => {
    try {
        const body = req.body;
        const { email, phoneNumber, password, role } = registerSchema.parse(body);
        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email }, { phoneNumber }] },
        });
        if (existingUser) {
            res.status(400).json({ error: 'User with this email or phone already exists' });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
        const result = await prisma.$transaction(async (tx) => {
            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
            const user = await tx.user.create({
                data: {
                    email,
                    phoneNumber,
                    passwordHash,
                    role,
                    status: 'PENDING_VERIFICATION',
                    emailVerified: false,
                    verificationToken,
                    subscription: {
                        create: {
                            plan: 'FREE',
                            status: 'ACTIVE',
                            features: '[]',
                            endDate: oneYearFromNow
                        }
                    }
                },
            });
            await tx.wallet.create({
                data: { userId: user.id },
            });
            return user;
        });
        await (0, email_service_1.sendVerificationEmail)(email, verificationToken);
        const token = jsonwebtoken_1.default.sign({ userId: result.id, role: result.role, status: result.status, parentId: result.parentId }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
        res.status(201).json({
            message: 'Account created successfully. Please check your email to verify your account.',
            token,
            user: {
                id: result.id,
                email: result.email,
                name: result.name,
                role: result.role,
                status: result.status,
                isProfileComplete: false
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const errorMessage = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
            res.status(400).json({ error: errorMessage });
        }
        else {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};
exports.register = register;
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
            res.status(400).json({ error: 'Invalid token' });
            return;
        }
        const user = await prisma.user.findFirst({
            where: { verificationToken: token }
        });
        if (!user) {
            res.status(400).json({ error: 'Invalid or expired verification token' });
            return;
        }
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                verificationToken: null,
                status: 'ACTIVE'
            }
        });
        res.json({ message: 'Email verified successfully. You can now login.' });
    }
    catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.verifyEmail = verifyEmail;
const completeProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const body = req.body;
        const { companyName, idNumber, kraPinNumber, location, dataPolicyAccepted } = completeProfileSchema.parse(body);
        const existingProfile = await prisma.businessProfile.findUnique({ where: { userId } });
        if (existingProfile) {
            res.status(400).json({ error: 'Business profile already exists' });
            return;
        }
        if (kraPinNumber && kraPinNumber.trim() !== '') {
            const kraCheck = await (0, kra_verification_service_1.verifyKRAPin)(kraPinNumber);
            if (!kraCheck.isValid) {
                res.status(400).json({ error: kraCheck.message || 'Invalid KRA PIN provided' });
                return;
            }
        }
        const files = req.files;
        const getFileUrl = (fieldName) => {
            if (files && files[fieldName] && files[fieldName][0]) {
                return `/uploads/${files[fieldName][0].filename}`;
            }
            return null;
        };
        await prisma.businessProfile.create({
            data: {
                userId,
                companyName,
                idNumber,
                kraPinNumber,
                location,
                dataPolicyAccepted,
                idFrontUrl: getFileUrl('idFront'),
                idBackUrl: getFileUrl('idBack'),
                businessPermitUrl: getFileUrl('businessPermit'),
                registrationCertUrl: getFileUrl('registrationCert'),
                kraCertUrl: getFileUrl('kraCert'),
            }
        });
        res.json({ message: 'Profile completed successfully. Pending verification.' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const errorMessage = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
            res.status(400).json({ error: errorMessage });
        }
        else {
            console.error("Complete Profile Error:", error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};
exports.completeProfile = completeProfile;
const login = async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await prisma.user.findUnique({
            where: { email },
            include: { businessProfile: true }
        });
        if (!user || !(await bcryptjs_1.default.compare(password, user.passwordHash))) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        if (!user.emailVerified && user.role !== 'ADMIN') {
            const now = new Date();
            const gracePeriodEnd = new Date(user.createdAt);
            gracePeriodEnd.setHours(gracePeriodEnd.getHours() + 24);
            if (now > gracePeriodEnd) {
                res.status(403).json({ error: 'Please verify your email address before logging in. The 24-hour grace period has expired.' });
                return;
            }
        }
        if (user.status === 'SUSPENDED') {
            res.status(403).json({ error: 'Your account has been suspended. Please call 0724454757 for activation.' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role, status: user.status, parentId: user.parentId }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                isProfileComplete: !!user.businessProfile
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const errorMessage = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
            res.status(400).json({ error: errorMessage });
        }
        else {
            console.error("LOGIN ERROR FULL DETAILS:", error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};
exports.login = login;
const updateUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { email, phoneNumber, password, currentPassword, name, posPin } = req.body;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        if (password || email !== user.email || posPin) {
            if (!currentPassword || !(await bcryptjs_1.default.compare(currentPassword, user.passwordHash))) {
                res.status(401).json({ error: 'Invalid current password to set PIN or change sensitive info' });
                return;
            }
        }
        const updates = {};
        if (email && email !== user.email) {
            const existingEmail = await prisma.user.findFirst({
                where: { email, id: { not: userId } }
            });
            if (existingEmail) {
                res.status(400).json({ error: 'Email already in use' });
                return;
            }
            updates.email = email;
        }
        if (phoneNumber && phoneNumber !== user.phoneNumber) {
            const existingPhone = await prisma.user.findFirst({
                where: { phoneNumber, id: { not: userId } }
            });
            if (existingPhone) {
                res.status(400).json({ error: 'Phone number already in use' });
                return;
            }
            updates.phoneNumber = phoneNumber;
        }
        if (name)
            updates.name = name;
        if (password) {
            updates.passwordHash = await bcryptjs_1.default.hash(password, 10);
        }
        if (posPin) {
            if (posPin.length < 4) {
                res.status(400).json({ error: 'PIN must be at least 4 digits' });
                return;
            }
            updates.pin = await bcryptjs_1.default.hash(posPin, 10);
        }
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updates,
            include: { businessProfile: true }
        });
        res.json({
            message: 'User updated successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                role: updatedUser.role,
                status: updatedUser.status,
                hasPin: !!updatedUser.pin,
                isProfileComplete: !!updatedUser.businessProfile
            }
        });
    }
    catch (error) {
        console.error("Update User Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.updateUser = updateUser;
const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { businessProfile: true }
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                emailVerified: user.emailVerified,
                isProfileComplete: !!user.businessProfile
            }
        });
    }
    catch (error) {
        console.error("Get User Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getCurrentUser = getCurrentUser;
const resendVerification = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        if (user.emailVerified) {
            res.status(400).json({ error: 'Email already verified' });
            return;
        }
        const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
        await prisma.user.update({
            where: { id: userId },
            data: { verificationToken }
        });
        await (0, email_service_1.sendVerificationEmail)(user.email, verificationToken);
        res.json({ message: 'Verification email resent successfully.' });
    }
    catch (error) {
        console.error("Resend Verification Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.resendVerification = resendVerification;
//# sourceMappingURL=auth.controller.js.map