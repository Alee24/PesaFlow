"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDispatcher = void 0;
const client_1 = require("@prisma/client");
const email_service_1 = require("./email.service");
const sms_service_1 = require("./sms.service");
const prisma = new client_1.PrismaClient();
class NotificationDispatcher {
    static async dispatch(payload) {
        setImmediate(async () => {
            try {
                const systemSettings = await prisma.systemSettings.findFirst();
                let userProfile = null;
                let user = null;
                if (payload.userId) {
                    user = await prisma.user.findUnique({
                        where: { id: payload.userId },
                        include: { businessProfile: true },
                    });
                    userProfile = user?.businessProfile;
                }
                if (user) {
                    const emailEnabled = userProfile ? userProfile.emailNotificationsEnabled : true;
                    const smsEnabled = userProfile ? userProfile.smsNotificationsEnabled : false;
                    let shouldNotifyMerchant = true;
                    if (userProfile) {
                        if (payload.activity === 'SALE_COMPLETED' && !userProfile.notifyOnSale)
                            shouldNotifyMerchant = false;
                        if (payload.activity === 'PAYMENT_RECEIVED' && !userProfile.notifyOnMpesa)
                            shouldNotifyMerchant = false;
                        if (payload.activity === 'INVOICE_CREATED' && !userProfile.notifyOnInvoice)
                            shouldNotifyMerchant = false;
                        if (payload.activity === 'INVOICE_PAID' && !userProfile.notifyOnInvoice)
                            shouldNotifyMerchant = false;
                        if (payload.activity === 'LOW_STOCK_ALERT' && !userProfile.notifyOnLowStock)
                            shouldNotifyMerchant = false;
                    }
                    if (shouldNotifyMerchant) {
                        if (emailEnabled && user.email) {
                            const html = `
                                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 12px; background: #ffffff;">
                                    <div style="display: flex; align-items: center; margin-bottom: 20px;">
                                        <h2 style="color: #008744; margin: 0; font-size: 20px;">Mpesa Connect</h2>
                                    </div>
                                    <h3 style="color: #18181b; font-size: 18px; margin-bottom: 12px;">${payload.title}</h3>
                                    <p style="color: #3f3f46; font-size: 15px; line-height: 1.6;">${payload.message}</p>
                                    ${payload.amount ? `<div style="background: #f4f4f5; padding: 14px; border-radius: 8px; margin: 16px 0; font-size: 16px; font-weight: bold; color: #18181b;">Amount: KES ${Number(payload.amount).toLocaleString()}</div>` : ''}
                                    ${payload.reference ? `<p style="color: #71717a; font-size: 13px;">Reference ID: <strong>${payload.reference}</strong></p>` : ''}
                                    <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
                                    <p style="color: #a1a1aa; font-size: 12px; margin: 0;">You received this notification because alerts are active on your Mpesa Connect account.</p>
                                </div>
                            `;
                            await (0, email_service_1.sendEmail)(user.id, user.email, `[Mpesa Connect] ${payload.title}`, html);
                        }
                        if (smsEnabled && (userProfile?.contactPhone || user.phoneNumber)) {
                            const recipientPhone = userProfile?.contactPhone || user.phoneNumber;
                            const smsText = `[Mpesa Connect] ${payload.title}: ${payload.message}${payload.amount ? ` Amt: KES ${payload.amount}` : ''}${payload.reference ? ` Ref: ${payload.reference}` : ''}`;
                            const merchantSmsConfig = {
                                partnerId: userProfile?.smsPartnerId || systemSettings?.advantaPartnerId,
                                apiKey: userProfile?.smsApiKey || systemSettings?.advantaApiKey,
                                shortcode: userProfile?.smsShortcode || systemSettings?.advantaShortcode,
                            };
                            await (0, sms_service_1.sendAdvantaSMS)(recipientPhone, smsText, merchantSmsConfig);
                        }
                    }
                }
                const adminEmailEnabled = systemSettings?.emailNotificationsEnabled ?? true;
                const adminSmsEnabled = systemSettings?.smsNotificationsEnabled ?? false;
                const adminEmail = systemSettings?.adminNotificationEmail || process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
                const adminPhone = systemSettings?.adminNotificationPhone || process.env.ADMIN_NOTIFICATION_PHONE;
                let shouldNotifyAdmin = false;
                if (payload.activity === 'NEW_REGISTRATION' && (systemSettings?.notifyAdminOnRegister ?? true)) {
                    shouldNotifyAdmin = true;
                }
                else if (payload.activity === 'PAYMENT_RECEIVED' && (systemSettings?.notifyAdminOnPayment ?? true)) {
                    shouldNotifyAdmin = true;
                }
                else if (payload.activity === 'WITHDRAWAL_REQUESTED' && (systemSettings?.notifyAdminOnWithdrawal ?? true)) {
                    shouldNotifyAdmin = true;
                }
                if (shouldNotifyAdmin) {
                    if (adminEmailEnabled && adminEmail) {
                        const adminHtml = `
                            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 12px; background: #ffffff;">
                                <div style="color: #008744; font-weight: bold; font-size: 18px; margin-bottom: 12px;">Mpesa Connect System Alert</div>
                                <h3 style="color: #18181b; font-size: 16px;">[ADMIN NOTICE] ${payload.title}</h3>
                                <p style="color: #3f3f46; font-size: 14px; line-height: 1.5;">${payload.message}</p>
                                ${payload.amount ? `<p style="font-size: 15px; font-weight: bold; color: #18181b;">Amount: KES ${Number(payload.amount).toLocaleString()}</p>` : ''}
                                ${payload.reference ? `<p style="font-size: 13px; color: #71717a;">Ref: ${payload.reference}</p>` : ''}
                                <div style="margin-top: 20px; font-size: 12px; color: #a1a1aa;">This is an administrative alert dispatched by Mpesa Connect.</div>
                            </div>
                        `;
                        await (0, email_service_1.sendSystemEmail)(adminEmail, `[Admin Alert] ${payload.title}`, adminHtml);
                    }
                    if (adminSmsEnabled && adminPhone) {
                        const adminSmsText = `[Mpesa Connect Admin] ${payload.title}: ${payload.message}${payload.amount ? ` KES ${payload.amount}` : ''}`;
                        const adminSmsConfig = {
                            partnerId: systemSettings?.advantaPartnerId,
                            apiKey: systemSettings?.advantaApiKey,
                            shortcode: systemSettings?.advantaShortcode,
                        };
                        await (0, sms_service_1.sendAdvantaSMS)(adminPhone, adminSmsText, adminSmsConfig);
                    }
                }
            }
            catch (err) {
                console.error('[NotificationDispatcher Error]:', err);
            }
        });
    }
}
exports.NotificationDispatcher = NotificationDispatcher;
//# sourceMappingURL=notification-dispatcher.service.js.map