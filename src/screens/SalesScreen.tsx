import React, { useState } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  useWindowDimensions,
  Alert,
  Platform,
} from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { printAsync } from "expo-print";
import { generateReceiptHtml } from "../utils/receiptGenerator";
import { useDatabaseContext } from "../context/DatabaseContext";
import { ProductGrid } from "../components/ProductGrid";
import { ProductList } from "../components/ProductList";
import { Cart, CartItemType } from "../components/Cart";
import { PaymentModal } from "../components/PaymentModal";
import { Product } from "../types/db";

export function SalesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { db, createSale, refreshData } = useDatabaseContext();
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);

  const handleAddToCart = React.useCallback((product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      // Prepend new items so they appear at the top of the list
      return [{ product, quantity: 1 }, ...prev];
    });
  }, []);

  const handleUpdateQuantity = React.useCallback(
    (productId: string, delta: number) => {
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
    },
    [],
  );

  const handleRemoveItem = React.useCallback((productId: string) => {
    setCartItems((prev) =>
      prev.filter((item) => item.product.id !== productId),
    );
  }, []);

  const handleClearCart = React.useCallback(() => {
    setCartItems([]);
  }, []);

  const handleCheckout = React.useCallback((details: any) => {
    setCheckoutData(details);
    setIsCheckoutOpen(true);
  }, []);

  const handlePaymentComplete = React.useCallback(
    async (
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
          width: 576, // 80mm width in points at 180 DPI
        });
      } catch (error) {
        console.error("Sale or Print failed", error);
        Alert.alert(
          "Error",
          "Failed to complete transaction or print receipt.",
          [{ text: "OK" }],
        );
      }

      setCartItems([]);
      // Could show success toast here
    },
    [checkoutData, createSale, cartItems, db.settings],
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const { width, height: screenHeight } = useWindowDimensions();
  const isLandscape = width >= 768;

  // In a tab navigator, the bottom insets are already handled by the tab bar.
  // We use a small amount of internal padding instead.
  const bottomSpace = 8;

  return (
    <View
      style={[
        styles.container,
        !isLandscape && styles.containerPortrait,
        {
          paddingTop:
            Platform.OS === "android" ? StatusBar.currentHeight : insets.top,
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <View
        style={[
          styles.rightPane,
          !isLandscape && styles.rightPanePortrait,
          !isLandscape && { height: screenHeight * 0.45 }, // Slightly taller cart area on mobile
        ]}
      >
        <Cart
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onCheckout={handleCheckout}
          settings={db.settings}
          bottomInset={0} // No inset needed for top-anchored cart
        />
      </View>
      <View
        style={[
          styles.leftPane,
          !isLandscape && styles.leftPanePortrait,
          { borderRightColor: theme.colors.outline },
        ]}
      >
        {isLandscape ? (
          <ProductGrid
            products={db.products}
            onAddToCart={handleAddToCart}
            refreshing={refreshing}
            onRefresh={onRefresh}
            bottomInset={bottomSpace}
          />
        ) : (
          <ProductList
            products={db.products}
            onAddToCart={handleAddToCart}
            refreshing={refreshing}
            onRefresh={onRefresh}
            bottomInset={bottomSpace + 80} // Add extra padding for floating cart
          />
        )}
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
    backgroundColor: "white",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 10, // Ensure it sits above the grid
  },
});
