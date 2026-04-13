import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { startOfMonth, endOfMonth, format } from 'date-fns';

const prisma = new PrismaClient();

export const getKRAVATReport = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { startDate, endDate, format: fileFormat = 'csv' } = req.query;

        // Get user's business profile
        const profile = await prisma.businessProfile.findUnique({
            where: { userId },
            select: {
                vatEnabled: true,
                vatRate: true,
                companyName: true,
                kraPinNumber: true
            }
        });

        if (!profile?.vatEnabled) {
            return res.status(400).json({ error: 'VAT is not enabled for your business' });
        }

        const start = startDate ? new Date(startDate as string) : startOfMonth(new Date());
        const end = endDate ? new Date(endDate as string) : endOfMonth(new Date());

        // Get all sales with VAT-enabled products
        const sales = await prisma.sale.findMany({
            where: {
                merchantId: userId,
                createdAt: { gte: start, lte: end },
                paymentStatus: { in: ['PAID', 'PARTIAL'] }
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                isTaxable: true,
                                sku: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        const vatRate = profile.vatRate || 16.0;
        const reportData: any[] = [];
        let totalSales = 0;
        let totalVAT = 0;

        sales.forEach(sale => {
            sale.items.forEach(item => {
                // Calculate VAT on ALL items if VAT is enabled for the business
                const subtotal = Number(item.subtotal);
                const vatAmount = subtotal * (vatRate / 100);
                const totalWithVAT = subtotal + vatAmount;

                totalSales += subtotal;
                totalVAT += vatAmount;

                reportData.push({
                    date: format(sale.createdAt, 'yyyy-MM-dd'),
                    invoiceNumber: sale.id.substring(0, 8),
                    productName: item.product.name,
                    sku: item.product.sku || 'N/A',
                    quantity: item.quantity,
                    unitPrice: Number(item.unitPrice),
                    subtotal: subtotal,
                    vatRate: vatRate,
                    vatAmount: vatAmount,
                    totalWithVAT: totalWithVAT
                });
            });
        });

        if (fileFormat === 'json') {
            return res.json({
                period: {
                    start: format(start, 'yyyy-MM-dd'),
                    end: format(end, 'yyyy-MM-dd')
                },
                business: {
                    name: profile.companyName,
                    pin: profile.kraPinNumber
                },
                summary: {
                    totalSales,
                    totalVAT,
                    totalWithVAT: totalSales + totalVAT,
                    vatRate
                },
                transactions: reportData
            });
        }

        // Generate CSV
        const csvRows = [
            ['KRA VAT REPORT'],
            ['Business Name:', profile.companyName || 'N/A'],
            ['KRA PIN:', profile.kraPinNumber || 'N/A'],
            ['Period:', `${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`],
            ['VAT Rate:', `${vatRate}%`],
            [],
            ['Date', 'Invoice No.', 'Product', 'SKU', 'Qty', 'Unit Price', 'Subtotal', 'VAT Rate', 'VAT Amount', 'Total (Inc. VAT)']
        ];

        reportData.forEach(row => {
            csvRows.push([
                row.date,
                row.invoiceNumber,
                row.productName,
                row.sku,
                row.quantity.toString(),
                row.unitPrice.toFixed(2),
                row.subtotal.toFixed(2),
                `${row.vatRate}%`,
                row.vatAmount.toFixed(2),
                row.totalWithVAT.toFixed(2)
            ]);
        });

        csvRows.push([]);
        csvRows.push(['SUMMARY']);
        csvRows.push(['Total Sales (Excl. VAT):', '', '', '', '', '', totalSales.toFixed(2)]);
        csvRows.push(['Total VAT Collected:', '', '', '', '', '', totalVAT.toFixed(2)]);
        csvRows.push(['Total (Inc. VAT):', '', '', '', '', '', (totalSales + totalVAT).toFixed(2)]);
        csvRows.push([]);
        csvRows.push(['Amount to Remit to KRA:', '', '', '', '', '', totalVAT.toFixed(2)]);

        const csv = csvRows.map(row => row.join(',')).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=KRA_VAT_Report_${format(start, 'yyyy-MM')}.csv`);
        res.send(csv);

    } catch (error) {
        console.error('KRA VAT Report Error:', error);
        res.status(500).json({ error: 'Failed to generate KRA VAT report' });
    }
};
