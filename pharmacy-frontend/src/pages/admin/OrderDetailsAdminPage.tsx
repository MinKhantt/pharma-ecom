import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, FileText, User, MapPin, Phone, Mail } from "lucide-react";

import { ordersApi } from "@/api/orders";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { OrderStatus } from "@/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Separator } from "@/components/ui/separator";

const RETURN_REASON_LABELS: Record<string, string> = {
  damaged:       "Item arrived damaged",
  wrong_item:    "Wrong item received",
  not_satisfied: "Not satisfied with product",
};

export default function OrderDetailsAdminPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn:  () => ordersApi.getOrderById(id!),
    enabled:  !!id,
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: (status: OrderStatus) =>
      ordersApi.updateOrderStatus(id!, status),
    onSuccess: () => {
      toast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail ?? "Failed to update status"),
  });

  const { mutate: handleReturn, isPending: isHandlingReturn } = useMutation({
    mutationFn: (approve: boolean) => ordersApi.handleReturn(id!, approve),
    onSuccess: (_, approve) => {
      toast.success(approve ? "Return approved — refund issued" : "Return rejected");
      queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail ?? "Failed to process return"),
  });

  if (isLoading) return <LoadingSpinner className="py-12" />;
  if (!order) return (
    <div className="p-6 text-center text-muted-foreground">Order not found</div>
  );

  const isReturnRequested = order.status === "return_requested";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/orders"
            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Placed on {formatDateTime(order.order_date)}
          </p>
        </div>

        {/* Status update — hide when return is pending */}
        {!isReturnRequested && (
          <div className="flex items-center gap-3 bg-card p-3 rounded-lg border">
            <span className="text-sm font-medium">Update Status:</span>
            <Select
              value={order.status}
              onValueChange={(v) => updateStatus(v as OrderStatus)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left — items + prescription */}
        <div className="md:col-span-2 space-y-6">

          {/* Order items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-2"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium text-sm">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                    </div>
                    <span className="font-medium text-sm">
                      {formatCurrency(Number(item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold">Total Amount</span>
                  <span className="font-bold text-lg text-primary">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prescription viewer */}
          {order.prescription_ref && (
            <Card className="border-destructive/20">
              <CardHeader className="bg-destructive/5 pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <FileText className="h-5 w-5" />
                  Prescription Document
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Please verify this prescription before confirming the order.
                </p>
                <div className="border rounded-md overflow-hidden bg-muted flex items-center justify-center min-h-[300px]">
                  {order.prescription_ref.endsWith(".pdf") ? (
                    <iframe
                      src={order.prescription_ref}
                      className="w-full h-[500px]"
                      title="Prescription PDF"
                    />
                  ) : (
                    <img
                      src={order.prescription_ref}
                      alt="Prescription"
                      className="max-w-full h-auto object-contain max-h-[500px]"
                    />
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" asChild>
                    <a
                      href={order.prescription_ref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open in New Tab
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right — customer info + notes + return */}
        <div className="space-y-6">

          {/* Customer info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {order.user ? (
                <>
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <p className="font-medium">{order.user.full_name}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <p>{order.user.email}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <p>{order.user.phone_number || "No phone provided"}</p>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium mb-1">Delivery Address</p>
                      <p className="text-muted-foreground">
                        {order.delivery_address || order.user.address || "—"}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground italic">
                  Customer details unavailable
                </p>
              )}
            </CardContent>
          </Card>

          {/* Order notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md border">
                  {order.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Return request — approve / reject */}
          {isReturnRequested && (
            <Card className="border-yellow-300">
              <CardHeader className="bg-yellow-50 pb-4 rounded-t-lg">
                <CardTitle className="text-base text-yellow-800">
                  Return Requested
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-sm">
                {order.return_reason && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Reason</p>
                    <p className="font-medium">
                      {RETURN_REASON_LABELS[order.return_reason] ??
                        order.return_reason}
                    </p>
                  </div>
                )}
                {order.return_note && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Customer note
                    </p>
                    <p className="text-muted-foreground bg-muted p-2 rounded-md border text-xs">
                      {order.return_note}
                    </p>
                  </div>
                )}
                <Separator />
                <div className="space-y-2">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Approve this return and issue a full refund?"
                        )
                      ) {
                        handleReturn(true);
                      }
                    }}
                    disabled={isHandlingReturn}
                  >
                    {isHandlingReturn ? "Processing..." : "Approve Return"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-destructive border-destructive/50 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Reject this return request? The order will remain as delivered."
                        )
                      ) {
                        handleReturn(false);
                      }
                    }}
                    disabled={isHandlingReturn}
                  >
                    Reject Return
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Refunded info */}
          {order.status === "refunded" && order.return_reason && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-green-800 mb-1">
                  Return Approved
                </p>
                <p className="text-xs text-green-700">
                  Reason:{" "}
                  {RETURN_REASON_LABELS[order.return_reason] ??
                    order.return_reason}
                </p>
                {order.return_note && (
                  <p className="text-xs text-green-600 mt-1">
                    Note: {order.return_note}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}