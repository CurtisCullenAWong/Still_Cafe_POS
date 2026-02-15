import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, IconButton, Surface, useTheme } from "react-native-paper";
import { Product } from "../types/db";
import { Plus, Minus } from "lucide-react-native";

interface CartItemProps {
  product: Product;
  quantity: number;
  onUpdateQuantity: (productId: string, delta: number) => void;
}

export function CartItem({
  product,
  quantity,
  onUpdateQuantity,
}: CartItemProps) {
  const theme = useTheme();

  return (
    <Surface style={styles.container} elevation={0}>
      <View style={styles.info}>
        <Text variant="bodyLarge" style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
          ₱{(product.price ?? 0).toFixed(2)}
        </Text>
      </View>

      <View style={styles.controls}>
        <View
          style={[
            styles.counter,
            { backgroundColor: theme.colors.secondaryContainer },
          ]}
        >
          <IconButton
            icon={({ size, color }) => <Minus size={size} color={color} />}
            size={16}
            onPress={() => onUpdateQuantity(product.id, -1)}
            style={styles.iconBtn}
          />
          <Text variant="labelLarge" style={styles.qty}>
            {quantity}
          </Text>
          <IconButton
            icon={({ size, color }) => <Plus size={size} color={color} />}
            size={16}
            onPress={() => onUpdateQuantity(product.id, 1)}
            style={styles.iconBtn}
          />
        </View>

        <Text variant="titleMedium" style={styles.total}>
          ₱{((product.price ?? 0) * quantity).toFixed(2)}
        </Text>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderRadius: 8,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    flexDirection: "row",
    alignItems: "center",
  },
  info: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 2,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    padding: 0,
    backgroundColor: "#f3f4f6",
  },
  iconBtn: {
    margin: 0,
    width: 32,
    height: 32,
  },
  qty: {
    width: 20,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 14,
  },
  total: {
    width: 60, // Fixed width for alignment
    textAlign: "right",
    fontWeight: "700",
    fontSize: 14,
  },
});
