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
    },
    stamp: {
        position: 'absolute',
        bottom: 100,
        right: 40,
        width: 150,
        height: 150,
        opacity: 0.5,
        transform: 'rotate(-20deg)',
    },
});

interface InvoicePDFProps {
    invoice: any;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice }) => {
    const biz = invoice.initiator?.businessProfile;
    // ... rest of setup
    // Parse metadata safely
    let metadata: any = {};
    if (typeof invoice.metadata === 'string') {
        try {
            metadata = JSON.parse(invoice.metadata);
        } catch (e) {
            console.error("Failed to parse metadata", e);
        }
    } else {
        metadata = invoice.metadata || {};
    }

    const saleItems = metadata.itemsSnapshot || invoice.sale?.items || [];

    // Formatting helper
    const fmt = (num: any) => Number(num).toLocaleString('en-KE', { style: 'currency', currency: 'KES' }).replace('KES', '').trim();

    const isPaid = invoice.status === 'COMPLETED' || invoice.status === 'PAID';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {isPaid && (
                    <Image
                        src="https://cdn.pixabay.com/photo/2020/04/10/13/23/paid-5025785_1280.png"
                        style={styles.stamp}
                    />
                )}
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.companyCol}>
                        {biz?.logoUrl && (
                            <Image
                                style={styles.logo}
                                src={biz.logoUrl}
                            />
                        )}
                        <Text style={styles.companyName}>{biz?.companyName || 'Company Name'}</Text>
                        {/* Show Address / Contact */}
                        <Text style={styles.companyInfo}>{biz?.location}</Text>
                        <Text style={styles.companyInfo}>{biz?.contactPhone}</Text>
                        <Text style={styles.companyInfo}>{biz?.email}</Text>
                        {biz?.website && <Text style={styles.companyInfo}>{biz.website}</Text>}
                    </View>
                    <View style={styles.invoiceCol}>
                        <Text style={styles.invoiceTitle}>INVOICE</Text>
                        <Text style={styles.invoiceMeta}>#{invoice.reference || invoice.id.slice(0, 8).toUpperCase()}</Text>
                        <Text style={styles.invoiceMeta}>Date: {new Date(metadata.invoiceDate || invoice.createdAt).toLocaleDateString()}</Text>
                    </View>
                </View>

                {/* Bill To & Details */}
                <View style={styles.section}>
                    <View style={styles.billTo}>
                        <Text style={styles.sectionTitle}>Bill To</Text>
                        <Text style={styles.contentValue}>{metadata.clientName || 'Walk-in Customer'}</Text>
                        {metadata.clientAddress && <Text style={styles.invoiceMeta}>{metadata.clientAddress}</Text>}
                        {metadata.clientPhone && <Text style={styles.invoiceMeta}>{metadata.clientPhone}</Text>}
                    </View>
                    <View style={styles.paymentDetails}>
                        <Text style={styles.sectionTitle}>Payment Details</Text>
                        <Text style={styles.contentValue}>Total Due: KES {fmt(invoice.amount)}</Text>
                        <Text style={{ ...styles.invoiceMeta, marginTop: 4 }}>
                            Status: <Text style={styles.statusPaid}>{invoice.status === 'PAID' ? 'PAID' : 'ISSUED'}</Text>
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
                    saleItems.map((item: any, idx: number) => (
                        <View key={idx} style={styles.tableRow}>
                            <Text style={[styles.tableCell, styles.colDesc]}>{item.description || item.product?.name || 'Item'}</Text>
                            <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                            <Text style={[styles.tableCell, styles.colPrice]}>{fmt(item.price || item.unitPrice)}</Text>
                            <Text style={[styles.tableCell, styles.contentValue, styles.colTotal]}>
                                {fmt((item.price || item.unitPrice) * item.quantity)}
                            </Text>
                        </View>
                    ))
                ) : (
                    <View style={styles.tableRow}>
                        <Text style={[styles.tableCell, styles.colDesc]}>General Payment</Text>
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
                    {biz?.kraPinNumber && (
                        <View style={styles.footerCol}>
                            <Text style={styles.footerTitle}>Tax Information</Text>
                            <Text style={styles.footerText}>KRA PIN: {biz.kraPinNumber}</Text>
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
