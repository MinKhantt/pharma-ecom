import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, Check, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { reviewsApi } from "@/api/reviews";
import { formatDateTime } from "@/lib/utils";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${
            s <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

export default function ReviewsAdminPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn:  () => reviewsApi.getAllReviews({ limit: 100 }),
  });

  const { mutate: approve } = useMutation({
    mutationFn: (id: string) => reviewsApi.approveReview(id),
    onSuccess: () => {
      toast.success("Review approved");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: () => toast.error("Failed to approve"),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => reviewsApi.deleteReview(id),
    onSuccess: () => {
      toast.success("Review deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: () => toast.error("Failed to delete"),
  });

  const pending  = data?.items.filter((r) => !r.is_approved) ?? [];
  const approved = data?.items.filter((r) => r.is_approved)  ?? [];

  if (isLoading) return <LoadingSpinner className="py-12" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Reviews</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {pending.length} pending · {approved.length} approved
        </p>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Pending Approval
          </h2>
          {pending.map((review) => (
            <Card key={review.id} className="border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={review.user?.avatar_url ?? ""} />
                      <AvatarFallback className="text-xs">
                        {review.user?.full_name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">
                          {review.user?.full_name}
                        </p>
                        <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs">
                          Pending
                        </Badge>
                      </div>
                      <StarRating rating={review.rating} />
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {review.comment}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(review.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => approve(review.id)}
                    >
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => {
                        if (window.confirm("Delete this review?"))
                          remove(review.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approved */}
      {approved.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Approved
          </h2>
          {approved.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={review.user?.avatar_url ?? ""} />
                      <AvatarFallback className="text-xs">
                        {review.user?.full_name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {review.user?.full_name}
                        </p>
                        <Badge variant="secondary" className="text-green-700 bg-green-50 text-xs">
                          Approved
                        </Badge>
                      </div>
                      <StarRating rating={review.rating} />
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {review.comment}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(review.created_at)}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => {
                      if (window.confirm("Delete this review?"))
                        remove(review.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data?.items.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          No reviews yet.
        </div>
      )}
    </div>
  );
}