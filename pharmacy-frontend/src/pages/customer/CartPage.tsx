import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/hooks/useCart";
import { useCartStore } from "@/store/cartStore";
import { cartApi } from "@/api/cart";
import { formatCurrency } from "@/lib/utils";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, setCart } = useCartStore();
  const { updateItem, removeItem, isUpdating, isRemoving } = useCart();

  const { isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const data = await cartApi.getCart();
      setCart(data);
      return data;
    },
    staleTime: 0,
  });

  if (isLoading) return <LoadingSpinner className="py-16" />;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Add some products to get started</p>
        <Button asChild>
          <Link to="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  const hasRxItems = cart.items.some((item) => item.product.requires_prescription);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Your Cart</h1>
        <p className="text-muted-foreground mt-1">
          {cart.items.length} item{cart.items.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {cart.items.map((item) => {
            const img = item.product.images.find((i) => i.is_primary) ?? item.product.images[0];
            return (
              <Card key={item.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden shrink-0">
                    {img ? (
                      <img
                        src={img.url}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-2xl">💊</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.product.id}`}>
                      <h3 className="font-medium text-sm truncate hover:text-primary transition-colors">
                        {item.product.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.unit_price)} each
                    </p>
                    {item.product.requires_prescription && (
                      <span className="text-xs text-orange-600">Prescription required</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center border border-border rounded-lg">
                      <button
                        className="px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                        onClick={() =>
                          item.quantity > 1
                            ? updateItem(item.id, item.quantity - 1)
                            : removeItem(item.id)
                        }
                        disabled={isUpdating || isRemoving}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-3 py-1.5 text-xs font-medium min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        className="px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        disabled={isUpdating || item.quantity >= item.product.inventory}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <span className="text-sm font-semibold w-20 text-right">
                      {formatCurrency(item.total_price)}
                    </span>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeItem(item.id)}
                      disabled={isRemoving}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary */}
        <div>
          <Card className="sticky top-20">
            <CardContent className="p-5 space-y-4">
              <h2 className="font-display text-lg font-semibold">Order Summary</h2>
              <div className="space-y-2 text-sm">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-muted-foreground">
                    <span className="truncate max-w-[60%]">
                      {item.product.name} ×{item.quantity}
                    </span>
                    <span>{formatCurrency(item.total_price)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary font-display text-lg">
                  {formatCurrency(cart.total_amount)}
                </span>
              </div>
              {hasRxItems && (
                <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-xs text-orange-700">
                  Your cart contains prescription items. You'll need to upload
                  prescriptions after checkout.
                </div>
              )}
              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate("/checkout")}
              >
                Proceed to checkout <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/products">Continue shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}