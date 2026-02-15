import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Surface, useTheme } from "react-native-paper";
import { Product } from "../types/db";

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  disabled?: boolean;
}

export function ProductCard({ product, onPress, disabled }: ProductCardProps) {
  const theme = useTheme();

  // Generate a placeholder initial for visual appeal
  const initial = product.name.charAt(0).toUpperCase();

  // Stock status styles
  const isLowStock = product.stock_qty <= 10;
  const isOutOfStock = product.stock_qty <= 0;

  return (
    <Surface
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface },
        disabled && styles.disabled,
      ]}
      elevation={1}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPress={() => onPress(product)}
        disabled={disabled || isOutOfStock}
      >
        <View
          style={[
            styles.imagePlaceholder,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor: theme.colors.outline,
            },
          ]}
        >
          <Text
            style={[styles.initial, { color: theme.colors.onSurfaceVariant }]}
          >
            {initial}
          </Text>
        </View>

        <View style={styles.content}>
          <Text variant="titleMedium" numberOfLines={1} style={styles.name}>
            {product.name}
          </Text>

          <View style={styles.footer}>
            <Text
              variant="titleSmall"
              style={{ color: theme.colors.primary, fontWeight: "bold" }}
            >
              ₱{(product.price ?? 0).toFixed(2)}
            </Text>

            <View
              style={[
                styles.badge,
                isOutOfStock
                  ? styles.badgeError
                  : isLowStock
                    ? styles.badgeWarning
                    : styles.badgeSuccess,
              ]}
            >
              <Text variant="labelSmall" style={styles.badgeText}>
                {product.stock_qty} left
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    margin: 6,
    flex: 1, // Expand to fill grid cell
    overflow: "hidden",
  },
  touchable: {
    padding: 12,
  },
  disabled: {
    opacity: 0.6,
  },
  imagePlaceholder: {
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
  },
  initial: {
    fontSize: 32,
    fontWeight: "800",
    opacity: 0.3,
  },
  content: {
    gap: 6,
  },
  name: {
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: -0.3,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeSuccess: {
    backgroundColor: "#dcfce7", // green-100
  },
  badgeWarning: {
    backgroundColor: "#fef9c3", // yellow-100
  },
  badgeError: {
    backgroundColor: "#fee2e2", // red-100
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151", // gray-700
  },
});
