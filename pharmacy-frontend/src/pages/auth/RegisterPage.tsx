import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import { Chrome } from "lucide-react";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: { full_name: string; email: string; password: string }) =>
      authApi.register(data),
    onSuccess: (data) => {
      setAuth(data.user, data.access_token, data.refresh_token);
      toast.success("Account created! Please complete your profile.");
      navigate("/complete-profile");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail ?? "Registration failed");
    },
  });

  const onSubmit = (data: FormData) => {
    const { confirm_password, ...rest } = data;
    mutate(rest);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-primary p-12">
        <div className="flex items-center gap-3">
          <div className="h-10 w-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-lg">SLM</span>
          </div>
          <span className="font-display text-2xl font-semibold text-primary-foreground">Shwe La Min</span>
        </div>
        <div className="space-y-6">
          <h1 className="font-display text-5xl font-bold text-primary-foreground leading-tight">
            Join thousands<br />of patients.
          </h1>
          <p className="text-primary-foreground/70 text-lg">
            Create your account and get access to our full range of pharmaceutical products and services.
          </p>
          <div className="space-y-3">
            {["Order medicines online with ease", "Chat with pharmacists directly", "Get AI-powered health guidance", "Track all your orders in one place"].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
                <span className="text-primary-foreground/80 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-primary-foreground/40 text-sm">© 2026 Shwe La Min. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">Rx</span>
            </div>
            <span className="font-display font-semibold text-xl">PharmaShop</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold">Create account</h2>
            <p className="text-muted-foreground mt-2">Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" placeholder="John Doe" {...register("full_name")} />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  {...register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm Password</Label>
              <Input
                id="confirm_password"
                type="password"
                placeholder="Repeat your password"
                {...register("confirm_password")}
              />
              {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
            </div>

            <Button type="submit" className="w-full mt-2" size="lg" disabled={isPending}>
              {isPending ? "Creating account..." : "Create account"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full relative flex items-center justify-center gap-3 h-12 border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 shadow-sm font-medium rounded-xl"
              onClick={() => authApi.googleLogin()}
            >
              {/* Official Google G-Icon Colors using SVG for better accuracy */}
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-sm">Sign up with Google</span>
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
