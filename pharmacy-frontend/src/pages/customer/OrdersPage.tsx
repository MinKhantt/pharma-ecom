import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Package, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ordersApi } from "@/api/orders";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => ordersApi.getMyOrders(),
  });

  if (isLoading) return <LoadingSpinner className="py-16" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">My Orders</h1>
        <p className="text-muted-foreground mt-1">Track and manage your orders</p>
      </div>

      {!data?.items.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">No orders yet</h2>
          <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
          <Button asChild><Link to="/products">Browse products</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-medium">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDateTime(order.order_date)}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-display font-semibold text-primary">
                        {formatCurrency(order.total_amount)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
