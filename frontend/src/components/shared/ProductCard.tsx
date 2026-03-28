import { ShoppingCart, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";
import { useCart } from "@/hooks/useCart";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, isAdding } = useCart();
  const primaryImage = product.images.find((img) => img.is_primary) ?? product.images[0];
  const { isAuthenticated  } = useAuthStore();
  const navigate = useNavigate();

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <Link to={`/products/${product.id}`}>
        <div className="relative h-48 bg-muted overflow-hidden">
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-4xl">💊</div>
            </div>
          )}
          {product.requires_prescription && (
            <Badge className="absolute top-2 right-2 bg-orange-500 text-white border-0 text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Rx
            </Badge>
          )}
          {product.inventory === 0 && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="secondary">Out of Stock</Badge>
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="mb-1">
          <Badge variant="secondary" className="text-xs mb-2">
            {product.category.name}
          </Badge>
        </div>
        <Link to={`/products/${product.id}`}>
          <h3 className="font-medium text-sm leading-tight hover:text-primary transition-colors line-clamp-2 mb-1">
            {product.name}
          </h3>
        </Link>
        {product.manufacturer && (
          <p className="text-xs text-muted-foreground mb-3">{product.manufacturer}</p>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="font-display font-semibold text-primary">
            {formatCurrency(product.price)}
          </span>
          <Button
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              if (!isAuthenticated) {
                toast.error("Please login to add items to cart");
                navigate("/login");
                return;
              }
              addItem(product.id, 1);
            }}
            disabled={product.inventory === 0 || isAdding}
            className="h-8 px-3 text-xs"
          >
            <ShoppingCart className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}