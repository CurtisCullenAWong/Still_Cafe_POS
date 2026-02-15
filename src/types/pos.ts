import { Product } from "./db";

export interface CartItem {
  product: Product;
  quantity: number;
}
