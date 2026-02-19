import React from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Text, Surface, useTheme } from "react-native-paper";
import { Product } from "../types/db";

interface ProductListItemProps {
  product: Product;
  onPress: (product: Product) => void;
  disabled?: boolean;
}

export const ProductListItem = React.memo(
  ({ product, onPress, disabled }: ProductListItemProps) => {
    const theme = useTheme();

    // Generate a placeholder initial
    const initial = product.name.charAt(0).toUpperCase();

    // Stock status
    const isLowStock = product.stock_qty <= 10;
    const isOutOfStock = product.stock_qty <= 0;

    return (
      <Surface
        style={[
          styles.container,
          { backgroundColor: theme.colors.surface },
          disabled && styles.disabled,
        ]}
        elevation={0} // Flatter look for list items
      >
        <TouchableOpacity
          style={styles.touchable}
          onPress={() => onPress(product)}
          disabled={disabled || isOutOfStock}
        >
          {/* Image / Placeholder */}
          <View
            style={[
              styles.imageContainer,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            {product.image_uri ? (
              <Image source={{ uri: product.image_uri }} style={styles.image} />
            ) : (
              <Text
                style={[
                  styles.initial,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {initial}
              </Text>
            )}
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            <View style={styles.textContainer}>
              <Text variant="titleMedium" numberOfLines={1} style={styles.name}>
                {product.name}
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.secondary }}
              >
                {product.category}
              </Text>
            </View>

            <View style={styles.rightContainer}>
              <Text
                variant="titleMedium"
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
        <View
          style={{
            height: 1,
            backgroundColor: theme.colors.outline,
            opacity: 0.1,
            marginLeft: 72,
          }}
        />
      </Surface>
    );
  },
  (prev, next) => {
    return (
      prev.product.id === next.product.id &&
      prev.product.name === next.product.name &&
      prev.product.price === next.product.price &&
      prev.product.stock_qty === next.product.stock_qty &&
      prev.product.image_uri === next.product.image_uri &&
      prev.disabled === next.disabled
    );
  },
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  touchable: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
  },
  disabled: {
    opacity: 0.6,
  },
  imageContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  initial: {
    fontSize: 20,
    fontWeight: "800",
    opacity: 0.3,
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    fontWeight: "600",
  },
  rightContainer: {
    alignItems: "flex-end",
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeSuccess: {
    backgroundColor: "#dcfce7",
  },
  badgeWarning: {
    backgroundColor: "#fef9c3",
  },
  badgeError: {
    backgroundColor: "#fee2e2",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#374151",
  },
});
