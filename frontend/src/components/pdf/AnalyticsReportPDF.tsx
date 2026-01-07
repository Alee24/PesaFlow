import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: 'Helvetica'
    },
    header: {
        marginBottom: 20,
        borderBottom: '2 solid #3B82F6',
        paddingBottom: 10
    },
    logo: {
        width: 80,
        height: 80,
        marginBottom: 10
    },
    companyName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 5
    },
    companyDetails: {
        fontSize: 9,
        color: '#6B7280',
        marginBottom: 2
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 15,
        color: '#1F2937'
    },
    subtitle: {
        fontSize: 10,
        textAlign: 'center',
        color: '#6B7280',
        marginBottom: 20
    },
    section: {
        marginBottom: 15
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#1F2937',
        backgroundColor: '#F3F4F6',
        padding: 8,
        borderRadius: 4
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottom: '1 solid #E5E7EB'
    },
    label: {
        fontSize: 9,
        color: '#6B7280',
        flex: 1
    },
    value: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1F2937',
        flex: 1,
        textAlign: 'right'
    },
    kpiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15
    },
    kpiCard: {
        width: '48%',
        marginBottom: 10,
        marginRight: '2%',
        padding: 10,
        backgroundColor: '#F9FAFB',
        borderRadius: 4,
        border: '1 solid #E5E7EB'
    },
    kpiLabel: {
        fontSize: 8,
        color: '#6B7280',
        marginBottom: 4
    },
    kpiValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2937'
    },
    table: {
        marginTop: 10
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        padding: 8,
        fontWeight: 'bold',
        fontSize: 9
    },
    tableRow: {
        flexDirection: 'row',
        padding: 8,
        borderBottom: '1 solid #E5E7EB',
        fontSize: 9
    },
    tableCell: {
        flex: 1
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 8,
        color: '#9CA3AF',
        borderTop: '1 solid #E5E7EB',
        paddingTop: 10
    }
});

interface AnalyticsReportPDFProps {
    businessProfile: any;
    salesData: any;
    productData: any;
    customerData: any;
    financialData: any;
    inventoryData: any;
    dateRange: { start: string; end: string };
}

export const AnalyticsReportPDF: React.FC<AnalyticsReportPDFProps> = ({
    businessProfile,
    salesData,
    productData,
    customerData,
    financialData,
    inventoryData,
    dateRange
}) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-KE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header with Logo and Company Details */}
                <View style={styles.header}>
                    {businessProfile?.logo && (
                        <Image src={businessProfile.logo} style={styles.logo} />
                    )}
                    <Text style={styles.companyName}>
                        {businessProfile?.businessName || 'Business Name'}
                    </Text>
                    {businessProfile?.address && (
                        <Text style={styles.companyDetails}>📍 {businessProfile.address}</Text>
                    )}
                    {businessProfile?.phone && (
                        <Text style={styles.companyDetails}>📞 {businessProfile.phone}</Text>
                    )}
                    {businessProfile?.email && (
                        <Text style={styles.companyDetails}>✉️ {businessProfile.email}</Text>
                    )}
                </View>

                {/* Report Title */}
                <Text style={styles.title}>Analytics & Performance Report</Text>
                <Text style={styles.subtitle}>
                    Period: {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
                </Text>

                {/* Key Performance Indicators */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📊 Key Performance Indicators</Text>
                    <View style={styles.kpiGrid}>
                        <View style={styles.kpiCard}>
                            <Text style={styles.kpiLabel}>Total Revenue</Text>
                            <Text style={styles.kpiValue}>
                                {formatCurrency(salesData?.summary?.totalRevenue || 0)}
                            </Text>
                        </View>
                        <View style={styles.kpiCard}>
                            <Text style={styles.kpiLabel}>Total Transactions</Text>
                            <Text style={styles.kpiValue}>
                                {salesData?.summary?.totalTransactions || 0}
                            </Text>
                        </View>
                        <View style={styles.kpiCard}>
                            <Text style={styles.kpiLabel}>Average Order Value</Text>
                            <Text style={styles.kpiValue}>
                                {formatCurrency(salesData?.summary?.averageOrderValue || 0)}
                            </Text>
                        </View>
                        <View style={styles.kpiCard}>
                            <Text style={styles.kpiLabel}>Gross Profit</Text>
                            <Text style={styles.kpiValue}>
                                {formatCurrency(financialData?.grossProfit || 0)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Financial Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💰 Financial Summary</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Revenue</Text>
                        <Text style={styles.value}>{formatCurrency(financialData?.revenue || 0)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Cost of Goods Sold</Text>
                        <Text style={styles.value}>{formatCurrency(financialData?.cogs || 0)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Gross Profit</Text>
                        <Text style={styles.value}>{formatCurrency(financialData?.grossProfit || 0)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Gross Margin</Text>
                        <Text style={styles.value}>{(financialData?.grossMargin || 0).toFixed(2)}%</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Withdrawals</Text>
                        <Text style={styles.value}>{formatCurrency(financialData?.withdrawals || 0)}</Text>
                    </View>
                </View>

                {/* Top Products */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🏆 Top Selling Products</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableCell, { flex: 2 }]}>Product</Text>
                            <Text style={styles.tableCell}>Qty</Text>
                            <Text style={styles.tableCell}>Revenue</Text>
                            <Text style={styles.tableCell}>Profit</Text>
                        </View>
                        {productData?.topProducts?.slice(0, 10).map((product: any, index: number) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={[styles.tableCell, { flex: 2 }]}>{product.name}</Text>
                                <Text style={styles.tableCell}>{product.quantity}</Text>
                                <Text style={styles.tableCell}>{formatCurrency(product.revenue)}</Text>
                                <Text style={styles.tableCell}>{formatCurrency(product.profit)}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Customer Insights */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👥 Customer Insights</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Total Customers</Text>
                        <Text style={styles.value}>{customerData?.summary?.totalCustomers || 0}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Average Customer Value</Text>
                        <Text style={styles.value}>
                            {formatCurrency(customerData?.summary?.averageCustomerValue || 0)}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Repeat Customer Rate</Text>
                        <Text style={styles.value}>
                            {((customerData?.summary?.repeatCustomerRate || 0) * 100).toFixed(1)}%
                        </Text>
                    </View>
                </View>

                {/* Inventory Status */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📦 Inventory Status</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Total Products</Text>
                        <Text style={styles.value}>{inventoryData?.totalProducts || 0}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Low Stock Items</Text>
                        <Text style={styles.value}>{inventoryData?.lowStockItems || 0}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Out of Stock</Text>
                        <Text style={styles.value}>{inventoryData?.outOfStockItems || 0}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Total Inventory Value</Text>
                        <Text style={styles.value}>
                            {formatCurrency(inventoryData?.totalInventoryValue || 0)}
                        </Text>
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Generated on {new Date().toLocaleString('en-KE')} |
                    Powered by {businessProfile?.businessName || 'Mpesa Connect'}
                </Text>
            </Page>
        </Document>
    );
};
