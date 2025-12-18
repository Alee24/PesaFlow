'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register nice fonts if needed, or stick to defaults for now
Font.register({
    family: 'Courier',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/courierprime/v9/u-4n0qWbwps876Wv5f7S2A1W.ttf' },
        { src: 'https://fonts.gstatic.com/s/courierprime/v9/u-4m0qWbwps876Wv5f7S2A1W.ttf', fontWeight: 'bold' }
    ]
});

const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottom: 1,
        borderBottomColor: '#EEEEEE',
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4F46E5', // Indigo-600
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 10,
        color: '#6B7280',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    infoSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 20,
    },
    infoBlock: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 8,
        color: '#9CA3AF',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 10,
        color: '#111827',
        fontWeight: 'bold',
    },
    receiptContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    receiptHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: '#111827',
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 5,
        marginBottom: 10,
    },
    tableRow: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'center',
    },
    colItem: {
        flex: 3,
        fontSize: 10,
        fontWeight: 'bold',
        color: '#374151',
    },
    colQty: {
        flex: 1,
        fontSize: 9,
        color: '#6B7280',
        textAlign: 'center',
    },
    colPrice: {
        flex: 1.5,
        fontSize: 10,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'right',
    },
    itemSubtext: {
        fontSize: 8,
        color: '#9CA3AF',
        marginTop: 1,
    },
    totalSection: {
        marginTop: 15,
        paddingTop: 10,
        borderTopWidth: 2,
        borderTopColor: '#E5E7EB',
        borderStyle: 'dashed',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#6B7280',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4F46E5',
    },
    footer: {
        marginTop: 40,
        textAlign: 'center',
    },
    footerText: {
        fontSize: 8,
        color: '#9CA3AF',
    },
    stamp: {
        position: 'absolute',
        top: 20,
        right: 40,
        borderWidth: 2,
        borderColor: '#10B981',
        padding: 5,
        transform: 'rotate(-15deg)',
        borderRadius: 4,
    },
    stampText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    }
});

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);
};

interface ReceiptPDFProps {
    transaction: any;
}

const ReceiptPDF = ({ transaction }: ReceiptPDFProps) => (
    <Document>
        <Page size="A5" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>PesaFlow</Text>
                <Text style={styles.subtitle}>OFFICIAL TRANSACTION RECEIPT</Text>
            </View>

            {transaction.status === 'COMPLETED' || transaction.status === 'PAID' ? (
                <View style={styles.stamp}>
                    <Text style={styles.stampText}>PAID</Text>
                </View>
            ) : null}

            <View style={styles.infoSection}>
                <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>REFERENCE</Text>
                    <Text style={styles.infoValue}>{transaction.reference || transaction.id.substring(0, 8).toUpperCase()}</Text>
                </View>
                <View style={[styles.infoBlock, { textAlign: 'right' }]}>
                    <Text style={styles.infoLabel}>DATE</Text>
                    <Text style={styles.infoValue}>{new Date(transaction.createdAt).toLocaleString()}</Text>
                </View>
            </View>

            <View style={styles.receiptContainer}>
                <Text style={styles.receiptHeader}>
                    {transaction.sale ? "Purchase Items" : "Payment Information"}
                </Text>

                {transaction.sale ? (
                    <View>
                        <View style={styles.tableHeader}>
                            <Text style={styles.colItem}>Description</Text>
                            <Text style={styles.colQty}>Qty</Text>
                            <Text style={styles.colPrice}>Subtotal</Text>
                        </View>
                        {transaction.sale.items.map((item: any, index: number) => (
                            <View key={index} style={styles.tableRow}>
                                <View style={styles.colItem}>
                                    <Text>{item.product?.name || 'Item'}</Text>
                                    <Text style={styles.itemSubtext}>@ {formatCurrency(Number(item.unitPrice))}</Text>
                                </View>
                                <Text style={styles.colQty}>{item.quantity}</Text>
                                <Text style={styles.colPrice}>{formatCurrency(Number(item.subtotal))}</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={{ gap: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 10, color: '#6B7280' }}>Transaction Type:</Text>
                            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{transaction.type.replace('_', ' ')}</Text>
                        </View>
                        {transaction.feeCharged > 0 && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: 10, color: '#6B7280' }}>Processing Fee:</Text>
                                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#EF4444' }}>- {formatCurrency(Number(transaction.feeCharged))}</Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.totalSection}>
                    <Text style={styles.totalLabel}>Grand Total</Text>
                    <Text style={styles.totalAmount}>{formatCurrency(Number(transaction.amount))}</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Thank you for choosing PesaFlow.</Text>
                <Text style={styles.footerText}>For support contact: help@pesaflow.ke</Text>
                <Text style={[styles.footerText, { marginTop: 10, fontSize: 6 }]}>Transaction ID: {transaction.id}</Text>
            </View>
        </Page>
    </Document>
);

export default ReceiptPDF;
