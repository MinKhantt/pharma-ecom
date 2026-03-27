export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";
export const WS_BASE_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8000/api/v1";

export const ORDER_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "awaiting_prescription", label: "Awaiting Prescription" },
  { value: "ready_for_pickup", label: "Ready for Pickup" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
  { value: "return_requested", label: "Return Requested" },
];

export const PAYMENT_METHODS = [
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "cash_on_delivery", label: "Cash on Delivery" },
];
