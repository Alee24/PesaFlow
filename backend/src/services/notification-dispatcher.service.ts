import { PrismaClient } from '@prisma/client';
import { sendEmail, sendSystemEmail } from './email.service';
import { sendAdvantaSMS, SMSConfig } from './sms.service';

const prisma = new PrismaClient();

export type ActivityType =
    | 'PAYMENT_RECEIVED'
    | 'SALE_COMPLETED'
    | 'INVOICE_CREATED'
    | 'INVOICE_PAID'
    | 'NEW_REGISTRATION'
    | 'WITHDRAWAL_REQUESTED'
    | 'WITHDRAWAL_APPROVED'
    | 'LOW_STOCK_ALERT'
    | 'TEST_NOTIFICATION';

export interface NotificationPayload {
    activity: ActivityType;
    userId?: string;
    customerPhone?: string;
    customerEmail?: string;
    amount?: number | string;
    reference?: string;
    title: string;
    message: string;
    metadata?: Record<string, any>;
}

export class NotificationDispatcher {
    /**
     * Dispatch an activity event to appropriate user and/or admin based on preferences
     */
    static async dispatch(payload: NotificationPayload) {
        // Run in background without blocking API request
        setImmediate(async () => {
            try {
                const systemSettings = await prisma.systemSettings.findFirst();
                let userProfile: any = null;
                let user: any = null;

                if (payload.userId) {
                    user = await prisma.user.findUnique({
                        where: { id: payload.userId },
                        include: { businessProfile: true },
                    });
                    userProfile = user?.businessProfile;
                }

                // -------------------------------------------------------------
                // 1. MERCHANT / USER NOTIFICATION
                // -------------------------------------------------------------
                if (user) {
                    const emailEnabled = userProfile ? userProfile.emailNotificationsEnabled : true;
                    const smsEnabled = userProfile ? userProfile.smsNotificationsEnabled : false;

                    // Check activity-specific toggle for merchant
                    let shouldNotifyMerchant = true;
                    if (userProfile) {
                        if (payload.activity === 'SALE_COMPLETED' && !userProfile.notifyOnSale) shouldNotifyMerchant = false;
                        if (payload.activity === 'PAYMENT_RECEIVED' && !userProfile.notifyOnMpesa) shouldNotifyMerchant = false;
                        if (payload.activity === 'INVOICE_CREATED' && !userProfile.notifyOnInvoice) shouldNotifyMerchant = false;
                        if (payload.activity === 'INVOICE_PAID' && !userProfile.notifyOnInvoice) shouldNotifyMerchant = false;
                        if (payload.activity === 'LOW_STOCK_ALERT' && !userProfile.notifyOnLowStock) shouldNotifyMerchant = false;
                    }

                    if (shouldNotifyMerchant) {
                        // User Email
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
                            await sendEmail(user.id, user.email, `[Mpesa Connect] ${payload.title}`, html);
                        }

                        // User SMS
                        if (smsEnabled && (userProfile?.contactPhone || user.phoneNumber)) {
                            const recipientPhone = userProfile?.contactPhone || user.phoneNumber;
                            const smsText = `[Mpesa Connect] ${payload.title}: ${payload.message}${payload.amount ? ` Amt: KES ${payload.amount}` : ''}${payload.reference ? ` Ref: ${payload.reference}` : ''}`;
                            
                            const merchantSmsConfig: SMSConfig = {
                                partnerId: userProfile?.smsPartnerId || systemSettings?.advantaPartnerId,
                                apiKey: userProfile?.smsApiKey || systemSettings?.advantaApiKey,
                                shortcode: userProfile?.smsShortcode || systemSettings?.advantaShortcode,
                            };
                            await sendAdvantaSMS(recipientPhone, smsText, merchantSmsConfig);
                        }
                    }
                }

                // -------------------------------------------------------------
                // 2. ADMIN NOTIFICATION
                // -------------------------------------------------------------
                const adminEmailEnabled = systemSettings?.emailNotificationsEnabled ?? true;
                const adminSmsEnabled = systemSettings?.smsNotificationsEnabled ?? false;
                const adminEmail = systemSettings?.adminNotificationEmail || process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
                const adminPhone = systemSettings?.adminNotificationPhone || process.env.ADMIN_NOTIFICATION_PHONE;

                let shouldNotifyAdmin = false;
                if (payload.activity === 'NEW_REGISTRATION' && (systemSettings?.notifyAdminOnRegister ?? true)) {
                    shouldNotifyAdmin = true;
                } else if (payload.activity === 'PAYMENT_RECEIVED' && (systemSettings?.notifyAdminOnPayment ?? true)) {
                    shouldNotifyAdmin = true;
                } else if (payload.activity === 'WITHDRAWAL_REQUESTED' && (systemSettings?.notifyAdminOnWithdrawal ?? true)) {
                    shouldNotifyAdmin = true;
                }

                if (shouldNotifyAdmin) {
                    // Admin Email
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
                        await sendSystemEmail(adminEmail, `[Admin Alert] ${payload.title}`, adminHtml);
                    }

                    // Admin SMS
                    if (adminSmsEnabled && adminPhone) {
                        const adminSmsText = `[Mpesa Connect Admin] ${payload.title}: ${payload.message}${payload.amount ? ` KES ${payload.amount}` : ''}`;
                        const adminSmsConfig: SMSConfig = {
                            partnerId: systemSettings?.advantaPartnerId,
                            apiKey: systemSettings?.advantaApiKey,
                            shortcode: systemSettings?.advantaShortcode,
                        };
                        await sendAdvantaSMS(adminPhone, adminSmsText, adminSmsConfig);
                    }
                }
            } catch (err) {
                console.error('[NotificationDispatcher Error]:', err);
            }
        });
    }
}
