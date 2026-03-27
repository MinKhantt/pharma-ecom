import { create } from "zustand";
import type { Cart } from "@/types";

interface CartState {
  cart: Cart | null;
  setCart: (cart: Cart) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()((set) => ({
  cart: null,
  setCart: (cart) =>
    set({
      cart: {
        ...cart,
        // Sort items by product name so order never changes on update
        items: [...cart.items].sort((a, b) =>
          a.product.name.localeCompare(b.product.name)
        ),
      },
    }),
  clearCart: () => set({ cart: null }),
}));