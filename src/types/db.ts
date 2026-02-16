export interface Product {
  id: string;
  category: string;
  name: string;
  price: number;
  stock_qty: number;
  image_uri?: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  total_amount: number;
  vat_amount: number;
  discount_amount: number;
  discount_type?: "senior" | "pwd" | null;
  final_amount: number;
  payment_method: "cash" | "gcash";
  created_at: string;
  items: SaleItem[];
}

export interface Settings {
  store_name: string;
  vat_percentage: number;
  senior_discount_percentage: number;
  pwd_discount_percentage: number;
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface DatabaseSchema {
  products: Product[];
  categories: Category[];
  sales: Sale[];
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  store_name: "Still Café",
  vat_percentage: 12,
  senior_discount_percentage: 20,
  pwd_discount_percentage: 20,
};
