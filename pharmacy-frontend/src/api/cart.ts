import api from "./axios";
import type { Cart } from "@/types";

function parseCart(cart: Cart): Cart {
  return {
    ...cart,
    total_amount: parseFloat(String(cart.total_amount)),
    items: cart.items.map((item) => ({
      ...item,
      unit_price: parseFloat(String(item.unit_price)),
      total_price: parseFloat(String(item.total_price)),
      product: {
        ...item.product,
        price: parseFloat(String(item.product.price)),
      },
    })),
  };
}

export const cartApi = {
  getCart: () =>
    api.get<Cart>("/cart").then((r) => parseCart(r.data)),

  addItem: (product_id: string, quantity: number) =>
    api.post<Cart>("/cart/items", { product_id, quantity }).then((r) => parseCart(r.data)),

  updateItem: (item_id: string, quantity: number) =>
    api.patch<Cart>(`/cart/items/${item_id}`, { quantity }).then((r) => parseCart(r.data)),

  removeItem: (item_id: string) =>
    api.delete<Cart>(`/cart/items/${item_id}`).then((r) => parseCart(r.data)),

  clearCart: () =>
    api.delete<Cart>("/cart").then((r) => parseCart(r.data)),
};