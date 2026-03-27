import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cartApi } from "@/api/cart";
import { useCartStore } from "@/store/cartStore";

export function useCart() {
  const queryClient = useQueryClient();
  const cart = useCartStore((state) => state.cart);
  const setCart = useCartStore((state) => state.setCart);

  const { mutate: addItem, isPending: isAdding } = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartApi.addItem(productId, quantity),
    onSuccess: (updatedCart, variables) => {
      // variables gives us the productId that was just added
      const wasAlreadyInCart = cart?.items.some(
        (item) => item.product.id === variables.productId
      );
      setCart(updatedCart);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success(wasAlreadyInCart ? "Cart updated" : "Added to cart");
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail ?? "Failed to add"),
  });

  const { mutate: updateItem, isPending: isUpdating } = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartApi.updateItem(itemId, quantity),
    onSuccess: (updatedCart) => {
      setCart(updatedCart);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail ?? "Failed to update"),
  });

  const { mutate: removeItem, isPending: isRemoving } = useMutation({
    mutationFn: (itemId: string) => cartApi.removeItem(itemId),
    onSuccess: (updatedCart) => {
      setCart(updatedCart);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Removed from cart");
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail ?? "Failed to remove"),
  });

  return {
    cart,
    isAdding,
    isUpdating,
    isRemoving,
    addItem: (productId: string, quantity: number) =>
      addItem({ productId, quantity }),
    updateItem: (itemId: string, quantity: number) =>
      updateItem({ itemId, quantity }),
    removeItem: (itemId: string) => removeItem(itemId),
  };
}