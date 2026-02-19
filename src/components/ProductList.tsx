import React, { useMemo } from "react";
import { View, StyleSheet, FlatList, useWindowDimensions } from "react-native";
import { Searchbar, Text, useTheme } from "react-native-paper";
import { Product } from "../types/db";
import { ProductListItem } from "./ProductListItem";
import { CategoryFilter } from "./CategoryFilter";
import { Search, X } from "lucide-react-native";

interface ProductListProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  bottomInset?: number;
}

export function ProductList({
  products,
  onAddToCart,
  refreshing,
  onRefresh,
  bottomInset = 0,
}: ProductListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const theme = useTheme();

  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.category))).sort(
      (a, b) => a.localeCompare(b),
    );
    return ["All", ...list];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch = p.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesCategory =
          selectedCategory === "All" || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, searchQuery, selectedCategory]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search products..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          elevation={0}
          icon={({ size, color }) => <Search size={size} color={color} />}
          clearIcon={({ size, color }) => <X size={size} color={color} />}
        />
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </View>

      <FlatList
        refreshing={refreshing}
        onRefresh={onRefresh}
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductListItem product={item} onPress={onAddToCart} />
        )}
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={5}
        removeClippedSubviews={true}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomInset + 20 },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={{ color: theme.colors.outline }}>
              No products found
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 12,
    paddingBottom: 0,
    gap: 8,
  },
  searchBar: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
