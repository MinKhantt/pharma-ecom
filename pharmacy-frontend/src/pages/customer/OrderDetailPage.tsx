import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Upload, X, RotateCcw, Star } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ordersApi } from "@/api/orders";
import { reviewsApi } from "@/api/reviews";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { ReturnReason } from "@/types";

const RETURN_REASONS: { value: ReturnReason; label: string }[] = [
  { value: "damaged",       label: "Item arrived damaged" },
  { value: "wrong_item",    label: "Wrong item received" },
  { value: "not_satisfied", label: "Not satisfied with product" },
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  // ── ALL state hooks first ─────────────────────────────────────────────────
  const [showReturnForm, setShowReturnForm]     = useState(false);
  const [returnReason, setReturnReason]         = useState<ReturnReason | "">("");
  const [returnNote, setReturnNote]             = useState("");
  const [showReviewForm, setShowReviewForm]     = useState(false);
  const [reviewRating, setReviewRating]         = useState(0);
  const [reviewHover, setReviewHover]           = useState(0);
  const [reviewComment, setReviewComment]       = useState("");

  // ── ALL query/mutation hooks next ─────────────────────────────────────────
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn:  () => ordersApi.getMyOrder(id!),
    enabled:  !!id,
  });

  const { data: myReview } = useQuery({
    queryKey: ["my-review"],
    queryFn:  reviewsApi.getMyReview,
    enabled:  order?.status === "delivered",
  });

  const { mutate: cancel, isPending: isCancelling } = useMutation({
    mutationFn: () => ordersApi.cancelOrder(id!),
    onSuccess: () => {
      toast.success("Order cancelled");
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail ?? "Failed to cancel"),
  });

  const { mutate: uploadRx, isPending: isUploading } = useMutation({
    mutationFn: (file: File) => ordersApi.uploadPrescription(id!, file),
    onSuccess: () => {
      toast.success("Prescription uploaded");
      queryClient.invalidateQueries({ queryKey: ["order", id] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail ?? "Upload failed"),
  });

  const { mutate: submitReturn, isPending: isSubmittingReturn } = useMutation({
    mutationFn: () => {
      if (!returnReason) throw new Error("Please select a reason");
      return ordersApi.requestReturn(id!, {
        reason: returnReason,
        note: returnNote.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Return request submitted");
      setShowReturnForm(false);
      setReturnReason("");
      setReturnNote("");
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail ?? err.message ?? "Failed to submit return"),
  });

  const { mutate: submitReview, isPending: isSubmittingReview } = useMutation({
    mutationFn: () =>
      reviewsApi.createReview({ rating: reviewRating, comment: reviewComment }),
    onSuccess: () => {
      toast.success("Thank you for your review!");
      setShowReviewForm(false);
      queryClient.invalidateQueries({ queryKey: ["my-review"] });
      queryClient.invalidateQueries({ queryKey: ["public-reviews"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail ?? "Failed to submit review"),
  });

  // ── Early returns AFTER all hooks ─────────────────────────────────────────
  if (isLoading) return <LoadingSpinner className="py-16" />;
  if (!order) return (
    <div className="text-center py-16">
      <p>Order not found</p>
    </div>
  );

  const canCancel       = ["pending", "awaiting_prescription", "confirmed", "processing"].includes(order.status);
  const canReturn       = order.status === "delivered";
  const returnRequested = order.status === "return_requested";
  const isRefunded      = order.status === "refunded";

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/orders">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to orders
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-muted-foreground text-sm">
            {formatDateTime(order.order_date)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — items + cards */}
        <div className="lg:col-span-2 space-y-4">

          {/* Items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((item) => {
                const img =
                  item.product.images.find((i) => i.is_primary) ??
                  item.product.images[0];
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden shrink-0">
                      {img ? (
                        <img src={img.url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-xl">💊</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ×{item.quantity} · {formatCurrency(item.price)} each
                      </p>
                    </div>
                    <span className="text-sm font-semibold shrink-0">
                      {formatCurrency(Number(item.price) * item.quantity)}
                    </span>
                  </div>
                );
              })}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary font-display">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Review prompt */}
          {order.status === "delivered" && (
            <Card className="border-primary/20">
              <CardContent className="p-5">
                {myReview ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star
                            key={s}
                            className={`h-4 w-4 ${
                              s <= myReview.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">Your review</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{myReview.comment}</p>
                    {!myReview.is_approved && (
                      <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
                        Your review is pending approval by our team.
                      </p>
                    )}
                  </div>
                ) : showReviewForm ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold mb-1">How was your experience?</p>
                      <p className="text-xs text-muted-foreground">
                        Your review helps other customers make informed decisions.
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onMouseEnter={() => setReviewHover(s)}
                          onMouseLeave={() => setReviewHover(0)}
                          onClick={() => setReviewRating(s)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-8 w-8 transition-colors ${
                              s <= (reviewHover || reviewRating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {reviewRating > 0 && (
                      <p className="text-xs text-muted-foreground -mt-2">
                        {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][reviewRating]}
                      </p>
                    )}
                    <Textarea
                      placeholder="Share your experience with Shwe La Min Pharmacy..."
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => submitReview()}
                        disabled={isSubmittingReview || reviewRating === 0 || !reviewComment.trim()}
                        size="sm"
                      >
                        {isSubmittingReview ? "Submitting..." : "Submit Review"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowReviewForm(false);
                          setReviewRating(0);
                          setReviewComment("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">Enjoyed your order?</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Leave a review and help others discover us.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 border-primary/30 text-primary hover:bg-primary/5"
                      onClick={() => setShowReviewForm(true)}
                    >
                      <Star className="h-4 w-4 mr-1.5" />
                      Write a Review
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Prescription upload */}
          {order.status === "awaiting_prescription" && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-orange-800 mb-2">
                  Prescription Required
                </h3>
                <p className="text-sm text-orange-700 mb-3">
                  Please upload a valid prescription to proceed with your order.
                  Accepted formats: JPEG, PNG, WebP, PDF (max 5MB).
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadRx(file);
                    e.currentTarget.value = "";
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={isUploading}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? "Uploading..." : "Upload Prescription"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Return request form */}
          {canReturn && showReturnForm && (
            <Card className="border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-orange-700">
                  Request Return
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Reason *
                  </Label>
                  <Select
                    value={returnReason}
                    onValueChange={(v) => setReturnReason(v as ReturnReason)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {RETURN_REASONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Additional note (optional)
                  </Label>
                  <Textarea
                    placeholder="Describe the issue in more detail..."
                    rows={3}
                    value={returnNote}
                    onChange={(e) => setReturnNote(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => submitReturn()}
                    disabled={isSubmittingReturn || !returnReason}
                    className="flex-1"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {isSubmittingReturn ? "Submitting..." : "Submit Return Request"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReturnForm(false);
                      setReturnReason("");
                      setReturnNote("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Return under review */}
          {returnRequested && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-yellow-800 mb-1">
                  Return Under Review
                </h3>
                <p className="text-sm text-yellow-700">
                  Your return request has been submitted and is being reviewed.
                </p>
                {order.return_reason && (
                  <p className="text-xs text-yellow-600 mt-2">
                    Reason:{" "}
                    <span className="font-medium">
                      {RETURN_REASONS.find((r) => r.value === order.return_reason)?.label ??
                        order.return_reason}
                    </span>
                  </p>
                )}
                {order.return_note && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Note: <span className="font-medium">{order.return_note}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Refunded */}
          {isRefunded && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-green-800 mb-1">
                  Return Approved
                </h3>
                <p className="text-sm text-green-700">
                  Your return has been approved and your payment has been fully refunded.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right — delivery + actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Delivery Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Address</p>
                <p>{order.delivery_address ?? "—"}</p>
              </div>
              {order.notes && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Notes</p>
                  <p className="text-muted-foreground">{order.notes}</p>
                </div>
              )}
              {order.prescription_ref &&
                order.status !== "awaiting_prescription" && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Prescription</p>
                    <a
                      href={order.prescription_ref}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline text-xs"
                    >
                      View prescription
                    </a>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Cancel */}
          {canCancel && (
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => {
                if (window.confirm("Are you sure you want to cancel this order?"))
                  cancel();
              }}
              disabled={isCancelling}
            >
              <X className="h-4 w-4 mr-2" />
              {isCancelling ? "Cancelling..." : "Cancel Order"}
            </Button>
          )}

          {/* Request return */}
          {canReturn && !showReturnForm && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-orange-800">Not satisfied?</p>
                  <p className="text-xs text-orange-700 mt-0.5">
                    You can request a return and full refund.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-orange-300 text-orange-600 hover:bg-orange-100"
                  onClick={() => setShowReturnForm(true)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Request Return
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}