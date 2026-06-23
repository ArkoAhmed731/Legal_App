import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, ArrowLeft, Trash2, AlertTriangle } from "lucide-react";

const roleLabels: Record<string, string> = {
  client: "Client",
  professional: "Professional",
  tenant_admin: "Admin",
  superadmin: "Super Admin",
};

export default function EditProfilePage() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/auth/delete-account");
      return res.json();
    },
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (err: Error) => {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    },
  });

  if (!user) return null;

  const initials = `${(user.firstName || "U")[0]}${(user.lastName || "")[0] || ""}`;
  const displayImageUrl = previewUrl || user.profileImageUrl || "";

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a JPG, PNG, GIF, or WebP image.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setIsUploading(true);

    try {
      const urlRes = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type,
        }),
      });

      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await urlRes.json();

      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) throw new Error("Failed to upload image");

      const saveRes = await fetch("/api/auth/profile-picture", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profileImageUrl: objectPath }),
      });

      if (!saveRes.ok) throw new Error("Failed to save profile picture");

      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Profile picture updated", description: "Your new profile picture has been saved." });
    } catch (error) {
      setPreviewUrl(null);
      toast({ title: "Upload failed", description: "Something went wrong while uploading your picture. Please try again.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleBack = () => {
    window.history.pushState(null, "", "/dashboard");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleBack} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-serif font-bold" data-testid="text-page-title">Edit Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Picture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24">
                <AvatarImage src={displayImageUrl} data-testid="img-profile-picture" />
                <AvatarFallback className="text-2xl bg-muted">{initials}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-wait"
                data-testid="button-change-picture-overlay"
              >
                {isUploading ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleFileSelect}
                data-testid="input-profile-picture"
              />
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                data-testid="button-change-picture"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Change Picture
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">JPG, PNG, GIF or WebP. Max 5MB.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium" data-testid="text-profile-name">
                {user.firstName || ""} {user.lastName || ""}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium" data-testid="text-profile-email">{user.email || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge variant="secondary" data-testid="badge-profile-role">
                {roleLabels[user.role] || user.role}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="font-medium" data-testid="text-profile-joined">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!isAdmin && (
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-lg text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showDeleteConfirm ? (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-medium">Delete Account</p>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="text-destructive border-destructive/30"
                  onClick={() => setShowDeleteConfirm(true)}
                  data-testid="button-show-delete"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            ) : (
              <div className="space-y-4 p-4 rounded-md bg-destructive/5 border border-destructive/10">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Are you sure?</p>
                    <p className="text-xs text-muted-foreground">
                      This will permanently delete your account, all your documents, appointments, conversations, and any other data. This cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delete-confirm" className="text-xs text-muted-foreground">
                    Type <span className="font-mono font-bold text-foreground">DELETE</span> to confirm
                  </Label>
                  <Input
                    id="delete-confirm"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    data-testid="input-delete-confirm"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="destructive"
                    disabled={deleteConfirmText !== "DELETE" || deleteAccountMutation.isPending}
                    onClick={() => deleteAccountMutation.mutate()}
                    data-testid="button-confirm-delete"
                  >
                    {deleteAccountMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Permanently Delete
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                    data-testid="button-cancel-delete"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
