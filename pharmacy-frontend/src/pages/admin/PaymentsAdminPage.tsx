import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ordersApi } from "@/api/orders";
import { paymentsApi } from "@/api/payments";
import { formatCurrency, formatDateTime, getPaymentStatusColor } from "@/lib/utils";
import { CreditCard } from "lucide-react";
import { useQuery as useQueryAll } from "@tanstack/react-query";
import { useState } from "react";

export default function PaymentsAdminPage() {
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["admin-orders-payments", page],
    queryFn: () => ordersApi.getAllOrders({ skip: page * limit, limit }),
  });

  const paymentMethodLabel: Record<string, string> = {
    credit_card: "Credit Card",
    debit_card: "Debit Card",
    bank_transfer: "Bank Transfer",
    cash_on_delivery: "Cash on Delivery",
  };

  if (isLoading) return <LoadingSpinner className="py-12" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground text-sm mt-0.5">View all payment transactions</p>
      </div>

      <div className="space-y-3">
        {ordersData?.items.map((order) => (
          <PaymentRow key={order.id} orderId={order.id} orderAmount={order.total_amount} orderDate={order.order_date} paymentMethodLabel={paymentMethodLabel} />
        ))}
      </div>

      {ordersData && ordersData.total > limit && (
        <div className="flex justify-center gap-3 pt-2">
          <button
            className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            ← Previous
          </button>
          <span className="text-sm text-muted-foreground">{page + 1} / {Math.ceil(ordersData.total / limit)}</span>
          <button
            className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
            onClick={() => setPage((p) => p + 1)}
            disabled={(page + 1) * limit >= ordersData.total}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function PaymentRow({
  orderId,
  orderAmount,
  orderDate,
  paymentMethodLabel,
}: {
  orderId: string;
  orderAmount: number;
  orderDate: string;
  paymentMethodLabel: Record<string, string>;
}) {
  const { data: payment } = useQueryAll({
    queryKey: ["payment-by-order", orderId],
    queryFn: () => paymentsApi.getPaymentByOrder(orderId),
    retry: false,
    staleTime: 5 * 60 * 1000 // Cache for 5 mins to avoid spamming
  });

  if (!payment) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <span className="font-mono text-xs">#{orderId.slice(0, 8).toUpperCase()}</span>
            <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(orderDate)}</p>
          </div>
          <Badge variant="secondary" className="text-xs">No payment</Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-xs font-medium">TXN: {payment.transaction_id}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Order #{orderId.slice(0, 8).toUpperCase()} · {formatDateTime(orderDate)}
            </p>
            <p className="text-xs text-muted-foreground">
              {paymentMethodLabel[payment.method] ?? payment.method}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-display font-semibold text-primary">
              {formatCurrency(payment.amount)}
            </span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPaymentStatusColor(payment.status)}`}>
              {payment.status}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
