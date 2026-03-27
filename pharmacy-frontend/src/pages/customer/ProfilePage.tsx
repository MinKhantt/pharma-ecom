import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, User, Lock, Phone, Calendar, MapPin, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { usersApi } from "@/api/users";
import { useAuthStore } from "@/store/authStore";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone_number: z.string().optional(),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "Must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

type Section = "profile" | "password";

function PasswordField({
  label,
  error,
  registration,
}: {
  label: string;
  error?: string;
  registration: ReturnType<ReturnType<typeof useForm>["register"]>;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      <div className="relative">
        <Input type={show ? "text" : "password"} {...registration} />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [section, setSection] = useState<Section>("profile");

  const initials =
    user?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "U";

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", phone_number: "", date_of_birth: "", address: "" },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name ?? "",
        phone_number: user.profile?.phone_number ?? "",
        date_of_birth: user.profile?.date_of_birth ?? "",
        address: user.profile?.address ?? "",
      });
    }
  }, [user]);

  const { mutate: uploadAvatar, isPending: isUploading } = useMutation({
    mutationFn: (file: File) => usersApi.uploadAvatar(file),
    onSuccess: (u) => { setUser(u); toast.success("Photo updated"); },
    onError: (err: any) => toast.error(err.response?.data?.detail ?? "Upload failed"),
  });

  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: (data: ProfileForm) => usersApi.updateMe(data),
    onSuccess: (u) => { setUser(u); toast.success("Profile saved"); },
    onError: (err: any) => toast.error(err.response?.data?.detail ?? "Update failed"),
  });

  const { mutate: changePassword, isPending: isChangingPassword } = useMutation({
    mutationFn: (data: PasswordForm) =>
      usersApi.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      }),
    onSuccess: () => { toast.success("Password changed"); passwordForm.reset(); },
    onError: (err: any) => toast.error(err.response?.data?.detail ?? "Failed to change password"),
  });

  const navItems: { key: Section; label: string; icon: typeof User }[] = [
    { key: "profile", label: "Profile info", icon: User },
    { key: "password", label: "Password", icon: Lock },
  ];

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Account</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and security settings</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="md:w-48 shrink-0">
          <nav className="flex md:flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setSection(item.key)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left",
                  section === item.key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* ── Profile info panel ─────────────────────────────────────────── */}
          {section === "profile" && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-6">
              {/* Avatar row */}
              <div className="flex items-center gap-5 pb-6 border-b border-border">
                <div className="relative shrink-0">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.profile?.avatar_url ?? ""} />
                    <AvatarFallback className="text-xl font-display bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={isUploading}
                    className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {isUploading
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <Camera className="h-3 w-3" />
                    }
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadAvatar(file);
                      e.target.value = "";
                    }}
                  />
                </div>
                <div>
                  <p className="font-semibold">{user?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={isUploading}
                    className="text-xs text-primary hover:underline mt-1 disabled:opacity-50"
                  >
                    {isUploading ? "Uploading..." : "Change photo"}
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit((d) => updateProfile(d))} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <User className="h-3 w-3" /> Full Name
                  </Label>
                  <Input {...register("full_name")} />
                  {errors.full_name && (
                    <p className="text-xs text-destructive">{errors.full_name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Phone className="h-3 w-3" /> Phone
                    </Label>
                    <Input placeholder="09123456789" {...register("phone_number")} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" /> Date of Birth
                    </Label>
                    <Input type="date" {...register("date_of_birth")} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> Delivery Address
                  </Label>
                  <Textarea
                    placeholder="Enter your full delivery address..."
                    rows={3}
                    {...register("address")}
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={isUpdating || !isDirty} className="w-full sm:w-auto">
                    {isUpdating ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ── Password panel ─────────────────────────────────────────────── */}
          {section === "password" && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-6">
              <div className="pb-4 border-b border-border">
                <h2 className="font-display text-lg font-semibold">Change Password</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a strong password you don't use elsewhere
                </p>
              </div>

              <form
                onSubmit={passwordForm.handleSubmit((d) => changePassword(d))}
                className="space-y-5"
              >
                <PasswordField
                  label="Current Password"
                  error={passwordForm.formState.errors.current_password?.message}
                  registration={passwordForm.register("current_password")}
                />

                <div className="border-t border-border pt-5 space-y-5">
                  <PasswordField
                    label="New Password"
                    error={passwordForm.formState.errors.new_password?.message}
                    registration={passwordForm.register("new_password")}
                  />
                  <PasswordField
                    label="Confirm New Password"
                    error={passwordForm.formState.errors.confirm_password?.message}
                    registration={passwordForm.register("confirm_password")}
                  />
                </div>

                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Tips for a strong password</p>
                  {[
                    "At least 8 characters long",
                    "Mix of letters, numbers and symbols",
                    "Don't reuse passwords from other sites",
                  ].map((tip) => (
                    <div key={tip} className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground">{tip}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? "Changing..." : "Change password"}
                  </Button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}