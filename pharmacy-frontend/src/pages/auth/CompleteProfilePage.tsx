import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { usersApi } from "@/api/users";
import { useAuthStore } from "@/store/authStore";
import { UserCircle } from "lucide-react";

const schema = z.object({
  phone_number: z.string().min(9, "Enter a valid phone number").optional().or(z.literal("")),
  date_of_birth: z.string().optional(),
  address: z.string().min(5, "Address must be at least 5 characters"),
});

type FormData = z.infer<typeof schema>;

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => usersApi.completeProfile(data),
    onSuccess: (user) => {
      setUser(user);
      toast.success("Profile completed!");
      navigate("/");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail ?? "Failed to save profile");
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <UserCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold">Complete your profile</h1>
          <p className="text-muted-foreground mt-2">Just a few more details before you start shopping</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input id="phone_number" placeholder="09123456789" {...register("phone_number")} />
                {errors.phone_number && <p className="text-xs text-destructive">{errors.phone_number.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Delivery Address <span className="text-destructive">*</span></Label>
                <Textarea
                  id="address"
                  placeholder="Enter your full delivery address..."
                  rows={3}
                  {...register("address")}
                />
                {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                {isPending ? "Saving..." : "Complete profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
