import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
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
import {
  Trash2,
  Plus,
  Minus,
  User,
  Accessibility,
  X,
} from "lucide-react-native";

// Define locally since it's used in state
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
      // For Senior/PWD:
      // 1. Remove VAT first (Sales / 1.12)
      vatExemptSales = subtotalInclusive / (1 + settings.vat_percentage / 100);
      vatAmount = 0;

      // 2. Apply 20% discount on the VAT-exempt amount
      const discountRate =
        discountType === "senior"
          ? settings.senior_discount_percentage
          : settings.pwd_discount_percentage;
      discountAmount = vatExemptSales * (discountRate / 100);

      // 3. Final amount is VAT-exempt amount minus the discount
      finalAmount = vatExemptSales - discountAmount;
    } else {
      // Normal transaction
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

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderLeftColor: theme.colors.outline,
        },
      ]}
    >
      <View
        style={[styles.header, { borderBottomColor: theme.colors.outline }]}
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
        style={[
          styles.footer,
          {
            paddingBottom: 24 + bottomInset,
            backgroundColor: theme.colors.surface,
          },
        ]}
        elevation={4}
      >
        <View style={styles.discounts}>
          <Button
            mode={discountType === "senior" ? "contained" : "outlined"}
            onPress={() =>
              setDiscountType(discountType === "senior" ? null : "senior")
            }
            style={styles.discountBtn}
            compact
          >
            Senior (20%)
          </Button>
          <Button
            mode={discountType === "pwd" ? "contained" : "outlined"}
            onPress={() =>
              setDiscountType(discountType === "pwd" ? null : "pwd")
            }
            style={styles.discountBtn}
            compact
          >
            PWD (20%)
          </Button>
        </View>

        <View style={styles.totals}>
          <View style={styles.row}>
            <Text variant="bodyMedium">Gross Amount (VAT Inc)</Text>
            <Text variant="bodyMedium">
              ₱{(subtotalInclusive ?? 0).toFixed(2)}
            </Text>
          </View>

          {discountType && (
            <View style={styles.row}>
              <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
                VAT Adjustment (Exempt)
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
                -₱{(subtotalInclusive - vatExemptSales).toFixed(2)}
              </Text>
            </View>
          )}

          {!discountType && (
            <View style={styles.row}>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.secondary }}
              >
                Inclusive VAT (12%)
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.secondary }}
              >
                ₱{(vatAmount ?? 0).toFixed(2)}
              </Text>
            </View>
          )}

          {discountAmount > 0 && (
            <View style={styles.row}>
              <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
                {discountType === "senior" ? "Senior" : "PWD"} Discount (20%)
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
                -₱{(discountAmount ?? 0).toFixed(2)}
              </Text>
            </View>
          )}
          <Divider
            style={[styles.divider, { backgroundColor: theme.colors.outline }]}
          />
          <View style={styles.row}>
            <Text variant="titleLarge" style={styles.totalLabel}>
              Total
            </Text>
            <Text
              variant="headlineSmall"
              style={[styles.totalValue, { color: theme.colors.primary }]}
            >
              ₱{(finalAmount ?? 0).toFixed(2)}
            </Text>
          </View>
        </View>

        <Button
          mode="contained"
          onPress={() => onCheckout({ ...calculations, discountType })}
          style={styles.checkoutBtn}
          contentStyle={{ height: 56 }}
          labelStyle={{ fontSize: 18, fontWeight: "bold" }}
        >
          Checkout
        </Button>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderLeftWidth: 1,
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  footer: {
    padding: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  discounts: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  discountBtn: {
    flex: 1,
    borderRadius: 12,
  },
  totals: {
    gap: 10,
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: {
    marginVertical: 12,
  },
  totalLabel: {
    fontWeight: "800",
    fontSize: 20,
  },
  totalValue: {
    fontWeight: "900",
    fontSize: 24,
  },
  checkoutBtn: {
    borderRadius: 16,
  },
});
