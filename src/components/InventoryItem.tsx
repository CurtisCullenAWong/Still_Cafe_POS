import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { Text, Surface, IconButton, MD3Theme } from "react-native-paper";
import { Package, Edit, Trash2 } from "lucide-react-native";
import { Product } from "../types/db";

interface InventoryItemProps {
  item: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  theme: MD3Theme;
}

export const InventoryItem = React.memo(
  ({ item, onEdit, onDelete, theme }: InventoryItemProps) => {
    return (
      <Surface style={styles.itemContainer} elevation={0}>
        <View style={styles.itemImageContainer}>
          {item.image_uri ? (
            <Image source={{ uri: item.image_uri }} style={styles.itemImage} />
          ) : (
            <View
              style={[
                styles.imagePlaceholder,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <Package size={24} color={theme.colors.onSurfaceVariant} />
            </View>
          )}
        </View>
        <View style={styles.itemInfo}>
          <View style={styles.itemHeader}>
            <Text variant="titleMedium" style={styles.itemName}>
              {item.name}
            </Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: theme.colors.secondaryContainer },
              ]}
            >
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSecondaryContainer }}
              >
                {item.category}
              </Text>
            </View>
          </View>

          <View style={styles.itemStats}>
            <Text variant="bodyMedium">
              Price:{" "}
              <Text style={{ fontWeight: "bold" }}>
                ₱{(item.price ?? 0).toFixed(2)}
              </Text>
            </Text>
            <Text variant="bodyMedium">
              Stock:{" "}
              <Text
                style={{
                  fontWeight: "bold",
                  color:
                    item.stock_qty <= 10
                      ? theme.colors.error
                      : theme.colors.onSurface,
                }}
              >
                {item.stock_qty}
              </Text>
            </Text>
          </View>
        </View>

        <View style={styles.itemActions}>
          <IconButton
            icon={({ size, color }) => <Edit size={size} color={color} />}
            size={20}
            onPress={() => onEdit(item)}
          />
          <IconButton
            icon={({ size, color }) => (
              <Trash2 size={size} color={theme.colors.error} />
            )}
            size={20}
            onPress={() => onDelete(item)}
          />
        </View>
      </Surface>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.name === nextProps.item.name &&
      prevProps.item.category === nextProps.item.category &&
      prevProps.item.price === nextProps.item.price &&
      prevProps.item.stock_qty === nextProps.item.stock_qty &&
      prevProps.item.image_uri === nextProps.item.image_uri &&
      prevProps.theme.dark === nextProps.theme.dark
    );
  },
);

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 16, // Adds symmetric 16px spacing between Image, Info, and Actions
  },
  itemInfo: {
    flex: 1,
    gap: 8,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap", // Prevents overflow if name + badge is too long
    gap: 12,
  },
  itemName: {
    fontWeight: "600",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  itemStats: {
    flexDirection: "row",
    gap: 24,
  },
  itemActions: {
    flexDirection: "row",
    marginRight: -8,
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: "hidden",
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
