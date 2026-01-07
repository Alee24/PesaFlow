import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
        backgroundColor: '#FFFFFF'
    },
    // Header Styles
    header: {
        marginBottom: 30,
        paddingBottom: 20,
        borderBottom: '3 solid #4F46E5'
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15
    },
    logo: {
        width: 60,
        height: 60,
        borderRadius: 8
    },
    companyInfo: {
        flex: 1,
        marginLeft: 15
    },
    companyName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 5
    },
    companyDetails: {
        fontSize: 9,
        color: '#6B7280',
        marginBottom: 2
    },
    // Title Styles
    reportTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
        color: '#4F46E5'
    },
    subtitle: {
        fontSize: 11,
        textAlign: 'center',
        color: '#6B7280',
        marginBottom: 25,
        backgroundColor: '#F3F4F6',
        padding: 8,
        borderRadius: 4
    },
    // Section Styles
    section: {
        marginBottom: 20
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: '#EEF2FF',
        padding: 10,
        borderRadius: 6,
        borderLeft: '4 solid #4F46E5'
    },
    sectionIcon: {
        fontSize: 14,
        marginRight: 8,
        color: '#4F46E5'
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2937'
    },
    // KPI Grid
    kpiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15,
        gap: 10
    },
    kpiCard: {
        width: '48%',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        border: '1 solid #E5E7EB',
        marginBottom: 10
    },
    kpiCardGreen: {
        borderLeft: '4 solid #10B981',
        backgroundColor: '#F0FDF4'
    },
    kpiCardBlue: {
        borderLeft: '4 solid #3B82F6',
        backgroundColor: '#EFF6FF'
    },
    kpiCardPurple: {
        borderLeft: '4 solid #8B5CF6',
        backgroundColor: '#F5F3FF'
    },
    kpiCardYellow: {
        borderLeft: '4 solid #F59E0B',
        backgroundColor: '#FFFBEB'
    },
    kpiLabel: {
        fontSize: 9,
        color: '#6B7280',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    kpiValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937'
    },
    kpiValueGreen: {
        color: '#059669'
    },
    kpiValueBlue: {
        color: '#2563EB'
    },
    kpiValuePurple: {
        color: '#7C3AED'
    },
    kpiValueYellow: {
        color: '#D97706'
    },
    // Table Styles
    table: {
        marginTop: 10
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#4F46E5',
        padding: 10,
        borderRadius: 4
    },
    tableHeaderText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 9,
        textTransform: 'uppercase'
    },
    tableRow: {
        flexDirection: 'row',
        padding: 10,
        borderBottom: '1 solid #E5E7EB',
        backgroundColor: '#FFFFFF'
    },
    tableRowAlt: {
        backgroundColor: '#F9FAFB'
    },
    tableCell: {
        flex: 1,
        fontSize: 9,
        color: '#374151'
    },
    tableCellBold: {
        fontWeight: 'bold',
        color: '#1F2937'
    },
    // Data Row Styles
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderBottom: '1 solid #F3F4F6'
    },
    dataLabel: {
        fontSize: 10,
        color: '#6B7280',
        flex: 1
    },
    dataValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'right'
    },
    dataValueGreen: {
        color: '#059669'
    },
    dataValueRed: {
        color: '#DC2626'
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        paddingTop: 15,
        borderTop: '2 solid #E5E7EB',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    footerText: {
        fontSize: 8,
        color: '#9CA3AF'
    },
    footerBrand: {
        fontSize: 8,
        color: '#4F46E5',
        fontWeight: 'bold'
    },
    // Badge
    badge: {
        backgroundColor: '#EEF2FF',
        color: '#4F46E5',
        padding: '4 8',
        borderRadius: 4,
        fontSize: 8,
        fontWeight: 'bold'
    }
});

interface AnalyticsReportPDFProps {
    businessProfile: any;
    salesData: any;
    productData: any;
    customerData: any;
    financialData: any;
    inventoryData: any;
    teamData: any;
    dateRange: { start: string; end: string };
}

export const AnalyticsReportPDF: React.FC<AnalyticsReportPDFProps> = ({
    businessProfile,
    salesData,
    productData,
    customerData,
    financialData,
    inventoryData,
    teamData,
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
                    <View style={styles.headerTop}>
                        {businessProfile?.logo && (
                            <Image src={businessProfile.logo} style={styles.logo} />
                        )}
                        <View style={styles.companyInfo}>
                            <Text style={styles.companyName}>
                                {businessProfile?.businessName || 'Business Name'}
                            </Text>
                            {businessProfile?.address && (
                                <Text style={styles.companyDetails}>📍 {businessProfile.address}</Text>
                            )}
                            <View style={{ flexDirection: 'row', gap: 15 }}>
                                {businessProfile?.phone && (
                                    <Text style={styles.companyDetails}>📞 {businessProfile.phone}</Text>
                                )}
                                {businessProfile?.email && (
                                    <Text style={styles.companyDetails}>✉️ {businessProfile.email}</Text>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Report Title */}
                <Text style={styles.reportTitle}>Analytics & Performance Report</Text>
                <Text style={styles.subtitle}>
                    📅 Period: {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
                </Text>

                {/* Key Performance Indicators */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionIcon}>📊</Text>
                        <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
                    </View>
                    <View style={styles.kpiGrid}>
                        <View style={[styles.kpiCard, styles.kpiCardGreen]}>
                            <Text style={styles.kpiLabel}>Total Revenue</Text>
                            <Text style={[styles.kpiValue, styles.kpiValueGreen]}>
                                {formatCurrency(salesData?.summary?.totalRevenue || 0)}
                            </Text>
                        </View>
                        <View style={[styles.kpiCard, styles.kpiCardBlue]}>
                            <Text style={styles.kpiLabel}>Transactions</Text>
                            <Text style={[styles.kpiValue, styles.kpiValueBlue]}>
                                {salesData?.summary?.totalTransactions || 0}
                            </Text>
                        </View>
                        <View style={[styles.kpiCard, styles.kpiCardPurple]}>
                            <Text style={styles.kpiLabel}>Avg Order Value</Text>
                            <Text style={[styles.kpiValue, styles.kpiValuePurple]}>
                                {formatCurrency(salesData?.summary?.averageOrderValue || 0)}
                            </Text>
                        </View>
                        <View style={[styles.kpiCard, styles.kpiCardYellow]}>
                            <Text style={styles.kpiLabel}>Gross Profit</Text>
                            <Text style={[styles.kpiValue, styles.kpiValueYellow]}>
                                {formatCurrency(financialData?.grossProfit || 0)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Financial Summary */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionIcon}>💰</Text>
                        <Text style={styles.sectionTitle}>Financial Summary</Text>
                    </View>
                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Revenue</Text>
                        <Text style={[styles.dataValue, styles.dataValueGreen]}>
                            {formatCurrency(financialData?.revenue || 0)}
                        </Text>
                    </View>
                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Cost of Goods Sold</Text>
                        <Text style={[styles.dataValue, styles.dataValueRed]}>
                            {formatCurrency(financialData?.cogs || 0)}
                        </Text>
                    </View>
                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Gross Profit</Text>
                        <Text style={[styles.dataValue, styles.dataValueGreen]}>
                            {formatCurrency(financialData?.grossProfit || 0)}
                        </Text>
                    </View>
                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Gross Margin</Text>
                        <Text style={styles.dataValue}>
                            {(financialData?.grossMargin || 0).toFixed(2)}%
                        </Text>
                    </View>
                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Withdrawals</Text>
                        <Text style={styles.dataValue}>
                            {formatCurrency(financialData?.withdrawals || 0)}
                        </Text>
                    </View>
                </View>

                {/* Top Products */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionIcon}>🏆</Text>
                        <Text style={styles.sectionTitle}>Top Selling Products</Text>
                    </View>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 2 }]}>Product</Text>
                            <Text style={[styles.tableCell, styles.tableHeaderText]}>Qty</Text>
                            <Text style={[styles.tableCell, styles.tableHeaderText]}>Revenue</Text>
                            <Text style={[styles.tableCell, styles.tableHeaderText]}>Profit</Text>
                        </View>
                        {productData?.topProducts?.slice(0, 10).map((product: any, index: number) => (
                            <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                                <Text style={[styles.tableCell, styles.tableCellBold, { flex: 2 }]}>{product.name}</Text>
                                <Text style={styles.tableCell}>{product.quantity}</Text>
                                <Text style={[styles.tableCell, styles.dataValueGreen]}>
                                    {formatCurrency(product.revenue)}
                                </Text>
                                <Text style={[styles.tableCell, styles.dataValueGreen]}>
                                    {formatCurrency(product.profit)}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Generated on {new Date().toLocaleString('en-KE')}
                    </Text>
                    <Text style={styles.footerBrand}>
                        Powered by {businessProfile?.businessName || 'Mpesa Connect'}
                    </Text>
                </View>
            </Page>

            {/* Page 2 - Customer & Inventory */}
            <Page size="A4" style={styles.page}>
                {/* Customer Insights */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionIcon}>👥</Text>
                        <Text style={styles.sectionTitle}>Customer Insights</Text>
                    </View>
                    <View style={styles.kpiGrid}>
                        <View style={[styles.kpiCard, styles.kpiCardBlue]}>
                            <Text style={styles.kpiLabel}>Total Customers</Text>
                            <Text style={[styles.kpiValue, styles.kpiValueBlue]}>
                                {customerData?.summary?.totalCustomers || 0}
                            </Text>
                        </View>
                        <View style={[styles.kpiCard, styles.kpiCardGreen]}>
                            <Text style={styles.kpiLabel}>Avg Customer Value</Text>
                            <Text style={[styles.kpiValue, styles.kpiValueGreen]}>
                                {formatCurrency(customerData?.summary?.averageCustomerValue || 0)}
                            </Text>
                        </View>
                        <View style={[styles.kpiCard, styles.kpiCardPurple]}>
                            <Text style={styles.kpiLabel}>Repeat Rate</Text>
                            <Text style={[styles.kpiValue, styles.kpiValuePurple]}>
                                {((customerData?.summary?.repeatCustomerRate || 0) * 100).toFixed(1)}%
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Inventory Status */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionIcon}>📦</Text>
                        <Text style={styles.sectionTitle}>Inventory Status</Text>
                    </View>
                    <View style={styles.kpiGrid}>
                        <View style={[styles.kpiCard, styles.kpiCardBlue]}>
                            <Text style={styles.kpiLabel}>Total Products</Text>
                            <Text style={[styles.kpiValue, styles.kpiValueBlue]}>
                                {inventoryData?.totalProducts || 0}
                            </Text>
                        </View>
                        <View style={[styles.kpiCard, styles.kpiCardYellow]}>
                            <Text style={styles.kpiLabel}>Low Stock Items</Text>
                            <Text style={[styles.kpiValue, styles.kpiValueYellow]}>
                                {inventoryData?.lowStockItems || 0}
                            </Text>
                        </View>
                        <View style={[styles.kpiCard, styles.kpiCardGreen]}>
                            <Text style={styles.kpiLabel}>Inventory Value</Text>
                            <Text style={[styles.kpiValue, styles.kpiValueGreen]}>
                                {formatCurrency(inventoryData?.totalInventoryValue || 0)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Branch Performance */}
                {teamData?.performance && teamData.performance.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionIcon}>👥</Text>
                            <Text style={styles.sectionTitle}>Branch Staff Performance</Text>
                        </View>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 2 }]}>Staff Member</Text>
                                <Text style={[styles.tableCell, styles.tableHeaderText]}>Sales</Text>
                                <Text style={[styles.tableCell, styles.tableHeaderText]}>Revenue</Text>
                                <Text style={[styles.tableCell, styles.tableHeaderText]}>Avg Order</Text>
                            </View>
                            {teamData.performance.slice(0, 10).map((staff: any, index: number) => (
                                <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                                    <Text style={[styles.tableCell, styles.tableCellBold, { flex: 2 }]}>{staff.staffName}</Text>
                                    <Text style={styles.tableCell}>{staff.totalSales}</Text>
                                    <Text style={[styles.tableCell, styles.dataValueGreen]}>
                                        {formatCurrency(staff.totalRevenue)}
                                    </Text>
                                    <Text style={styles.tableCell}>
                                        {formatCurrency(staff.averageOrderValue)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Page 2 of 2
                    </Text>
                    <Text style={styles.footerBrand}>
                        Powered by {businessProfile?.businessName || 'Mpesa Connect'}
                    </Text>
                </View>
            </Page>
        </Document>
    );
};
