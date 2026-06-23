import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserCog,
  Search,
  Shield,
  Briefcase,
  User,
  Crown,
  Loader2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface UserWithProfile {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: string | null;
  role: string | null;
  phone: string | null;
  country: string | null;
  state: string | null;
  onboardingComplete: boolean | null;
  tenantId: string | null;
}

const roleConfig: Record<string, { label: string; style: string; icon: any }> = {
  client: { label: "Client", style: "bg-muted text-muted-foreground", icon: User },
  professional: { label: "Lawyer", style: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Briefcase },
  tenant_admin: { label: "Admin", style: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Shield },
  superadmin: { label: "Super Admin", style: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: Crown },
};

export default function AdminUsersPage() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<UserWithProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [deletingUser, setDeletingUser] = useState<UserWithProfile | null>(null);

  if (!isAdmin) {
    window.history.pushState(null, "", "/dashboard");
    window.dispatchEvent(new PopStateEvent("popstate"));
    return null;
  }

  const { data: allUsers, isLoading } = useQuery<UserWithProfile[]>({
    queryKey: ["/api/admin/users"],
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiRequest("POST", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      toast({ title: "Role Updated", description: "User role has been updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setEditingUser(null);
      setSelectedRole("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "User Deleted", description: "The user account and all associated data have been permanently deleted." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setDeletingUser(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const filteredUsers = allUsers?.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.firstName?.toLowerCase().includes(q)) ||
      (u.lastName?.toLowerCase().includes(q)) ||
      (u.email?.toLowerCase().includes(q)) ||
      (u.role?.toLowerCase().includes(q)) ||
      u.id.toLowerCase().includes(q)
    );
  }) || [];

  const roleCounts = {
    total: allUsers?.length || 0,
    clients: allUsers?.filter((u) => (u.role || "client") === "client").length || 0,
    lawyers: allUsers?.filter((u) => u.role === "professional").length || 0,
    admins: allUsers?.filter((u) => u.role === "tenant_admin").length || 0,
    superadmins: allUsers?.filter((u) => u.role === "superadmin").length || 0,
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-bold" data-testid="text-user-management-title">
          User Management
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage user accounts and roles
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Card className="flex-1 min-w-[120px]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold" data-testid="text-total-users">{roleCounts.total}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[120px]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{roleCounts.clients}</p>
            <p className="text-xs text-muted-foreground">Clients</p>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[120px]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{roleCounts.lawyers}</p>
            <p className="text-xs text-muted-foreground">Lawyers</p>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[120px]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{roleCounts.admins}</p>
            <p className="text-xs text-muted-foreground">Admins</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 text-sm"
          data-testid="input-search-users"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <UserCog className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No users found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map((u) => {
            const userRole = u.role || "client";
            const config = roleConfig[userRole] || roleConfig.client;
            const RoleIcon = config.icon;
            return (
              <Card key={u.id} data-testid={`card-user-${u.id}`}>
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <RoleIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">
                          {u.firstName || ""} {u.lastName || ""} {!u.firstName && !u.lastName ? u.email || u.id : ""}
                        </p>
                        <Badge className={`text-[10px] ${config.style}`} data-testid={`badge-role-${u.id}`}>
                          {config.label}
                        </Badge>
                        {!u.tenantId && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            No profile
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{u.email || u.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingUser(u);
                          setSelectedRole(userRole);
                        }}
                        data-testid={`button-edit-role-${u.id}`}
                      >
                        <UserCog className="h-3 w-3 mr-1" />
                        Change Role
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingUser(u)}
                        data-testid={`button-delete-user-${u.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Change User Role</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="text-sm">
                <p className="font-medium">
                  {editingUser.firstName || ""} {editingUser.lastName || ""}
                </p>
                <p className="text-muted-foreground text-xs">{editingUser.email || editingUser.id}</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Select new role:</p>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger data-testid="select-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="professional">Lawyer</SelectItem>
                    <SelectItem value="tenant_admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                disabled={selectedRole === (editingUser.role || "client") || updateRoleMutation.isPending}
                onClick={() =>
                  updateRoleMutation.mutate({
                    userId: editingUser.id,
                    role: selectedRole,
                  })
                }
                data-testid="button-confirm-role-change"
              >
                {updateRoleMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Role"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete User
            </DialogTitle>
          </DialogHeader>
          {deletingUser && (
            <div className="space-y-4">
              <div className="text-sm">
                <p className="font-medium">
                  {deletingUser.firstName || ""} {deletingUser.lastName || ""}
                </p>
                <p className="text-muted-foreground text-xs">{deletingUser.email || deletingUser.id}</p>
                <Badge className={`mt-1 text-[10px] ${roleConfig[deletingUser.role || "client"]?.style || ""}`}>
                  {roleConfig[deletingUser.role || "client"]?.label || deletingUser.role}
                </Badge>
              </div>

              <div className="p-3 rounded-md bg-destructive/5 border border-destructive/10">
                <p className="text-xs text-muted-foreground">
                  This will permanently delete this user's account and all their data including documents, appointments, conversations, and reviews. This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={deleteUserMutation.isPending}
                  onClick={() => deleteUserMutation.mutate(deletingUser.id)}
                  data-testid="button-confirm-delete-user"
                >
                  {deleteUserMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete User
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setDeletingUser(null)}
                  data-testid="button-cancel-delete-user"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
