import React, { useState } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  useWindowDimensions,
  Alert,
} from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { printAsync } from "expo-print";
import { generateReceiptHtml } from "../utils/receiptGenerator";
import { useDB } from "../context/DatabaseContext";
import { ProductGrid } from "../components/ProductGrid";
import { Cart, CartItemType } from "../components/Cart";
import { PaymentModal } from "../components/PaymentModal";
import { Product } from "../types/db";

export function SalesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { db, createSale, refreshData } = useDB();
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return { ...item, quantity: Math.max(0, newQty) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) =>
      prev.filter((item) => item.product.id !== productId),
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleCheckout = (details: any) => {
    setCheckoutData(details);
    setIsCheckoutOpen(true);
  };

  const handlePaymentComplete = async (
    paymentMethod: "cash" | "gcash",
    amountPaid: number,
    change: number,
  ) => {
    if (!checkoutData) return;

    try {
      const sale = await createSale({
        total_amount: checkoutData.subtotalInclusive,
        vat_amount: checkoutData.vatAmount,
        discount_amount: checkoutData.discountAmount,
        discount_type: checkoutData.discountType,
        final_amount: checkoutData.finalAmount,
        payment_method: paymentMethod,
        items: cartItems.map((item) => ({
          id: "", // Generated in hook
          sale_id: "",
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        })),
      });

      // Prepare receipt data
      const saleItems = cartItems.map((item) => ({
        id: "",
        sale_id: sale.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const html = generateReceiptHtml({
        items: saleItems,
        settings: db.settings,
        checkoutDetails: checkoutData,
        paymentMethod,
        cashReceived: amountPaid,
        change,
        timestamp: new Date(),
        transactionId: sale.id,
      });

      // Print
      await printAsync({
        html,
      });
    } catch (error) {
      console.error("Sale or Print failed", error);
      Alert.alert("Error", "Failed to complete transaction or print receipt.");
    }

    setCartItems([]);
    // Could show success toast here
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const { width } = useWindowDimensions();
  const isLandscape = width >= 768; // IPad / Tablet / Desktop breakpoint

  return (
    <View
      style={[
        styles.container,
        !isLandscape && styles.containerPortrait,
        { paddingTop: insets.top, backgroundColor: theme.colors.background },
      ]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background}
        translucent
      />
      <View
        style={[
          styles.leftPane,
          !isLandscape && styles.leftPanePortrait,
          { borderRightColor: theme.colors.outline },
          !isLandscape && { borderBottomColor: theme.colors.outline },
        ]}
      >
        <ProductGrid
          products={db.products}
          onAddToCart={handleAddToCart}
          refreshing={refreshing}
          onRefresh={onRefresh}
          bottomInset={insets.bottom}
        />
      </View>
      <View
        style={[styles.rightPane, !isLandscape && styles.rightPanePortrait]}
      >
        <Cart
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onCheckout={handleCheckout}
          settings={db.settings}
          bottomInset={insets.bottom}
        />
      </View>

      <PaymentModal
        visible={isCheckoutOpen}
        onDismiss={() => setIsCheckoutOpen(false)}
        checkoutDetails={checkoutData}
        settings={db.settings}
        onComplete={handlePaymentComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#fff", // Fallback, updated inline
  },
  containerPortrait: {
    flexDirection: "column",
  },
  leftPane: {
    flex: 2, // 66% width
    borderRightWidth: 1,
  },
  leftPanePortrait: {
    flex: 1,
    borderRightWidth: 0,
    borderBottomWidth: 1,
  },
  rightPane: {
    flex: 1, // 33% width
    maxWidth: 450,
  },
  rightPanePortrait: {
    flex: 0,
    maxWidth: "100%",
    height: "40%", // Take up bottom 40% on mobile
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
