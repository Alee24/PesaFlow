export const sendSaleEmail = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { to } = req.body;
        const file = req.file;

        if (!to || !file) {
            return res.status(400).json({ error: 'Email destination and PDF file are required' });
        }

        const sale = await prisma.sale.findUnique({ where: { id } });
        if (!sale) return res.status(404).json({ error: 'Sale not found' });

        const { sendEmail } = await import('../services/email.service');
        
        await sendEmail({
            to,
            subject: `Receipt for your purchase (${sale.receiptNumber || id.slice(0,8)})`,
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>Purchase Receipt</h2>
                    <p>Thank you for shopping with us.</p>
                    <p>Please find attached the official receipt for your purchase <strong>${sale.receiptNumber || id.slice(0,8)}</strong>.</p>
                    <br/>
                    <p>Best regards,<br/>The Team</p>
                </div>
            `,
            attachments: [
                {
                    filename: `Receipt_${sale.receiptNumber || id.slice(0,8)}.pdf`,
                    content: file.buffer
                }
            ]
        });

        res.json({ message: 'Receipt sent successfully' });
    } catch (error) {
        console.error('Send receipt email error:', error);
        res.status(500).json({ error: 'Failed to send receipt email' });
    }
};
