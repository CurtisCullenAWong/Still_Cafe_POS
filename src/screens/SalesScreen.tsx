import React, { useState } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  useWindowDimensions,
  Alert,
  Platform,
  TouchableOpacity,
} from "react-native";
import {
  useTheme,
  Portal,
  Modal,
  Surface,
  Button,
  Text,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { generateReceiptHtml, printHtml } from "../utils/receiptGenerator";
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
        await printHtml(html);
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

  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const totalCartItems = React.useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );

  const totalCartSubtotal = React.useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      ),
    [cartItems],
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const { width } = useWindowDimensions();
  const isLandscape = width >= 768;
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

      {/* Main Product Area */}
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
            bottomInset={totalCartItems > 0 ? 80 : bottomSpace}
          />
        )}
      </View>

      {/* Right Cart Pane (Tablet & Desktop only) */}
      {isLandscape && (
        <View style={styles.rightPane}>
          <Cart
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onCheckout={handleCheckout}
            settings={db.settings}
            bottomInset={0}
          />
        </View>
      )}

      {/* Floating Cart Bar (Mobile only) */}
      {!isLandscape && totalCartItems > 0 && (
        <Surface style={styles.floatingCartBar} elevation={4}>
          <TouchableOpacity
            style={styles.floatingCartTouch}
            onPress={() => setIsMobileCartOpen(true)}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.badgeContainer,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={styles.badgeText}>{totalCartItems}</Text>
            </View>
            <View style={styles.floatingCartTextGroup}>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.outline, fontWeight: "600" }}
              >
                CURRENT ORDER
              </Text>
              <Text
                variant="titleMedium"
                style={{ fontWeight: "800", color: theme.colors.primary }}
              >
                ₱{totalCartSubtotal.toFixed(2)}
              </Text>
            </View>
            <Button
              mode="contained"
              onPress={() => setIsMobileCartOpen(true)}
              style={{ borderRadius: 12 }}
              contentStyle={{ height: 40, paddingHorizontal: 12 }}
            >
              View Cart
            </Button>
          </TouchableOpacity>
        </Surface>
      )}

      {/* Mobile Cart Sheet Modal */}
      {!isLandscape && (
        <Portal>
          <Modal
            visible={isMobileCartOpen}
            onDismiss={() => setIsMobileCartOpen(false)}
            contentContainerStyle={styles.mobileCartModalContainer}
          >
            <Cart
              items={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onCheckout={(details) => {
                setIsMobileCartOpen(false);
                handleCheckout(details);
              }}
              settings={db.settings}
              onClose={() => setIsMobileCartOpen(false)}
            />
          </Modal>
        </Portal>
      )}

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
    backgroundColor: "#fff",
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
  },
  rightPane: {
    flex: 1, // 33% width
    maxWidth: 450,
  },
  floatingCartBar: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  floatingCartTouch: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  badgeContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  floatingCartTextGroup: {
    flex: 1,
  },
  mobileCartModalContainer: {
    flex: 1,
    marginTop: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
});

