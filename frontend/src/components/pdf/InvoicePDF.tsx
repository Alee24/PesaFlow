/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register a standard font if you want specific styling, otherwise default works.
// For now, adhering to best practice, we'll use standard Helvetica implied by default, 
// but we could register fonts like Roboto if needed.

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 20,
    },
    companyCol: {
        width: '60%',
    },
    invoiceCol: {
        width: '40%',
        textAlign: 'right',
    },
    logo: {
        width: 100,
        height: 50,
        marginBottom: 10,
        objectFit: 'contain',
    },
    companyName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    companyInfo: {
        fontSize: 9,
        color: '#666',
        lineHeight: 1.4,
    },
    invoiceTitle: {
        fontSize: 24,
        fontWeight: 'extrabold',
        color: '#4f46e5', // Indigo-600
        marginBottom: 5,
    },
    invoiceMeta: {
        fontSize: 10,
        color: '#555',
        marginBottom: 2,
    },
    section: {
        flexDirection: 'row',
        marginBottom: 30,
    },
    billTo: {
        width: '50%',
    },
    paymentDetails: {
        width: '50%',
        textAlign: 'right',
    },
    sectionTitle: {
        fontSize: 8,
        color: '#888',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 5,
    },
    contentValue: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#000',
    },
    statusPaid: {
        color: '#16a34a', // Green-600
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    table: {
        width: '100%',
        marginBottom: 30,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        paddingVertical: 8,
    },
    tableHeaderOrder: {
        backgroundColor: '#f9fafb',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    colDesc: { width: '50%' },
    colQty: { width: '10%', textAlign: 'center' },
    colPrice: { width: '20%', textAlign: 'right' },
    colTotal: { width: '20%', textAlign: 'right' },

    tableCellHeader: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#4b5563',
    },
    tableCell: {
        fontSize: 10,
        color: '#1f2937',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 2,
        borderTopColor: '#e5e7eb',
    },
    totalLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        marginRight: 20,
    },
    totalAmount: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#4f46e5',
    },
    footer: {
        marginTop: 30,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        flexDirection: 'row',
    },
    footerCol: {
        width: '50%',
    },
    footerTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    footerText: {
        fontSize: 9,
        color: '#666',
        lineHeight: 1.4,
    },
    thanks: {
        marginTop: 40,
        textAlign: 'center',
        fontSize: 10,
        color: '#9ca3af',
    }
});

interface InvoicePDFProps {
    invoice: any;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice }) => {
    const biz = invoice.initiator?.businessProfile;
    const saleItems = invoice.sale?.items || [];

    // Formatting helper
    const fmt = (num: any) => Number(num).toLocaleString('en-KE', { style: 'currency', currency: 'KES' }).replace('KES', '').trim();

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.companyCol}>
                        {/* Note: React-PDF Image component requires a valid URL or base64. 
                            If logoUrl is relative or null, handle carefully. 
                            Ideally, pass a stable full URL. */}
                        {biz?.logoUrl && (
                            <Image
                                style={styles.logo}
                                src={biz.logoUrl}
                            />
                        )}
                        <Text style={styles.companyName}>{biz?.companyName || 'Company Name'}</Text>
                        <Text style={styles.companyInfo}>{biz?.location}</Text>
                        <Text style={styles.companyInfo}>{biz?.contactPhone}</Text>
                        <Text style={styles.companyInfo}>{biz?.email}</Text>
                    </View>
                    <View style={styles.invoiceCol}>
                        <Text style={styles.invoiceTitle}>INVOICE</Text>
                        <Text style={styles.invoiceMeta}>#{invoice.reference || invoice.id.slice(0, 8).toUpperCase()}</Text>
                        <Text style={styles.invoiceMeta}>Date: {new Date(invoice.createdAt).toLocaleDateString()}</Text>
                    </View>
                </View>

                {/* Bill To & Details */}
                <View style={styles.section}>
                    <View style={styles.billTo}>
                        <Text style={styles.sectionTitle}>Bill To</Text>
                        <Text style={styles.contentValue}>Walk-in Customer</Text>
                    </View>
                    <View style={styles.paymentDetails}>
                        <Text style={styles.sectionTitle}>Payment Details</Text>
                        <Text style={styles.contentValue}>Total Due: KES {fmt(invoice.amount)}</Text>
                        <Text style={{ ...styles.invoiceMeta, marginTop: 4 }}>
                            Status: <Text style={styles.statusPaid}>PAID</Text>
                        </Text>
                    </View>
                </View>

                {/* Table Header */}
                <View style={[styles.tableRow, styles.tableHeaderOrder]}>
                    <Text style={[styles.tableCellHeader, styles.colDesc]}>Item Description</Text>
                    <Text style={[styles.tableCellHeader, styles.colQty]}>Qty</Text>
                    <Text style={[styles.tableCellHeader, styles.colPrice]}>Price</Text>
                    <Text style={[styles.tableCellHeader, styles.colTotal]}>Total</Text>
                </View>

                {/* Table Rows */}
                {saleItems.length > 0 ? (
                    saleItems.map((item: any) => (
                        <View key={item.id} style={styles.tableRow}>
                            <Text style={[styles.tableCell, styles.colDesc]}>{item.product.name}</Text>
                            <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                            <Text style={[styles.tableCell, styles.colPrice]}>{fmt(item.unitPrice)}</Text>
                            <Text style={[styles.tableCell, styles.contentValue, styles.colTotal]}>{fmt(item.subtotal)}</Text>
                        </View>
                    ))
                ) : (
                    <View style={styles.tableRow}>
                        <Text style={[styles.tableCell, styles.colDesc]}>General M-Pesa Payment</Text>
                        <Text style={[styles.tableCell, styles.colQty]}>1</Text>
                        <Text style={[styles.tableCell, styles.colPrice]}>{fmt(invoice.amount)}</Text>
                        <Text style={[styles.tableCell, styles.contentValue, styles.colTotal]}>{fmt(invoice.amount)}</Text>
                    </View>
                )}

                {/* Total */}
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalAmount}>KES {fmt(invoice.amount)}</Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    {biz?.vatNumber && (
                        <View style={styles.footerCol}>
                            <Text style={styles.footerTitle}>Tax Info</Text>
                            <Text style={styles.footerText}>VAT No: {biz.vatNumber}</Text>
                        </View>
                    )}

                    {(biz?.bankDetails || biz?.mpesaDetails) && (
                        <View style={styles.footerCol}>
                            <Text style={styles.footerTitle}>Payment Info</Text>
                            <Text style={styles.footerText}>{biz.bankDetails}</Text>
                            <Text style={{ height: 5 }}></Text>
                            <Text style={styles.footerText}>{biz.mpesaDetails}</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.thanks}>Thank you for your business!</Text>
            </Page>
        </Document>
    );
};

export default InvoicePDF;
