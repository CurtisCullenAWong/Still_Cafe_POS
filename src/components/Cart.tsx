import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from "react-native";
import {
  Text,
  Button,
  Divider,
  useTheme,
  Surface,
  IconButton,
} from "react-native-paper";
import { Product, Settings } from "../types/db";
import { CartItem as CartItemComponent } from "./CartItem";

export interface CartItemType {
  product: Product;
  quantity: number;
}

interface CartProps {
  items: CartItemType[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: (details: any) => void;
  settings: Settings;
  bottomInset?: number;
}

export function Cart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  settings,
  bottomInset = 0,
}: CartProps) {
  const theme = useTheme();
  const [discountType, setDiscountType] = React.useState<
    "senior" | "pwd" | null
  >(null);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const { width } = useWindowDimensions();
  const isLandscape = width >= 768;

  const calculations = useMemo(() => {
    const subtotalInclusive = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    let vatAmount = 0;
    let discountAmount = 0;
    let finalAmount = subtotalInclusive;
    let vatableSales = 0;
    let vatExemptSales = 0;

    if (discountType === "senior" || discountType === "pwd") {
      vatExemptSales = subtotalInclusive / (1 + settings.vat_percentage / 100);
      vatAmount = 0;
      const discountRate =
        discountType === "senior"
          ? settings.senior_discount_percentage
          : settings.pwd_discount_percentage;
      discountAmount = vatExemptSales * (discountRate / 100);
      finalAmount = vatExemptSales - discountAmount;
    } else {
      vatableSales = subtotalInclusive / (1 + settings.vat_percentage / 100);
      vatAmount = subtotalInclusive - vatableSales;
      discountAmount = 0;
      finalAmount = subtotalInclusive;
    }

    return {
      subtotalInclusive,
      vatAmount,
      discountAmount,
      finalAmount,
      vatableSales,
      vatExemptSales,
    };
  }, [items, discountType, settings]);

  const {
    subtotalInclusive,
    vatAmount,
    discountAmount,
    finalAmount,
    vatExemptSales,
  } = calculations;

  if (items.length === 0) {
    return (
      <View
        style={[
          styles.emptyContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Surface style={styles.emptySurface} elevation={0}>
          <IconButton
            icon="cart-outline"
            size={64}
            iconColor={theme.colors.outline}
          />
          <Text variant="titleMedium" style={{ color: theme.colors.outline }}>
            Cart is empty
          </Text>
        </Surface>
      </View>
    );
  }

  const renderTotals = () => (
    <View style={styles.totalsArea}>
      <View style={styles.row}>
        <Text variant="bodyMedium">Subtotal (VAT Inc)</Text>
        <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
          ₱{subtotalInclusive.toFixed(2)}
        </Text>
      </View>
      {discountType && (
        <View style={styles.row}>
          <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
            VAT Adjustment (Exempt)
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.error, fontWeight: "600" }}
          >
            -₱{(subtotalInclusive - vatExemptSales).toFixed(2)}
          </Text>
        </View>
      )}
      {!discountType && (
        <View style={styles.row}>
          <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
            Inclusive VAT ({settings.vat_percentage}%)
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
            ₱{vatAmount.toFixed(2)}
          </Text>
        </View>
      )}
      {discountAmount > 0 && (
        <View style={styles.row}>
          <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
            {discountType?.toUpperCase()} Discount
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.error, fontWeight: "600" }}
          >
            -₱{discountAmount.toFixed(2)}
          </Text>
        </View>
      )}
    </View>
  );

  const renderDiscountSelectors = () => (
    <View style={styles.discounts}>
      <Button
        mode={discountType === "senior" ? "contained" : "outlined"}
        onPress={() =>
          setDiscountType(discountType === "senior" ? null : "senior")
        }
        style={styles.discountBtn}
        compact
      >
        Senior
      </Button>
      <Button
        mode={discountType === "pwd" ? "contained" : "outlined"}
        onPress={() => setDiscountType(discountType === "pwd" ? null : "pwd")}
        style={styles.discountBtn}
        compact
      >
        PWD
      </Button>
    </View>
  );

  const mobileContent = (
    <View style={styles.mobileContainer}>
      {/* 1. Header Row (Top of pane) */}
      <View style={styles.headerArea}>
        <View style={styles.handle} />
        <View style={styles.headerTitleRow}>
          <Text variant="titleMedium" style={styles.headerTitle}>
            Current Order ({items.length})
          </Text>
          <Button
            mode="text"
            compact
            textColor={theme.colors.error}
            onPress={onClearCart}
          >
            Clear
          </Button>
        </View>
      </View>

      {/* 2. Scrollable Items Area (Starts immediately below header) */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
      >
        {items.map((item) => (
          <CartItemComponent
            key={item.product.id}
            product={item.product}
            quantity={item.quantity}
            onUpdateQuantity={onUpdateQuantity}
          />
        ))}
      </ScrollView>

      {/* 3. Footer Summary & Checkout (Fixed at bottom) */}
      <Surface style={styles.mobileFooter}>
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.7}
          style={styles.footerSummaryRow}
        >
          <View>
            <Text variant="labelSmall" style={{ opacity: 0.6 }}>
              AMOUNT DUE
            </Text>
            <Text
              variant="titleLarge"
              style={{ color: theme.colors.primary, fontWeight: "900" }}
            >
              ₱{finalAmount.toFixed(2)}
            </Text>
          </View>
          <Button
            mode="contained-tonal"
            onPress={() => setIsExpanded(!isExpanded)}
            icon={isExpanded ? "chevron-down" : "chevron-up"}
            contentStyle={{ flexDirection: "row-reverse" }}
          >
            {isExpanded ? "Hide Details" : "Details"}
          </Button>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.mobileExpandedArea}>
            <Divider style={{ marginVertical: 12 }} />
            {renderDiscountSelectors()}
            {renderTotals()}
          </View>
        )}

        <View
          style={[styles.checkoutActionRow, { paddingBottom: bottomInset + 8 }]}
        >
          <Button
            mode="contained"
            onPress={() => onCheckout({ ...calculations, discountType })}
            style={styles.mainActionBtn}
            contentStyle={{ height: 56 }}
            labelStyle={{ fontSize: 18, fontWeight: "900" }}
          >
            PLACE ORDER
          </Button>
        </View>
      </Surface>
    </View>
  );

  const landscapeContent = (
    <>
      <View
        style={[
          styles.landscapeHeader,
          { borderBottomColor: theme.colors.outline },
        ]}
      >
        <Text variant="titleLarge" style={styles.headerTitle}>
          Current Order
        </Text>
        <Button
          mode="text"
          textColor={theme.colors.error}
          onPress={onClearCart}
          compact
        >
          Clear
        </Button>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
      >
        {items.map((item) => (
          <CartItemComponent
            key={item.product.id}
            product={item.product}
            quantity={item.quantity}
            onUpdateQuantity={onUpdateQuantity}
          />
        ))}
      </ScrollView>

      <Surface
        style={[styles.landscapeFooter, { paddingBottom: bottomInset }]}
        elevation={4}
      >
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          style={styles.landscapeSummaryRow}
        >
          <Text variant="titleMedium">Total: ₱{finalAmount.toFixed(2)}</Text>
          <IconButton
            icon={isExpanded ? "chevron-down" : "chevron-up"}
            onPress={() => setIsExpanded(!isExpanded)}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={{ padding: 16, paddingTop: 0 }}>
            {renderDiscountSelectors()}
            {renderTotals()}
          </View>
        )}

        <View style={{ padding: 16 }}>
          <Button
            mode="contained"
            onPress={() => onCheckout({ ...calculations, discountType })}
            style={styles.mainActionBtn}
            contentStyle={{ height: 52 }}
          >
            Checkout
          </Button>
        </View>
      </Surface>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {isLandscape ? landscapeContent : mobileContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptySurface: {
    alignItems: "center",
    padding: 32,
    borderRadius: 24,
    backgroundColor: "transparent",
  },
  // Mobile Vertical Styles
  mobileContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  headerArea: {
    padding: 12,
    paddingTop: 8,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginBottom: 8,
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  mobileFooter: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 12,
  },
  footerSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  mobileExpandedArea: {
    paddingBottom: 16,
  },
  checkoutActionRow: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  // Landscape Styles
  landscapeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: "bold",
  },
  landscapeFooter: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "white",
  },
  landscapeSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  // Common
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  totalsArea: {
    gap: 8,
  },
  discounts: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  discountBtn: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mainActionBtn: {
    borderRadius: 16,
  },
});
