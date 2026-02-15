import { useState, useEffect, useCallback } from "react";
import {
  Product,
  Category,
  Sale,
  Settings,
  DEFAULT_SETTINGS,
  SaleItem,
} from "../types/db";
import { Alert } from "react-native";
import {
  getDB,
  initDatabase,
  seedProductsFunc,
  seedCategoriesFunc,
} from "../services/database";
import { MOCK_PRODUCTS } from "../services/seedData";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";

// Simple ID generator fallback
const generateId = () => {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch (e) {
    // Fallback
  }
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

const showToast = (message: string) => {
  console.log(message);
};

export function useDatabase() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  const refreshData = useCallback(async () => {
    try {
      const db = await getDB();

      const productsResult = await db.getAllAsync<Product>(
        "SELECT * FROM products ORDER BY category, name",
      );
      setProducts(productsResult);

      const categoriesResult = await db.getAllAsync<Category>(
        "SELECT * FROM categories ORDER BY name",
      );
      setCategories(categoriesResult);

      const salesResult = await db.getAllAsync<Sale>(
        "SELECT * FROM sales ORDER BY created_at DESC",
      );

      const fullSales: Sale[] = [];
      for (const s of salesResult) {
        if (!s.id) continue;
        const items = await db.getAllAsync<SaleItem>(
          "SELECT * FROM sale_items WHERE sale_id = ?",
          s.id,
        );
        fullSales.push({ ...s, items });
      }
      setSales(fullSales);

      const settingsResult = await db.getFirstAsync<Settings>(
        "SELECT * FROM settings WHERE id = 1",
      );
      if (settingsResult) {
        setSettings(settingsResult);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        await initDatabase();
        const uniqueCategories = Array.from(
          new Set(MOCK_PRODUCTS.map((p) => p.category)),
        );
        await seedCategoriesFunc(uniqueCategories);
        await seedProductsFunc(MOCK_PRODUCTS);
        await refreshData();
        setLoaded(true);
      } catch (e: any) {
        console.error("Failed to load DB", e);
        Alert.alert("Error", `Failed to load database: ${e.message}`);
      }
    }
    init();
  }, [refreshData]);

  // Category Actions
  const addCategory = async (name: string) => {
    const db = await getDB();
    const newId = generateId();
    const createdAt = new Date().toISOString();
    try {
      await db.runAsync(
        "INSERT INTO categories (id, name, created_at) VALUES (?, ?, ?)",
        newId,
        name,
        createdAt,
      );
      await refreshData();
      showToast("Category added");
    } catch (e) {
      Alert.alert("Error", "Failed to add category");
    }
  };

  const updateCategory = async (id: string, name: string) => {
    const db = await getDB();
    try {
      await db.runAsync(
        "UPDATE categories SET name = ? WHERE id = ?",
        name,
        id,
      );
      await refreshData();
      showToast("Category updated");
    } catch (e) {
      Alert.alert("Error", "Failed to update category");
    }
  };

  const deleteCategory = async (id: string) => {
    const db = await getDB();
    try {
      await db.runAsync("DELETE FROM categories WHERE id = ?", id);
      await refreshData();
      showToast("Category deleted");
    } catch (e) {
      Alert.alert("Error", "Failed to delete category");
    }
  };

  // Inventory Actions
  const addProduct = async (product: Omit<Product, "id" | "created_at">) => {
    const db = await getDB();
    const newId = generateId();
    const createdAt = new Date().toISOString();
    try {
      await db.runAsync(
        "INSERT INTO products (id, category, name, price, stock_qty, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        newId,
        product.category,
        product.name,
        product.price,
        product.stock_qty,
        createdAt,
      );
      await refreshData();
      showToast("Product added");
    } catch (e) {
      Alert.alert("Error", "Failed to add product");
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const db = await getDB();
    try {
      const keys = Object.keys(updates);
      if (keys.length === 0) return;
      const setClause = keys.map((k) => `${k} = ?`).join(", ");
      const values = Object.values(updates);
      await db.runAsync(
        `UPDATE products SET ${setClause} WHERE id = ?`,
        ...values,
        id,
      );
      await refreshData();
      showToast("Product updated");
    } catch (e) {
      Alert.alert("Error", "Failed to update product");
    }
  };

  const deleteProduct = async (id: string) => {
    const db = await getDB();
    try {
      await db.runAsync("DELETE FROM products WHERE id = ?", id);
      await refreshData();
      showToast("Product deleted");
    } catch (e) {
      Alert.alert("Error", "Failed to delete product");
    }
  };

  // Sales Actions
  const createSale = async (saleData: Omit<Sale, "id" | "created_at">) => {
    const db = await getDB();
    const newSaleId = generateId();
    const createdAt = new Date().toISOString();

    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `INSERT INTO sales (id, total_amount, vat_amount, discount_amount, discount_type, final_amount, payment_method, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          newSaleId,
          saleData.total_amount,
          saleData.vat_amount,
          saleData.discount_amount,
          saleData.discount_type || null,
          saleData.final_amount,
          saleData.payment_method,
          createdAt,
        );

        for (const item of saleData.items) {
          const itemId = generateId();
          await db.runAsync(
            `INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, price)
             VALUES (?, ?, ?, ?, ?, ?)`,
            itemId,
            newSaleId,
            item.product_id,
            item.product_name,
            item.quantity,
            item.price,
          );

          await db.runAsync(
            `UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?`,
            item.quantity,
            item.product_id,
          );
        }
      });

      await refreshData();
      return { id: newSaleId, created_at: createdAt, ...saleData } as Sale;
    } catch (e) {
      Alert.alert("Error", "Failed to create sale");
      throw e;
    }
  };

  const deleteSale = async (id: string) => {
    const db = await getDB();
    try {
      await db.withTransactionAsync(async () => {
        const items = await db.getAllAsync<SaleItem>(
          "SELECT * FROM sale_items WHERE sale_id = ?",
          id,
        );
        for (const item of items) {
          await db.runAsync(
            "UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?",
            item.quantity,
            item.product_id,
          );
        }
        await db.runAsync("DELETE FROM sale_items WHERE sale_id = ?", id);
        await db.runAsync("DELETE FROM sales WHERE id = ?", id);
      });
      await refreshData();
      showToast("Sale voided");
    } catch (e) {
      Alert.alert("Error", "Failed to delete sale");
    }
  };

  // Settings
  const updateSettings = async (updates: Partial<Settings>) => {
    const db = await getDB();
    try {
      const keys = Object.keys(updates);
      if (keys.length === 0) return;
      const setClause = keys.map((k) => `${k} = ?`).join(", ");
      const values = Object.values(updates);
      await db.runAsync(
        `UPDATE settings SET ${setClause} WHERE id = 1`,
        ...values,
      );
      await refreshData();
      showToast("Settings updated");
    } catch (e) {
      Alert.alert("Error", "Failed to update settings");
    }
  };

  const exportBackup = async () => {
    try {
      const db = await getDB();

      // 1. Fetch all data explicitly including inventory columns
      const products = await db.getAllAsync<Product>("SELECT * FROM products");
      const categories = await db.getAllAsync<Category>(
        "SELECT * FROM categories",
      );
      const sales = await db.getAllAsync<Sale>("SELECT * FROM sales");
      const saleItems = await db.getAllAsync<SaleItem>(
        "SELECT * FROM sale_items",
      );
      const settings = await db.getFirstAsync<Settings>(
        "SELECT * FROM settings WHERE id = 1",
      );

      const backupData = {
        version: 1,
        timestamp: new Date().toISOString(),
        // Inventory is contained within the 'products' array (stock_qty)
        data: { products, categories, sales, sale_items: saleItems, settings },
      };

      const fileName = `pos_backup_${new Date().toISOString().split("T")[0]}.json`;
      const backupFile = new File(Paths.cache, fileName);

      backupFile.write(JSON.stringify(backupData, null, 2));

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(backupFile.uri, {
          mimeType: "application/json",
          dialogTitle: "Backup POS Data (Inventory Included)",
          UTI: "public.json",
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (e: any) {
      console.error("Backup failed", e);
      Alert.alert("Error", `Failed to create backup: ${e.message}`);
    }
  };

  const importBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const pickedFile = new File(result.assets[0].uri);
      const content = await pickedFile.text();

      let backup;
      try {
        backup = JSON.parse(content);
      } catch (e) {
        Alert.alert("Error", "Invalid backup file: Could not parse JSON");
        return;
      }

      // Validation: Ensure products (inventory) exist in the backup
      if (
        !backup.data ||
        !backup.version ||
        !Array.isArray(backup.data.products)
      ) {
        Alert.alert("Error", "Invalid backup format: Missing inventory data");
        return;
      }

      Alert.alert(
        "Confirm Restore",
        "This will DELETE all current inventory, sales, and categories, and replace them with the backup.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Restore",
            style: "destructive",
            onPress: async () => {
              const db = await getDB();
              try {
                await db.withTransactionAsync(async () => {
                  // 1. Clear existing data
                  await db.runAsync("DELETE FROM sale_items");
                  await db.runAsync("DELETE FROM sales");
                  await db.runAsync("DELETE FROM products");
                  await db.runAsync("DELETE FROM categories");

                  // 2. Restore Categories
                  for (const c of backup.data.categories) {
                    await db.runAsync(
                      "INSERT INTO categories (id, name, created_at) VALUES (?, ?, ?)",
                      [c.id, c.name, c.created_at],
                    );
                  }

                  // 3. Restore Products (INVENTORY)
                  // We default stock_qty to 0 if missing to prevent SQL errors
                  for (const p of backup.data.products) {
                    await db.runAsync(
                      "INSERT INTO products (id, category, name, price, stock_qty, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                      [
                        p.id,
                        p.category,
                        p.name,
                        p.price,
                        p.stock_qty ?? 0, // Ensure inventory count is preserved or defaults to 0
                        p.created_at,
                      ],
                    );
                  }

                  // 4. Restore Sales
                  for (const s of backup.data.sales) {
                    await db.runAsync(
                      "INSERT INTO sales (id, total_amount, vat_amount, discount_amount, discount_type, final_amount, payment_method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                      [
                        s.id,
                        s.total_amount,
                        s.vat_amount,
                        s.discount_amount,
                        s.discount_type,
                        s.final_amount,
                        s.payment_method,
                        s.created_at,
                      ],
                    );
                  }

                  // 5. Restore Sale Items
                  if (backup.data.sale_items) {
                    for (const item of backup.data.sale_items) {
                      await db.runAsync(
                        "INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?, ?)",
                        [
                          item.id,
                          item.sale_id,
                          item.product_id,
                          item.product_name,
                          item.quantity,
                          item.price,
                        ],
                      );
                    }
                  }

                  // 6. Restore Settings (Optional but recommended)
                  if (backup.data.settings) {
                    const s = backup.data.settings;
                    await db.runAsync(
                      "UPDATE settings SET store_name = ?, vat_percentage = ?, senior_discount_percentage = ?, pwd_discount_percentage = ? WHERE id = 1",
                      [
                        s.store_name,
                        s.vat_percentage,
                        s.senior_discount_percentage,
                        s.pwd_discount_percentage,
                      ],
                    );
                  }
                });

                await refreshData();
                Alert.alert(
                  "Success",
                  "Inventory and Sales data restored successfully",
                );
              } catch (e: any) {
                console.error("Restore failed", e);
                Alert.alert("Error", `Failed to restore data: ${e.message}`);
              }
            },
          },
        ],
      );
    } catch (e) {
      console.error("Import failed", e);
      Alert.alert("Error", "Failed to import backup");
    }
  };

  // Reports
  const getSalesReport = useCallback(async (startDate: Date, endDate: Date) => {
    const db = await getDB();
    try {
      const result = await db.getFirstAsync<any>(
        "SELECT SUM(final_amount) as totalSales, COUNT(id) as totalTransactions, SUM(vat_amount) as totalVat, SUM(discount_amount) as totalDiscounts FROM sales WHERE created_at BETWEEN ? AND ?",
        [startDate.toISOString(), endDate.toISOString()],
      );
      return {
        totalSales: result?.totalSales || 0,
        totalTransactions: result?.totalTransactions || 0,
        totalVat: result?.totalVat || 0,
        totalDiscounts: result?.totalDiscounts || 0,
      };
    } catch (e) {
      return {
        totalSales: 0,
        totalTransactions: 0,
        totalVat: 0,
        totalDiscounts: 0,
      };
    }
  }, []);

  const getSalesChartData = useCallback(async (days: number) => {
    const db = await getDB();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    try {
      return await db.getAllAsync<any>(
        "SELECT strftime('%Y-%m-%d', created_at) as date, SUM(final_amount) as total FROM sales WHERE created_at >= ? GROUP BY date ORDER BY date ASC",
        [startDate.toISOString()],
      );
    } catch (e) {
      return [];
    }
  }, []);

  const getRecentTransactions = useCallback(async (limit: number = 10) => {
    const db = await getDB();
    try {
      return await db.getAllAsync<Sale>(
        "SELECT * FROM sales ORDER BY created_at DESC LIMIT ?",
        [limit],
      );
    } catch (e) {
      return [];
    }
  }, []);

  return {
    db: { products, categories, sales, settings },
    loaded,
    addCategory,
    updateCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    createSale,
    deleteSale,
    updateSettings,
    exportBackup,
    importBackup,
    getSalesReport,
    getSalesChartData,
    getRecentTransactions,
    refreshData,
  };
}
