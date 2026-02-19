import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Text,
  Surface,
  useTheme,
  IconButton,
  Button,
  SegmentedButtons,
  Portal,
  Modal,
  TextInput,
} from "react-native-paper";
import { printAsync } from "expo-print";
import {
  generateReceiptHtml,
  generateSalesReportHtml,
} from "../utils/receiptGenerator";
import { useDatabaseContext } from "../context/DatabaseContext";
import { Sale } from "../types/db";
import {
  Trash2,
  Receipt,
  Calendar,
  DollarSign,
  Percent,
  Printer,
  RefreshCw,
  Accessibility,
} from "lucide-react-native";
import { BarChart } from "react-native-gifted-charts";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subDays,
  format,
  parseISO,
} from "date-fns";

export function ReportsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { db, deleteSale, refreshData, getSalesReport, getSalesChartData } =
    useDatabaseContext();
  const [view, setView] = useState<"daily" | "weekly" | "monthly" | "custom">(
    "daily",
  );
  const [customRange, setCustomRange] = useState({
    start: startOfDay(subDays(new Date(), 7)),
    end: endOfDay(new Date()),
  });
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [tempDates, setTempDates] = useState({ start: "", end: "" });
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    grossSales: 0,
    totalSales: 0,
    totalTransactions: 0,
    totalVat: 0,
    totalDiscounts: 0,
    vatableSales: 0,
    vatExemptSales: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);

  const getDateRange = useCallback(() => {
    const now = new Date();
    let start, end;

    if (view === "daily") {
      start = startOfDay(now);
      end = endOfDay(now);
    } else if (view === "weekly") {
      start = startOfDay(subDays(now, 7));
      end = endOfDay(now);
    } else if (view === "monthly") {
      start = startOfMonth(now);
      end = endOfMonth(now);
    } else {
      start = customRange.start;
      end = customRange.end;
    }
    return { start, end };
  }, [view, customRange]);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    const { start, end } = getDateRange();

    // Fetch Stats
    const report = await getSalesReport(start, end);

    // Calculate derived vals (Net Vatable/Exempt) based on current settings
    // Note: DB returns "Gross" (Inclusive) for vatable/exempt categories.
    // We divide by (1 + vat/100) to get the Base Amount.
    const vatRate = (db.settings.vat_percentage || 12) / 100;
    const vatableSales = report.vatableGross / (1 + vatRate);
    const vatExemptSales = report.exemptGross / (1 + vatRate);

    setStats({
      ...report,
      vatableSales,
      vatExemptSales,
    });

    // Fetch Chart Data
    const rawChartData = await getSalesChartData(start, end);

    // Process Chart Data (Fill gaps)
    const filledChartData = [];
    const daysDiff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    // Limit to reasonable bars
    const actualDays = Math.min(daysDiff, 31); // Max 31 bars

    // Loop from Start Date
    for (let i = 0; i < actualDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = format(d, "yyyy-MM-dd");

      const dayData = rawChartData.find((r: any) => r.date === dateStr);
      const val = dayData ? dayData.total : 0;

      filledChartData.push({
        value: val,
        label: format(d, "dd"),
        labelTextStyle: { color: theme.colors.outline, fontSize: 10 },
        frontColor: theme.colors.primary,
      });
    }

    setChartData(filledChartData);
    setLoading(false);
  }, [
    getDateRange,
    getSalesReport,
    getSalesChartData,
    db.settings.vat_percentage,
    theme.colors,
  ]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData, refreshData]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await refreshData();
  }, [refreshData]);

  const handleApplyCustomRange = () => {
    try {
      const start = startOfDay(parseISO(tempDates.start));
      const end = endOfDay(parseISO(tempDates.end));
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error("Invalid date format");
      }
      setCustomRange({ start, end });
      setIsPickerVisible(false);
    } catch (e) {
      Alert.alert("Invalid Format", "Please use YYYY-MM-DD (e.g., 2024-02-15)");
    }
  };

  const openRangePicker = () => {
    setTempDates({
      start: format(customRange.start, "yyyy-MM-dd"),
      end: format(customRange.end, "yyyy-MM-dd"),
    });
    setIsPickerVisible(true);
  };

  const handlePrintReceipt = async (sale: Sale) => {
    try {
      const html = generateReceiptHtml({
        items: sale.items,
        settings: db.settings,
        checkoutDetails: {
          subtotalInclusive: sale.total_amount,
          vatAmount: sale.vat_amount,
          discountAmount: sale.discount_amount,
          finalAmount: sale.final_amount,
          discountType: sale.discount_type || null,
        },
        paymentMethod: sale.payment_method,
        cashReceived: sale.final_amount,
        change: 0,
        timestamp: parseISO(sale.created_at),
        transactionId: sale.id,
        isReprint: true,
      });

      await printAsync({ html, width: 576 });
    } catch (error) {
      Alert.alert("Error", "Failed to print receipt");
    }
  };

  const handleVoidSale = (sale: Sale) => {
    Alert.alert(
      "Void Sale",
      `Are you sure you want to void this sale? (ID: ${sale.id.slice(0, 8)})`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Void",
          style: "destructive",
          onPress: async () => {
            await deleteSale(sale.id);
          },
        },
      ],
    );
  };

  const handlePrintReport = async () => {
    try {
      const { start, end } = getDateRange();
      const html = generateSalesReportHtml({
        dateRange: { start, end },
        settings: db.settings,
        stats: {
          grossSales: stats.grossSales,
          totalSales: stats.totalSales,
          totalTransactions: stats.totalTransactions,
          totalVat: stats.totalVat,
          totalDiscounts: stats.totalDiscounts,
          vatableSales: stats.vatableSales,
          vatExemptSales: stats.vatExemptSales,
        },
      });
      await printAsync({ html, width: 576 });
    } catch (error) {
      Alert.alert("Error", "Failed to print report");
    }
  };

  const renderItem = ({ item }: { item: Sale }) => (
    <Surface style={styles.saleItem} elevation={0}>
      <View style={styles.saleInfo}>
        <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
          ₱{item.final_amount.toFixed(2)}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
          {format(parseISO(item.created_at), "MMM dd, HH:mm")}
        </Text>
        <Text variant="bodySmall">
          {item.payment_method.toUpperCase()} •{" "}
          {item.items ? item.items.length : 0} items
        </Text>
      </View>
      <View style={styles.saleActions}>
        {item.discount_amount > 0 && (
          <View
            style={[
              styles.badge,
              { backgroundColor: theme.colors.errorContainer },
            ]}
          >
            <Text
              style={{
                color: theme.colors.error,
                fontSize: 10,
                fontWeight: "bold",
              }}
            >
              -{item.discount_amount.toFixed(0)}
            </Text>
          </View>
        )}
        <IconButton
          icon={({ size }) => (
            <Printer size={size} color={theme.colors.primary} />
          )}
          size={20}
          onPress={() => handlePrintReceipt(item)}
        />
        <IconButton
          icon={({ size }) => <Trash2 size={size} color={theme.colors.error} />}
          size={20}
          onPress={() => handleVoidSale(item)}
        />
      </View>
    </Surface>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text variant="titleLarge" style={styles.headerTitle}>
            Sales Reports
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>
            Store Performance Overview
          </Text>
        </View>
        <View style={{ flexDirection: "row" }}>
          <IconButton
            icon={({ size }) => (
              <Printer size={size} color={theme.colors.primary} />
            )}
            onPress={handlePrintReport}
            disabled={loading}
          />
          <IconButton
            icon={({ size }) => (
              <RefreshCw size={size} color={theme.colors.primary} />
            )}
            onPress={loadData}
            disabled={loading}
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={view}
          onValueChange={(v) => setView(v as any)}
          buttons={[
            { value: "daily", label: "Day", showSelectedCheck: true },
            { value: "weekly", label: "Week", showSelectedCheck: true },
            { value: "monthly", label: "Month", showSelectedCheck: true },
            { value: "custom", label: "Custom", showSelectedCheck: true },
          ]}
          style={styles.segmentedButton}
        />
      </View>

      {view === "custom" && (
        <Surface style={styles.customRangeContainer} elevation={0}>
          <View style={styles.rangeRow}>
            <View style={styles.dateField}>
              <Text variant="labelSmall">Start Date</Text>
              <Button
                mode="outlined"
                onPress={openRangePicker}
                style={styles.dateButton}
                compact
              >
                {format(customRange.start, "MMM dd, yyyy")}
              </Button>
            </View>
            <View style={styles.dateField}>
              <Text variant="labelSmall">End Date</Text>
              <Button
                mode="outlined"
                onPress={openRangePicker}
                style={styles.dateButton}
                compact
              >
                {format(customRange.end, "MMM dd, yyyy")}
              </Button>
            </View>
          </View>
        </Surface>
      )}

      <Portal>
        <Modal
          visible={isPickerVisible}
          onDismiss={() => setIsPickerVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalContent} elevation={3}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              Select Date Range
            </Text>
            <Text variant="bodySmall" style={styles.modalHint}>
              Format: YYYY-MM-DD
            </Text>

            <View style={styles.inputGroup}>
              <TextInput
                mode="outlined"
                label="Start Date"
                value={tempDates.start}
                onChangeText={(t) =>
                  setTempDates((prev) => ({ ...prev, start: t }))
                }
                placeholder="2024-01-01"
              />
              <TextInput
                mode="outlined"
                label="End Date"
                value={tempDates.end}
                onChangeText={(t) =>
                  setTempDates((prev) => ({ ...prev, end: t }))
                }
                placeholder="2024-01-31"
              />
            </View>

            <View style={styles.modalActions}>
              <Button onPress={() => setIsPickerVisible(false)}>Cancel</Button>
              <Button mode="contained" onPress={handleApplyCustomRange}>
                Apply Range
              </Button>
            </View>
          </Surface>
        </Modal>
      </Portal>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadData}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Stat Cards */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Net Sales"
            value={`₱${(stats.totalSales ?? 0).toFixed(2)}`}
            icon={DollarSign}
            color={theme.colors.primary}
            subtitle="After Discounts"
          />
          <StatCard
            title="Transactions"
            value={stats.totalTransactions.toString()}
            icon={Receipt}
            color="#3b82f6"
          />
          <StatCard
            title="VATable Sales"
            value={`₱${(stats.vatableSales ?? 0).toFixed(2)}`}
            icon={Percent}
            color="#6366f1"
          />
          <StatCard
            title="VAT (12%)"
            value={`₱${(stats.totalVat ?? 0).toFixed(2)}`}
            icon={Percent}
            color="#f97316"
          />
          <StatCard
            title="Exempt Sales"
            value={`₱${(stats.vatExemptSales ?? 0).toFixed(2)}`}
            icon={Accessibility}
            color="#10b981"
            subtitle="Senior/PWD"
          />
          <StatCard
            title="Discounts"
            value={`₱${(stats.totalDiscounts ?? 0).toFixed(2)}`}
            icon={Calendar}
            color="#a855f7"
          />
        </View>

        {/* Chart Section */}
        <View style={styles.sectionContainer}>
          <Text variant="titleMedium" style={styles.sectionHeader}>
            {view === "daily" || view === "weekly"
              ? "Daily Sales Trend (7 Days)"
              : view === "monthly"
                ? "Monthly Daily Trend"
                : "Selected Period Trend"}
          </Text>
          <View style={styles.chartWrapper}>
            {chartData.length > 0 ? (
              <BarChart
                data={chartData}
                barWidth={
                  chartData.length > 20 ? 8 : chartData.length > 10 ? 15 : 22
                }
                spacing={
                  chartData.length > 20 ? 4 : chartData.length > 10 ? 10 : 20
                }
                roundedTop
                roundedBottom
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: theme.colors.outline, fontSize: 10 }}
                noOfSections={3}
                maxValue={Math.max(...chartData.map((d) => d.value), 100) * 1.2}
                width={300}
                height={160}
                isAnimated
              />
            ) : (
              <Text>No Data</Text>
            )}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionContainer}>
          <Text variant="titleMedium" style={styles.sectionHeader}>
            Recent Transactions
          </Text>
          {db.sales.length > 0 ? (
            <View>
              {db.sales.slice(0, 5).map((item) => (
                <View key={item.id}>{renderItem({ item })}</View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Receipt size={32} color={theme.colors.outline} />
              <Text style={{ color: theme.colors.outline, marginTop: 8 }}>
                No recent sales
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ title, value, icon: Icon, color, subtitle }: any) {
  return (
    <Surface style={styles.statCard} elevation={1}>
      <View style={[styles.iconBox, { backgroundColor: color }]}>
        <Icon size={20} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          variant="labelSmall"
          style={{ color: "#6b7280" }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
          {value}
        </Text>
        {subtitle && (
          <Text variant="labelSmall" style={{ color: "#9ca3af", fontSize: 10 }}>
            {subtitle}
          </Text>
        )}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontWeight: "bold",
  },
  filterContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  segmentedButton: {
    maxWidth: 500,
    alignSelf: "center",
  },
  customRangeContainer: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  rangeRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  dateField: {
    gap: 4,
  },
  dateButton: {
    borderRadius: 8,
    minWidth: 140,
  },
  modalContainer: {
    padding: 20,
    alignItems: "center",
  },
  modalContent: {
    padding: 24,
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    gap: 16,
  },
  modalTitle: {
    fontWeight: "bold",
    textAlign: "center",
  },
  modalHint: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: -8,
  },
  inputGroup: {
    gap: 12,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  contentScroll: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  sectionHeader: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    overflow: "hidden",
  },
  saleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  saleInfo: {
    gap: 2,
  },
  saleActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
});
