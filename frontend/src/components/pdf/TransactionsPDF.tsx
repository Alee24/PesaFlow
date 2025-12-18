
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#333',
        backgroundColor: '#fff',
    },
    header: {
        marginBottom: 30,
        borderBottomWidth: 2,
        borderBottomColor: '#4f46e5',
        paddingBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    subtitle: {
        fontSize: 10,
        color: '#6b7280',
        marginTop: 4,
    },
    dateRange: {
        fontSize: 10,
        color: '#4b5563',
        fontWeight: 'bold',
        textAlign: 'right',
    },
    table: {
        width: '100%',
        marginTop: 10,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        paddingVertical: 10,
        alignItems: 'center',
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#f9fafb',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingVertical: 8,
        borderRadius: 4,
    },
    // Columns
    colDate: { width: '18%' },
    colType: { width: '12%' },
    colRef: { width: '22%' },
    colPhone: { width: '20%' },
    colAmount: { width: '16%', textAlign: 'right' },
    colStatus: { width: '12%', textAlign: 'right' },

    headerText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#374151',
        textTransform: 'uppercase',
        paddingHorizontal: 4,
    },
    cellText: {
        fontSize: 9,
        color: '#111827',
        paddingHorizontal: 4,
    },
    statusBadge: {
        fontSize: 8,
        fontWeight: 'bold',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10,
        textAlign: 'center',
        fontSize: 8,
        color: '#9ca3af',
    }
});

interface TransactionsPDFProps {
    transactions: any[];
    startDate?: string;
    endDate?: string;
}

const getPhoneNumber = (tx: any) => {
    try {
        if (typeof tx.metadata === 'string') {
            const meta = JSON.parse(tx.metadata);
            return meta.phoneNumber || meta.clientPhone || meta.mpesaNumber || '-';
        }
        return tx.metadata?.phoneNumber || tx.metadata?.clientPhone || '-';
    } catch (e) {
        return '-';
    }
};

const formatDate = (dateString: string) => {
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return dateString;
    }
};

const TransactionsPDF: React.FC<TransactionsPDFProps> = ({ transactions, startDate, endDate }) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Transactions Report</Text>
                        <Text style={styles.subtitle}>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</Text>
                    </View>
                    <View>
                        {startDate && endDate ? (
                            <Text style={styles.dateRange}>Period: {startDate} - {endDate}</Text>
                        ) : (
                            <Text style={styles.dateRange}>Full Statement</Text>
                        )}
                        <Text style={[styles.subtitle, { textAlign: 'right' }]}>{transactions.length} Transactions</Text>
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                        <Text style={[styles.headerText, styles.colDate]}>Date & Time</Text>
                        <Text style={[styles.headerText, styles.colType]}>Type</Text>
                        <Text style={[styles.headerText, styles.colRef]}>Reference</Text>
                        <Text style={[styles.headerText, styles.colPhone]}>Recipient/Sender</Text>
                        <Text style={[styles.headerText, styles.colAmount]}>Amount</Text>
                        <Text style={[styles.headerText, styles.colStatus]}>Status</Text>
                    </View>

                    {transactions.map((tx, idx) => (
                        <View key={idx} style={styles.tableRow} wrap={false}>
                            <Text style={[styles.cellText, styles.colDate]}>{formatDate(tx.createdAt)}</Text>
                            <Text style={[styles.cellText, styles.colType]}>{tx.type.replace('_', ' ')}</Text>
                            <Text style={[styles.cellText, styles.colRef]}>{tx.reference || '-'}</Text>
                            <Text style={[styles.cellText, styles.colPhone]}>{getPhoneNumber(tx)}</Text>
                            <Text style={[styles.cellText, styles.colAmount, { fontWeight: 'bold' }]}>
                                {tx.type === 'WITHDRAWAL' ? '-' : '+'} KES {Number(tx.amount).toLocaleString()}
                            </Text>
                            <Text style={[styles.cellText, styles.colStatus, {
                                color: tx.status === 'COMPLETED' || tx.status === 'PAID' ? '#059669' :
                                    tx.status === 'FAILED' || tx.status === 'REJECTED' ? '#dc2626' : '#d97706',
                                fontWeight: 'bold'
                            }]}>
                                {tx.status}
                            </Text>
                        </View>
                    ))}
                </View>

                <Text style={styles.footer}>
                    PesaFlow Financial Report | Confidential | Page 1 of 1
                </Text>
            </Page>
        </Document>
    );
};


export default TransactionsPDF;
