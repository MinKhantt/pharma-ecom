import { cn, getOrderStatusColor } from "@/lib/utils";
import type { OrderStatus } from "@/types";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  awaiting_prescription: "Awaiting Prescription",
  ready_for_pickup: "Ready",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  return_requested: "Return Requested",
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        getOrderStatusColor(status),
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
