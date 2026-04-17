import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ordersApi } from "@/api/orders";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/constants";
import type { Order, OrderStatus } from "@/types";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrdersAdminPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const limit = 8;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", statusFilter, page],
    queryFn: () =>
      ordersApi.getAllOrders({
        skip: page * limit,
        limit,
        status: statusFilter as OrderStatus || undefined,
      }),
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersApi.updateOrderStatus(id, status),
    onSuccess: () => {
      toast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail ?? "Update failed"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {data?.total ?? 0} total orders
          </p>
        </div>
        <Select 
          // If statusFilter is empty, show "all"
          value={statusFilter || "all"} 
          onValueChange={(v) => {
            // If user selects "all", set state to empty string to fetch everything
            setStatusFilter(v === "all" ? "" : v);
            setPage(0); // Reset to page 1 when filtering!
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <div className="space-y-3">
          {data?.items.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
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
                      {order.delivery_address && ` · ${order.delivery_address.slice(0, 40)}...`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-display font-semibold text-primary">
                      {formatCurrency(order.total_amount)}
                    </span>
                    <Select
                      value={order.status}
                      onValueChange={(v) => {
                        console.log("Selected:", v);
                        updateStatus({ id: order.id, status: v as OrderStatus })
                      }}
                    >
                      <SelectTrigger className="w-44 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value} className="text-xs">
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/orders/${order.id}`}>
                        View <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {data && data.total > limit && (
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground flex items-center">
                {page + 1} / {Math.ceil(data.total / limit)}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * limit >= data.total}>
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
