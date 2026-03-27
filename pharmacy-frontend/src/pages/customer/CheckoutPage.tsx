import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { ordersApi } from "@/api/orders";
import { paymentsApi } from "@/api/payments";
import { formatCurrency } from "@/lib/utils";
import { PAYMENT_METHODS } from "@/lib/constants";
import type { PaymentMethod } from "@/types";
import { CreditCard, MapPin, FileText } from "lucide-react";
import { useRef } from "react";

const schema = z.object({
  delivery_address: z.string().min(5, "Please enter a valid address"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash_on_delivery");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  
  const [cardErrors, setCardErrors] = useState<{
    cardNumber?: string;
    cardExpiry?: string;
    cardCvv?: string;
  }>({});

  const isCheckingOut = useRef(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      delivery_address: user?.profile?.address ?? "",
    },
  });

  const showCardFields = paymentMethod === "credit_card" || paymentMethod === "debit_card";

  const validateCard = (): boolean => {
    if (!showCardFields) return true;

    const newErrors: typeof cardErrors = {};

    if (cardNumber.replace(/\s/g, "").length !== 16) {
      newErrors.cardNumber = "Card number must be 16 digits";
    }

    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(cardExpiry)) {
      newErrors.cardExpiry = "Enter a valid expiry date (MM/YY)";
    } else {
      const [month, year] = cardExpiry.split("/");
      const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
      if (expiry < new Date()) {
        newErrors.cardExpiry = "Card has expired";
      }
    }

    if (cardCvv.length !== 3) {
      newErrors.cardCvv = "CVV must be 3 digits";
    }

    setCardErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      const order = await ordersApi.checkout(data);
      await paymentsApi.createPayment({ order_id: order.id, method: paymentMethod });
      return order;
    },
    onSuccess: (order) => {
      clearCart();
      toast.success("Order placed successfully!");
      navigate(`/orders/${order.id}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail ?? "Checkout failed");
    },
  });

  const onSubmit = (data: FormData) => {
    if (!validateCard()) return;
    // Prevent the redirect-to-cart logic from firing when clearCart() runs
    isCheckingOut.current = true;
    mutate(data);
  };

  if (!cart || cart.items.length === 0) {
    if(!isCheckingOut.current) {
      navigate("/cart");
    }
    return null;
  }

  // Format card number with spaces every 4 digits
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(" ") ?? raw;
    setCardNumber(formatted);
  };

  // Auto-insert slash in expiry
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 3) val = val.slice(0, 2) + "/" + val.slice(2);
    setCardExpiry(val);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Delivery */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" /> Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Delivery Address *</Label>
                <Textarea
                  placeholder="Enter your full delivery address..."
                  rows={3}
                  {...register("delivery_address")}
                />
                {errors.delivery_address && (
                  <p className="text-xs text-destructive">{errors.delivery_address.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Any special delivery instructions..."
                  rows={2}
                  {...register("notes")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" /> Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={paymentMethod}
                onValueChange={(v) => {
                  setPaymentMethod(v as PaymentMethod);
                  setCardErrors({});
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {showCardFields && (
                <div className="space-y-4 pt-2">
                  {/* Card Number */}
                  <div className="space-y-2">
                    <Label>Card Number *</Label>
                    <Input
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      maxLength={19}
                      className={cardErrors.cardNumber ? "border-destructive" : ""}
                    />
                    {cardErrors.cardNumber && (
                      <p className="text-xs text-destructive">{cardErrors.cardNumber}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Expiry */}
                    <div className="space-y-2">
                      <Label>Expiry *</Label>
                      <Input
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        maxLength={5}
                        className={cardErrors.cardExpiry ? "border-destructive" : ""}
                      />
                      {cardErrors.cardExpiry && (
                        <p className="text-xs text-destructive">{cardErrors.cardExpiry}</p>
                      )}
                    </div>

                    {/* CVV */}
                    <div className="space-y-2">
                      <Label>CVV *</Label>
                      <Input
                        placeholder="123"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                        maxLength={3}
                        className={cardErrors.cardCvv ? "border-destructive" : ""}
                      />
                      {cardErrors.cardCvv && (
                        <p className="text-xs text-destructive">{cardErrors.cardCvv}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div>
          <Card className="sticky top-20">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              {cart.items.some((i) => i.product.requires_prescription) && (
                <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-xs text-orange-700 flex gap-2">
                  <FileText className="h-4 w-4 shrink-0 mt-0.5" />
                  You'll need to upload prescriptions for Rx items after placing the order.
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit(onSubmit)}
                disabled={isPending}
              >
                {isPending ? "Placing order..." : "Place Order"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}