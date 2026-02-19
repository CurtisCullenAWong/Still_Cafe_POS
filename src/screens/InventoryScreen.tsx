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
import { useDatabaseContext } from "../context/DatabaseContext";
import { Product } from "../types/db";
import { ProductFormModal } from "../components/ProductFormModal";
import { InventoryItem } from "../components/InventoryItem";
import { Search, X, Package } from "lucide-react-native";

export function InventoryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { db, addProduct, updateProduct, deleteProduct, refreshData } =
    useDatabaseContext();
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

  const handleEdit = React.useCallback((product: Product) => {
    setEditingProduct(product);
    setModalVisible(true);
  }, []);

  const handleDelete = React.useCallback(
    (product: Product) => {
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
    },
    [deleteProduct],
  );

  const handleSave = (data: Omit<Product, "id" | "created_at">) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, data);
    } else {
      addProduct(data);
    }
  };

  const renderItem = React.useCallback(
    ({ item }: { item: Product }) => (
      <InventoryItem
        item={item}
        onEdit={handleEdit}
        onDelete={handleDelete}
        theme={theme}
      />
    ),
    [handleEdit, handleDelete, theme],
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text variant="titleLarge" style={styles.headerTitle}>
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
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
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
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 12,
  },
  headerTitle: {
    fontWeight: "bold",
  },
  searchBar: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
  },
  listContent: {
    padding: 12,
    paddingBottom: 100, // FAB space
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
