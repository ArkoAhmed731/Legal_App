import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface TenantFeatureFlags {
  AI_CHAT_ENABLED: boolean;
  APPOINTMENTS_ENABLED: boolean;
  DOCUMENT_SYSTEM_ENABLED: boolean;
  VIDEO_LIBRARY_ENABLED: boolean;
  CRISIS_HANDLING_ENABLED: boolean;
  JOURNALING_ENABLED: boolean;
}

export interface TenantConfig {
  featureFlags: TenantFeatureFlags;
  aiConfig: {
    mode: string;
    model: string;
    maxTokens: number;
    requireCitations: boolean;
  };
  commissionPercentage: number;
  theme?: {
    primaryColor?: string;
    accentColor?: string;
    logo?: string;
  };
}

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  role: "client" | "professional" | "tenant_admin";
  profileId: number;
  phone: string | null;
  country: string | null;
  state: string | null;
  bio: string | null;
  onboardingComplete: boolean | null;
  tenantConfig: TenantConfig | null;
  verificationStatus: "pending" | "verified" | "rejected" | null;
}

async function fetchUser(): Promise<AuthUser | null> {
  const response = await fetch("/api/auth/user", {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function logout(): Promise<void> {
  await fetch("/api/logout", { method: "POST", credentials: "include" });
  window.location.href = "/";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  const role = user?.role || "client";
  const isAdmin = role === "tenant_admin";
  const isLawyer = role === "professional";
  const verificationStatus = user?.verificationStatus || null;
  const isVerifiedProfessional = role === "professional" && verificationStatus === "verified";
  const isPendingVerification = role === "professional" && verificationStatus !== "verified";

  const featureFlags = user?.tenantConfig?.featureFlags || {
    AI_CHAT_ENABLED: true,
    APPOINTMENTS_ENABLED: true,
    DOCUMENT_SYSTEM_ENABLED: true,
    VIDEO_LIBRARY_ENABLED: true,
    CRISIS_HANDLING_ENABLED: false,
    JOURNALING_ENABLED: false,
  };

  const hasFeature = (flag: keyof TenantFeatureFlags): boolean => {
    return featureFlags[flag] ?? false;
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    role,
    isAdmin,
    isLawyer,
    verificationStatus,
    isVerifiedProfessional,
    isPendingVerification,
    tenantConfig: user?.tenantConfig || null,
    featureFlags,
    hasFeature,
  };
}
