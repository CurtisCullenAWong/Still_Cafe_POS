import { useState, useCallback, useEffect } from "react";
import {
  Product,
  Sale,
  Settings,
  DEFAULT_SETTINGS,
  SaleItem,
} from "../types/db";
import { getDB, initDatabase, seedProductsFunc } from "../services/database";

const MOCK_PRODUCTS: Product[] = [
  // --- Espresso-Based ---
  {
    id: "1",
    category: "Espresso-Based",
    name: "Americano",
    price: 80,
    stock_qty: 50,
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    category: "Espresso-Based",
    name: "Café Latte",
    price: 100,
    stock_qty: 50,
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    category: "Espresso-Based",
    name: "Cappuccino",
    price: 100,
    stock_qty: 50,
    created_at: new Date().toISOString(),
  },
  {
    id: "4",
    category: "Espresso-Based",
    name: "Mocha",
    price: 130,
    stock_qty: 50,
    created_at: new Date().toISOString(),
  },
  {
    id: "5",
    category: "Espresso-Based",
    name: "White Chocolate Mocha",
    price: 130,
    stock_qty: 50,
    created_at: new Date().toISOString(),
  },
  {
    id: "6",
    category: "Espresso-Based",
    name: "Caramel Macchiatto",
    price: 140,
    stock_qty: 50,
    created_at: new Date().toISOString(),
  },
  {
    id: "7",
    category: "Espresso-Based",
    name: "Spanish Latte",
    price: 120,
    stock_qty: 50,
    created_at: new Date().toISOString(),
  },
  {
    id: "8",
    category: "Espresso-Based",
    name: "Vietnamese Latte",
    price: 120,
    stock_qty: 50,
    created_at: new Date().toISOString(),
  },

  // --- Special Drinks ---
  {
    id: "9",
    category: "Special Drinks",
    name: "Iced Triple Kick",
    price: 150,
    stock_qty: 50,
    created_at: new Date().toISOString(),
  },
  {
    id: "10",
    category: "Special Drinks",
    name: "Iced Sea Salt Latte",
    price: 130,
    stock_qty: 50,
    created_at: new Date().toISOString(),
  },

  // --- Non-Espresso ---
  {
    id: "11",
    category: "Non-Espresso",
    name: "Iced Matcha Latte",
    price: 130,
    stock_qty: 50,
    created_at: new Date().toISOString(),
  },
  {
    id: "12",
    category: "Non-Espresso",
    name: "Iced Chocolate",
    price: 130,
    stock_qty: 50,
    created_at: new Date().toISOString(),
  },
  {
    id: "13",
    category: "Non-Espresso",
    name: "Still Iced Tea",
    price: 110,
    stock_qty: 50,
    created_at: new Date().toISOString(),
  },

  // --- Coffee-Based Frappe ---
  {
    id: "14",
    category: "Coffee-Based Frappe",
    name: "Java Chip",
    price: 135,
    stock_qty: 50,
    created_at: new Date().toISOString(),
  },
  {
    id: "15",
    category: "Coffee-Based Frappe",
    name: "Coffee Jelly",
    price: 135,
    stock_qty: 50,
    created_at: new Date().toISOString(),
  },
  {
    id: "16",
    category: "Coffee-Based Frappe",
    name: "Caramel Frappe",
    price: 120,
    stock_qty: 50,
    created_at: new Date().toISOString(),
  },

  // --- Non-Coffee Frappe ---
  {
    id: "17",
    category: "Non-Coffee Frappe",
    name: "Oreo",
    price: 130,
    stock_qty: 50,
    created_at: new Date().toISOString(),
  },
  {
    id: "18",
    category: "Non-Coffee Frappe",
    name: "Chocolate",
    price: 130,
    stock_qty: 50,
    created_at: new Date().toISOString(),
  },
  {
    id: "19",
    category: "Non-Coffee Frappe",
    name: "Strawberries & Cream",
    price: 140,
    stock_qty: 50,
    created_at: new Date().toISOString(),
  },
  {
    id: "20",
    category: "Non-Coffee Frappe",
    name: "Mangoes & Cream",
    price: 120,
    stock_qty: 50,
    created_at: new Date().toISOString(),
  },

  // --- Pasta ---
  {
    id: "21",
    category: "Pasta",
    name: "Bolognese",
    price: 135,
    stock_qty: 30,
    created_at: new Date().toISOString(),
  },
  {
    id: "22",
    category: "Pasta",
    name: "Creamy Carbonara",
    price: 135,
    stock_qty: 30,
    created_at: new Date().toISOString(),
  },

  // --- Rice Meals ---
  {
    id: "23",
    category: "Rice Meals",
    name: "Hungarian Sausage",
    price: 110,
    stock_qty: 30,
    created_at: new Date().toISOString(),
  },
  {
    id: "24",
    category: "Rice Meals",
    name: "Crispy Liempo",
    price: 135,
    stock_qty: 30,
    created_at: new Date().toISOString(),
  },

  // --- Snacks ---
  {
    id: "25",
    category: "Snacks",
    name: "French Fries",
    price: 100,
    stock_qty: 40,
    created_at: new Date().toISOString(),
  },
  {
    id: "26",
    category: "Snacks",
    name: "Cheese Sticks",
    price: 80,
    stock_qty: 40,
    created_at: new Date().toISOString(),
  },
  {
    id: "27",
    category: "Snacks",
    name: "Cheese Quesadilla",
    price: 115,
    stock_qty: 40,
    created_at: new Date().toISOString(),
  },
  {
    id: "28",
    category: "Snacks",
    name: "Nacho-Nachos",
    price: 150,
    stock_qty: 40,
    created_at: new Date().toISOString(),
  },
  {
    id: "29",
    category: "Snacks",
    name: "Chicken Wings",
    price: 110,
    stock_qty: 40,
    created_at: new Date().toISOString(),
  },
];

export function useDB() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [initialized, setInitialized] = useState(false);

  const refreshData = useCallback(async () => {
    try {
      const db = await getDB();

      const productsResult = await db.getAllAsync<Product>(
        "SELECT * FROM products ORDER BY category, name",
      );
      setProducts(productsResult);

      const salesResult = await db.getAllAsync<Sale>(
        "SELECT * FROM sales ORDER BY created_at DESC",
      );
      // We need to fetch items for each sale to fully reconstruct the Sale object
      // For now, let's just fetch the sales metadata. If we need items, we can fetch them separately or join.
      // But the Sale interface implies items are included.

      const fullSales: Sale[] = [];
      for (const s of salesResult) {
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
    const init = async () => {
      try {
        await initDatabase();
        await seedProductsFunc(MOCK_PRODUCTS);
        await refreshData();
        setInitialized(true);
      } catch (e) {
        console.error("Database initialization failed:", e);
      }
    };
    init();
  }, [refreshData]);

  const createSale = useCallback(
    async (saleData: Omit<Sale, "id" | "created_at">) => {
      const db = await getDB();
      const newSaleId = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      try {
        // Transaction manually
        await db.withTransactionAsync(async () => {
          // 1. Insert Sale
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

          // 2. Insert Items & Update Stock
          for (const item of saleData.items) {
            const itemId = crypto.randomUUID();
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
        console.log("Sale Created:", newSaleId);
      } catch (e) {
        console.error("Failed to create sale:", e);
        throw e;
      }
    },
    [refreshData],
  );

  return {
    db: { products, sales, settings },
    createSale,
    refreshData,
    initialized,
  };
}
