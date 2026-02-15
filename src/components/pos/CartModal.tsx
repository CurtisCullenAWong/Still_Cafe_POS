import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { CartItem } from "../../types/pos";
import { THEME, RADIUS } from "../../styles/theme";
import { X, Minus, Plus, Trash2 } from "lucide-react-native";
import { Button } from "../ui/Button";

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  total: number;
}

export function CartModal({
  visible,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  total,
}: CartModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Current Order</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color={THEME.foreground} size={24} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.product.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product.name}</Text>
                <Text style={styles.itemPrice}>
                  ₱{item.product.price.toFixed(2)}
                </Text>
              </View>

              <View style={styles.controls}>
                <TouchableOpacity
                  onPress={() => onRemoveItem(item.product.id)}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={18} color={THEME.destructive} />
                </TouchableOpacity>

                <View style={styles.quantityControl}>
                  <TouchableOpacity
                    onPress={() => onUpdateQuantity(item.product.id, -1)}
                    style={styles.qtyBtn}
                  >
                    <Minus size={16} color={THEME.foreground} />
                  </TouchableOpacity>

                  <Text style={styles.qtyText}>{item.quantity}</Text>

                  <TouchableOpacity
                    onPress={() => onUpdateQuantity(item.product.id, 1)}
                    style={styles.qtyBtn}
                  >
                    <Plus size={16} color={THEME.foreground} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Cart is empty</Text>
            </View>
          }
        />

        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₱{total.toFixed(2)}</Text>
          </View>
          <Button
            label="Checkout"
            onPress={onCheckout}
            disabled={items.length === 0}
            size="lg"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: THEME.foreground,
  },
  closeButton: {
    padding: 4,
  },
  listContent: {
    padding: 16,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: THEME.card,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.foreground,
  },
  itemPrice: {
    fontSize: 14,
    color: THEME.mutedForeground,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  deleteBtn: {
    padding: 8,
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.inputBackground,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  qtyBtn: {
    padding: 8,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: "600",
    minWidth: 24,
    textAlign: "center",
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: THEME.mutedForeground,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    backgroundColor: THEME.card,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "500",
    color: THEME.mutedForeground,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: THEME.primary,
  },
});
