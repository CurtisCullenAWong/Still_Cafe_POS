import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Product } from "../../types/db";
import { THEME, RADIUS } from "../../styles/theme";
import { Plus } from "lucide-react-native";

interface ProductItemProps {
  product: Product;
  onPress: (product: Product) => void;
}

export function ProductItem({ product, onPress }: ProductItemProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(product)}
      activeOpacity={0.7}
    >
      <View style={styles.imagePlaceholder}>
        <Text style={styles.initial}>{product.name.charAt(0)}</Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>₱{product.price.toFixed(2)}</Text>
        <View style={styles.stockBadge}>
          <Text style={styles.stockText}>{product.stock_qty} left</Text>
        </View>
      </View>
      <View style={styles.addButton}>
        <Plus size={20} color={THEME.primaryForeground} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.card,
    borderRadius: RADIUS.lg,
    padding: 12,
    margin: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: THEME.border,
    position: "relative",
    minHeight: 160,
  },
  imagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  initial: {
    fontSize: 18,
    fontWeight: "bold",
    color: THEME.secondaryForeground,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.cardForeground,
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: "500",
    color: THEME.mutedForeground,
  },
  stockBadge: {
    marginTop: 6,
    backgroundColor: THEME.muted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  stockText: {
    fontSize: 10,
    color: THEME.mutedForeground,
  },
  addButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: THEME.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
