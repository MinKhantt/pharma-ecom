import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Shield, User } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { usersApi } from "@/api/users";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

export default function UsersAdminPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => usersApi.getAllUsers(0, 100),
  });

  const { mutate: deleteUser } = useMutation({
    mutationFn: usersApi.deleteUser,
    onSuccess: () => {
      toast.success("User deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail ?? "Delete failed"),
  });

  if (isLoading) return <LoadingSpinner className="py-12" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {users?.length ?? 0} registered users
        </p>
      </div>

      <div className="space-y-3">
        {users?.map((user) => {
          const initials = user.full_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();

          return (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.profile?.avatar_url ?? ""} />
                    <AvatarFallback className="text-sm">{initials}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{user.full_name}</span>
                      {user.is_superuser && (
                        <Badge className="bg-primary/10 text-primary border-0 text-xs">
                          <Shield className="h-3 w-3 mr-1" /> Admin
                        </Badge>
                      )}
                      {!user.is_active && (
                        <Badge variant="destructive" className="text-xs">Inactive</Badge>
                      )}
                      {!user.is_profile_complete && (
                        <Badge variant="secondary" className="text-xs">Incomplete profile</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">Joined {formatDate(user.created_at)}</p>
                  </div>

                  {user.id !== currentUser?.id && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => deleteUser(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
