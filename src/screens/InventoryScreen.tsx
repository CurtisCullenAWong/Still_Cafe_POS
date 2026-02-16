import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  StatusBar,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Text,
  FAB,
  Searchbar,
  Surface,
  IconButton,
  useTheme,
  Button,
} from "react-native-paper";
import { useDB } from "../context/DatabaseContext";
import { Product } from "../types/db";
import { ProductFormModal } from "../components/ProductFormModal";
import { Search, X, Edit, Trash2, Package } from "lucide-react-native";

export function InventoryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { db, addProduct, updateProduct, deleteProduct, refreshData } = useDB();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(
    undefined,
  );

  const filteredProducts = useMemo(() => {
    return db.products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [db.products, searchQuery]);

  const handleAdd = () => {
    setEditingProduct(undefined);
    setModalVisible(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setModalVisible(true);
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteProduct(product.id),
        },
      ],
    );
  };

  const handleSave = (data: Omit<Product, "id" | "created_at">) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, data);
    } else {
      addProduct(data);
    }
  };

  const renderItem = ({ item }: { item: Product }) => (
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
          onPress={() => handleEdit(item)}
        />
        <IconButton
          icon={({ size, color }) => (
            <Trash2 size={size} color={theme.colors.error} />
          )}
          size={20}
          onPress={() => handleDelete(item)}
        />
      </View>
    </Surface>
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent />
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Inventory Management
        </Text>
        <Searchbar
          placeholder="Search items..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          elevation={0}
          icon={({ size, color }) => <Search size={size} color={color} />}
          clearIcon={({ size, color }) => <X size={size} color={color} />}
        />
      </View>

      <FlatList
        refreshing={refreshing}
        onRefresh={onRefresh}
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 100 + insets.bottom },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Package size={48} color={theme.colors.outline} />
            <Text
              variant="bodyLarge"
              style={{ color: theme.colors.outline, marginTop: 16 }}
            >
              No items found
            </Text>
            <Button
              mode="contained"
              onPress={handleAdd}
              style={{ marginTop: 24 }}
            >
              Add First Product
            </Button>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={handleAdd}
        label="Add Product"
      />

      <ProductFormModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        onSubmit={handleSave}
        initialData={editingProduct}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    padding: 24,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 16,
  },
  headerTitle: {
    fontWeight: "bold",
  },
  searchBar: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // FAB space
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    // Border
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  itemInfo: {
    flex: 1,
    gap: 8,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 16,
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
  fab: {
    position: "absolute",
    margin: 24,
    right: 0,
    bottom: 0,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
  },
});
