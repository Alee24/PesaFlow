"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInvoiceEmail = exports.getInvoices = exports.createInvoice = void 0;
const client_1 = require("@prisma/client");
const email_service_1 = require("../services/email.service");
const prisma = new client_1.PrismaClient();
const createInvoice = async (req, res) => {
    try {
        const userId = req.user.userId;
        const merchantId = req.user.merchantId;
        const { customerId, clientName, clientPhone, clientAddress, clientEmail, date, dueDate, items, invoiceNumber, notes } = req.body;
        console.log(`[Invoice] Creating for Merchant: ${merchantId} by User: ${userId}`);
        console.log(`[Invoice] Payload:`, JSON.stringify(req.body));
        const wallet = await prisma.wallet.findFirstOrThrow({ where: { userId: merchantId } });
        const profile = await prisma.businessProfile.findUnique({ where: { userId: merchantId } });
        let targetCustomerId = customerId && customerId !== "" ? customerId : null;
        if (!targetCustomerId && clientEmail) {
            const existing = await prisma.customer.findFirst({ where: { email: clientEmail, merchantId } });
            if (existing)
                targetCustomerId = existing.id;
        }
        const subTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let vatAmount = 0;
        const vatRate = profile?.vatRate || 16.0;
        if (profile?.vatEnabled) {
            vatAmount = subTotal * (vatRate / 100);
        }
        const totalAmount = subTotal + vatAmount;
        const transaction = await prisma.transaction.create({
            data: {
                type: 'INVOICE',
                amount: totalAmount,
                reference: invoiceNumber,
                status: 'PENDING',
                initiatorUserId: userId,
                recipientWalletId: wallet.id,
                metadata: JSON.stringify({
                    clientName: clientName?.substring(0, 50),
                    invoiceDate: date,
                    dueDate: dueDate,
                    hasItems: items.length > 0,
                    itemsSnapshot: items,
                    customerId: targetCustomerId
                })
            }
        });
        let genericProduct = await prisma.product.findFirst({
            where: { merchantId: merchantId, name: 'General Invoice Item' }
        });
        if (!genericProduct) {
            genericProduct = await prisma.product.create({
                data: {
                    merchantId: merchantId,
                    name: 'General Invoice Item',
                    price: 0,
                    stockQuantity: 999999,
                    status: 'ACTIVE'
                }
            });
        }
        const genericProductId = genericProduct.id;
        const saleData = {
            merchantId: merchantId,
            totalAmount: totalAmount,
            transactionId: transaction.id,
            paymentMethod: 'INVOICE',
            paymentStatus: 'PENDING',
            amountDue: totalAmount,
            customerName: clientName,
            customerEmail: clientEmail,
            customerPhone: clientPhone,
            items: {
                create: items.map((item) => ({
                    productId: item.productId || genericProductId,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    description: item.description,
                    subtotal: item.price * item.quantity
                }))
            }
        };
        if (targetCustomerId && targetCustomerId.length > 5) {
            saleData.customerId = targetCustomerId;
        }
        const sale = await prisma.sale.create({
            data: saleData
        });
        await prisma.notification.create({
            data: {
                userId,
                title: 'Invoice Created',
                message: `Invoice #${invoiceNumber} for KES ${totalAmount.toLocaleString()} created.`,
                type: 'info'
            }
        });
        if (clientEmail) {
            const emailHtml = `
                    <h1>Invoice #${invoiceNumber}</h1>
                    <p>Dear ${clientName},</p>
                    <p>Here is your invoice for KES ${totalAmount.toLocaleString()}.</p>
                    <p>Please pay by ${date}.</p>
                    <br>
                    <p>Thank you!</p>
                `;
            (0, email_service_1.sendEmail)(userId, clientEmail, `Invoice from ${req.body.companyName || 'Us'}`, emailHtml)
                .catch(err => console.error("Failed to send invoice email:", err));
        }
        res.json({ transaction, sale });
    }
    catch (error) {
        console.error("Create Invoice Error:", error);
        res.status(500).json({
            error: 'Failed to create invoice',
            details: error.message || String(error)
        });
    }
};
exports.createInvoice = createInvoice;
const getInvoices = async (req, res) => {
    try {
        const userId = req.user.userId;
        const wallet = await prisma.wallet.findFirst({ where: { userId } });
        if (!wallet)
            return res.status(404).json({ error: 'Wallet not found' });
        const invoices = await prisma.transaction.findMany({
            where: {
                recipientWalletId: wallet.id,
                type: 'INVOICE'
            },
            orderBy: { createdAt: 'desc' },
            include: {
                sale: true,
                initiator: {
                    include: {
                        businessProfile: true
                    }
                }
            }
        });
        res.json(invoices);
    }
    catch (error) {
        console.error("Get Invoices Error:", error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
};
exports.getInvoices = getInvoices;
const sendInvoiceEmail = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email address is required' });
        }
        const transaction = await prisma.transaction.findFirst({
            where: {
                id,
                initiatorUserId: userId,
                type: 'INVOICE'
            }
        });
        if (!transaction) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        const profile = await prisma.businessProfile.findUnique({ where: { userId } });
        const senderName = profile?.companyName || 'Us';
        let metadata = {};
        try {
            metadata = JSON.parse(transaction.metadata);
        }
        catch (e) {
            metadata = transaction.metadata || {};
        }
        const statsMap = {
            'PENDING': 'Due',
            'PAID': 'Paid',
            'COMPLETED': 'Paid',
            'CANCELLED': 'Cancelled'
        };
        const statusText = statsMap[transaction.status] || transaction.status;
        const color = transaction.status === 'COMPLETED' || transaction.status === 'PAID' ? 'green' : 'gray';
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #4f46e5;">Invoice #${transaction.reference}</h1>
                <p>Dear ${metadata.clientName || 'Customer'},</p>
                <p>Here is your invoice for <strong>KES ${Number(transaction.amount).toLocaleString()}</strong>.</p>
                
                <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${color}; font-weight: bold;">${statusText}</span></p>
                    <p style="margin: 5px 0;"><strong>Due Date:</strong> ${metadata.invoiceDate}</p>
                </div>
                
                <p>Please find the details attached or viewable in your portal.</p>
                <br>
                <p>Thank you for your business!</p>
                <p><strong>${senderName}</strong></p>
            </div>
        `;
        let attachments = [];
        if (req.file) {
            attachments.push({
                filename: req.file.originalname,
                content: req.file.buffer
            });
        }
        await (0, email_service_1.sendEmail)(userId, email, `Invoice #${transaction.reference} from ${senderName}`, emailHtml, attachments);
        res.json({ message: 'Invoice sent successfully' });
    }
    catch (error) {
        console.error("Send Invoice Email Error:", error);
        res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
};
exports.sendInvoiceEmail = sendInvoiceEmail;
//# sourceMappingURL=invoice.controller.js.map
