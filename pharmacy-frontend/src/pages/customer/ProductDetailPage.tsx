import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ShoppingCart, FileText, ArrowLeft, Package } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { productsApi } from "@/api/products";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, isAdding } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { isAuthenticated  } = useAuthStore();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.getProduct(id!),
    enabled: !!id,
  });

  if (isLoading) return <LoadingSpinner className="py-32" />;
  if (!product) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Product not found</p>
      <Button variant="link" asChild><Link to="/products">← Back to products</Link></Button>
    </div>
  );

  const primaryImg = product.images.find((i) => i.is_primary) ?? product.images[0];
  const displayImages = product.images.length > 0 ? product.images : [];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/products"><ArrowLeft className="h-4 w-4 mr-1" /> Back to products</Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square rounded-xl bg-muted overflow-hidden border border-border">
            {displayImages.length > 0 ? (
              <img
                src={displayImages[selectedImage]?.url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-6xl">💊</div>
            )}
          </div>
          {displayImages.length > 1 && (
            <div className="flex gap-2">
              {displayImages.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === i ? "border-primary" : "border-border"}`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{product.category.name}</Badge>
              {product.requires_prescription && (
                <Badge className="bg-orange-500 text-white border-0">
                  <FileText className="h-3 w-3 mr-1" /> Prescription Required
                </Badge>
              )}
            </div>
            <h1 className="font-display text-3xl font-bold">{product.name}</h1>
            {product.manufacturer && (
              <p className="text-muted-foreground mt-1">by {product.manufacturer}</p>
            )}
          </div>

          <div className="font-display text-4xl font-bold text-primary">
            {formatCurrency(product.price)}
          </div>

          {product.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          )}

          <Separator />

          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {product.inventory > 0
                ? <span className="text-green-600 font-medium">{product.inventory} in stock</span>
                : <span className="text-destructive font-medium">Out of stock</span>
              }
            </span>
          </div>

          {product.requires_prescription && (
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 text-sm text-orange-800">
              <FileText className="h-4 w-4 inline mr-2" />
              This product requires a valid prescription. You'll need to upload it after placing your order.
            </div>
          )}

          {/* Quantity + Add to cart */}
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-border rounded-lg">
              <button
                className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >−</button>
              <span className="px-4 py-2 text-sm font-medium min-w-[3rem] text-center">{quantity}</span>
              <button
                className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setQuantity((q) => Math.min(product.inventory, q + 1))}
              >+</button>
            </div>
            <Button
              size="lg"
              className="flex-1"
              disabled={product.inventory === 0 || isAdding}
              onClick={() => {
                if (!isAuthenticated) {
                  toast.error("Please login to add items to cart");
                  navigate("/login");
                  return;
                }
                addItem(product.id, quantity);
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
