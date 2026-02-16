import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  useWindowDimensions,
} from "react-native";
import { Searchbar, Text, useTheme } from "react-native-paper";
import { Product } from "../types/db";
import { ProductCard } from "./ProductCard";
import { CategoryFilter } from "./CategoryFilter";
import { Search, X } from "lucide-react-native";

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  bottomInset?: number;
}

export function ProductGrid({
  products,
  onAddToCart,
  refreshing,
  onRefresh,
  bottomInset = 0,
}: ProductGridProps) {
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

  const { width } = useWindowDimensions();

  // Dynamic columns:
  // < 600px: 2 columns
  // 600-900px: 3 columns
  // > 900px: 4 columns
  const numColumns = width < 600 ? 2 : width < 900 ? 3 : 4;
  const key = `grid-${numColumns}`; // Force re-render when columns change

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
        key={key}
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.gridItem,
              { flex: 1 / numColumns, maxWidth: `${100 / numColumns}%` },
            ]}
          >
            <ProductCard product={item} onPress={onAddToCart} />
          </View>
        )}
        numColumns={numColumns}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomInset + 20 },
        ]}
        columnWrapperStyle={styles.row}
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
    padding: 16,
    paddingBottom: 0,
    gap: 8,
  },
  searchBar: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },
  listContent: {
    padding: 10,
  },
  row: {
    justifyContent: "flex-start",
  },
  gridItem: {
    padding: 2,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
