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
import { getDB, initDatabase } from "../services/database";
import * as FileSystem from "expo-file-system/legacy";
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

export function useDB() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  const refreshData = useCallback(async () => {
    try {
      const db = await getDB();

      const productsResult = await db.getAllAsync<Product>(
        "SELECT * FROM products ORDER BY name",
        [],
      );
      setProducts(productsResult);

      const categoriesResult = await db.getAllAsync<Category>(
        "SELECT * FROM categories ORDER BY name",
        [],
      );
      setCategories(categoriesResult);

      const salesResult = await db.getAllAsync<Sale>(
        "SELECT * FROM sales ORDER BY created_at DESC",
        [],
      );

      const fullSales: Sale[] = [];
      for (const s of salesResult) {
        if (!s.id) continue;
        const items = await db.getAllAsync<SaleItem>(
          "SELECT * FROM sale_items WHERE sale_id = ?",
          [s.id],
        );
        fullSales.push({ ...s, items });
      }
      setSales(fullSales);

      const settingsResult = await db.getFirstAsync<Settings>(
        "SELECT * FROM settings WHERE id = 1",
        [],
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
  const addCategory = useCallback(
    async (name: string) => {
      const db = await getDB();
      const newId = generateId();
      const createdAt = new Date().toISOString();
      try {
        await db.runAsync(
          "INSERT INTO categories (id, name, created_at) VALUES (?, ?, ?)",
          [newId, name, createdAt],
        );
        await refreshData();
        showToast("Category added");
      } catch (e) {
        Alert.alert("Error", "Failed to add category");
      }
    },
    [refreshData],
  );

  const updateCategory = useCallback(
    async (id: string, name: string) => {
      const db = await getDB();
      try {
        await db.runAsync("UPDATE categories SET name = ? WHERE id = ?", [
          name,
          id,
        ]);
        await refreshData();
        showToast("Category updated");
      } catch (e) {
        Alert.alert("Error", "Failed to update category");
      }
    },
    [refreshData],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      const db = await getDB();
      try {
        await db.runAsync("DELETE FROM categories WHERE id = ?", [id]);
        await refreshData();
        showToast("Category deleted");
      } catch (e) {
        Alert.alert("Error", "Failed to delete category");
      }
    },
    [refreshData],
  );

  // Inventory Actions
  const addProduct = useCallback(
    async (product: Omit<Product, "id" | "created_at">) => {
      const db = await getDB();
      const newId = generateId();
      const createdAt = new Date().toISOString();
      try {
        await db.runAsync(
          "INSERT INTO products (id, category, name, price, stock_qty, image_uri, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            newId,
            product.category,
            product.name,
            product.price,
            product.stock_qty,
            product.image_uri || null,
            createdAt,
          ],
        );
        await refreshData();
        showToast("Product added");
      } catch (e) {
        Alert.alert("Error", "Failed to add product");
      }
    },
    [refreshData],
  );

  const updateProduct = useCallback(
    async (id: string, updates: Partial<Product>) => {
      const db = await getDB();
      try {
        const keys = Object.keys(updates);
        if (keys.length === 0) return;
        const setClause = keys.map((k) => `${k} = ?`).join(", ");
        const values = Object.values(updates).map((v) =>
          v === undefined ? null : v,
        );
        await db.runAsync(`UPDATE products SET ${setClause} WHERE id = ?`, [
          ...values,
          id,
        ]);
        await refreshData();
        showToast("Product updated");
      } catch (e) {
        Alert.alert("Error", "Failed to update product");
      }
    },
    [refreshData],
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      const db = await getDB();
      try {
        const dependency = await db.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) as count FROM sale_items WHERE product_id = ?",
          [id],
        );

        if (dependency && dependency.count > 0) {
          Alert.alert(
            "Cannot Delete",
            "This product is part of existing sales records. You cannot delete it to preserve sales history.",
          );
          return;
        }

        await db.runAsync("DELETE FROM products WHERE id = ?", [id]);
        await refreshData();
        showToast("Product deleted");
      } catch (e: any) {
        console.error("Delete error", e);
        Alert.alert("Error", `Failed to delete product: ${e.message}`);
      }
    },
    [refreshData],
  );

  // Sales Actions
  const createSale = useCallback(
    async (saleData: Omit<Sale, "id" | "created_at">) => {
      const db = await getDB();
      const newSaleId = generateId();
      const createdAt = new Date().toISOString();

      try {
        await db.withTransactionAsync(async () => {
          await db.runAsync(
            `INSERT INTO sales (id, total_amount, vat_amount, discount_amount, discount_type, final_amount, payment_method, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newSaleId,
              saleData.total_amount,
              saleData.vat_amount,
              saleData.discount_amount,
              saleData.discount_type || null,
              saleData.final_amount,
              saleData.payment_method,
              createdAt,
            ],
          );

          for (const item of saleData.items) {
            const itemId = generateId();
            await db.runAsync(
              `INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, price)
              VALUES (?, ?, ?, ?, ?, ?)`,
              [
                itemId,
                newSaleId,
                item.product_id,
                item.product_name,
                item.quantity,
                item.price,
              ],
            );

            await db.runAsync(
              `UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?`,
              [item.quantity, item.product_id],
            );
          }
        });

        await refreshData();
        return { id: newSaleId, created_at: createdAt, ...saleData } as Sale;
      } catch (e) {
        Alert.alert("Error", "Failed to create sale");
        throw e;
      }
    },
    [refreshData],
  );

  const deleteSale = useCallback(
    async (id: string) => {
      const db = await getDB();
      try {
        await db.withTransactionAsync(async () => {
          const items = await db.getAllAsync<SaleItem>(
            "SELECT * FROM sale_items WHERE sale_id = ?",
            [id],
          );
          for (const item of items) {
            await db.runAsync(
              "UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?",
              [item.quantity, item.product_id],
            );
          }
          await db.runAsync("DELETE FROM sale_items WHERE sale_id = ?", [id]);
          await db.runAsync("DELETE FROM sales WHERE id = ?", [id]);
        });
        await refreshData();
        showToast("Sale voided");
      } catch (e) {
        Alert.alert("Error", "Failed to delete sale");
      }
    },
    [refreshData],
  );

  // Settings
  const updateSettings = useCallback(
    async (updates: Partial<Settings>) => {
      const db = await getDB();
      try {
        const keys = Object.keys(updates);
        if (keys.length === 0) return;
        const setClause = keys.map((k) => `${k} = ?`).join(", ");

        // Ensure no undefined values slip through the bridge
        const values = Object.values(updates).map((v) =>
          v === undefined ? null : v,
        );

        await db.runAsync(
          `UPDATE settings SET ${setClause} WHERE id = 1`,
          values,
        );
        await refreshData();
        showToast("Settings updated");
      } catch (e) {
        Alert.alert("Error", "Failed to update settings");
      }
    },
    [refreshData],
  );

  const exportBackup = useCallback(async () => {
    try {
      const db = await getDB();

      const products = await db.getAllAsync<Product>(
        "SELECT * FROM products",
        [],
      );
      const categories = await db.getAllAsync<Category>(
        "SELECT * FROM categories",
        [],
      );
      const sales = await db.getAllAsync<Sale>("SELECT * FROM sales", []);
      const saleItems = await db.getAllAsync<SaleItem>(
        "SELECT * FROM sale_items",
        [],
      );
      const settings = await db.getFirstAsync<Settings>(
        "SELECT * FROM settings WHERE id = 1",
        [],
      );

      const backupData = {
        version: 1,
        timestamp: new Date().toISOString(),
        data: { products, categories, sales, sale_items: saleItems, settings },
      };

      const fileName = `pos_backup_${new Date().toISOString().split("T")[0]}.json`;
      const fileUri = FileSystem.cacheDirectory + fileName;

      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(backupData, null, 2),
      );

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
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
  }, []);

  const importBackup = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const content = await FileSystem.readAsStringAsync(result.assets[0].uri);

      let backup;
      try {
        backup = JSON.parse(content);
      } catch (e) {
        Alert.alert("Error", "Invalid backup file: Could not parse JSON");
        return;
      }

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
                  await db.runAsync("DELETE FROM sale_items", []);
                  await db.runAsync("DELETE FROM sales", []);
                  await db.runAsync("DELETE FROM products", []);
                  await db.runAsync("DELETE FROM categories", []);

                  for (const c of backup.data.categories) {
                    await db.runAsync(
                      "INSERT INTO categories (id, name, created_at) VALUES (?, ?, ?)",
                      [c.id, c.name, c.created_at],
                    );
                  }

                  for (const p of backup.data.products) {
                    await db.runAsync(
                      "INSERT INTO products (id, category, name, price, stock_qty, image_uri, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                      [
                        p.id,
                        p.category,
                        p.name,
                        p.price,
                        p.stock_qty ?? 0,
                        p.image_uri || null,
                        p.created_at,
                      ],
                    );
                  }

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
  }, [refreshData]);

  // Reports
  const getSalesReport = useCallback(async (startDate: Date, endDate: Date) => {
    const db = await getDB();
    try {
      const result = await db.getFirstAsync<any>(
        `SELECT 
            SUM(final_amount) as totalSales, 
            COUNT(id) as totalTransactions, 
            SUM(vat_amount) as totalVat, 
            SUM(discount_amount) as totalDiscounts,
            SUM(total_amount) as grossSales,
            SUM(CASE WHEN vat_amount > 0 THEN total_amount ELSE 0 END) as vatableGross,
            SUM(CASE WHEN vat_amount = 0 AND discount_type IS NOT NULL THEN total_amount ELSE 0 END) as exemptGross
           FROM sales WHERE created_at BETWEEN ? AND ?`,
        [startDate.toISOString(), endDate.toISOString()],
      );

      return {
        totalSales: result?.totalSales || 0,
        grossSales: result?.grossSales || 0,
        totalTransactions: result?.totalTransactions || 0,
        totalVat: result?.totalVat || 0,
        totalDiscounts: result?.totalDiscounts || 0,
        vatableGross: result?.vatableGross || 0,
        exemptGross: result?.exemptGross || 0,
      };
    } catch (e) {
      console.error("Report Error", e);
      return {
        totalSales: 0,
        grossSales: 0,
        totalTransactions: 0,
        totalVat: 0,
        totalDiscounts: 0,
        vatableGross: 0,
        exemptGross: 0,
      };
    }
  }, []);

  const getSalesChartData = useCallback(
    async (startDate: Date, endDate: Date) => {
      const db = await getDB();
      try {
        return await db.getAllAsync<any>(
          "SELECT strftime('%Y-%m-%d', created_at) as date, SUM(final_amount) as total FROM sales WHERE created_at BETWEEN ? AND ? GROUP BY date ORDER BY date ASC",
          [startDate.toISOString(), endDate.toISOString()],
        );
      } catch (e) {
        console.error("Chart Error", e);
        return [];
      }
    },
    [],
  );

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
