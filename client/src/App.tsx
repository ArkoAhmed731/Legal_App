import { useSyncExternalStore } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import LandingPage from "@/pages/landing";
import DashboardPage from "@/pages/dashboard";
import AiChatPage from "@/pages/ai-chat";
import LawyersPage from "@/pages/lawyers";
import LawyerProfilePage from "@/pages/lawyer-profile";
import BookingsPage from "@/pages/bookings";
import DocumentsPage from "@/pages/documents";
import VideosPage from "@/pages/videos";
import AdminPage from "@/pages/admin";
import AdminUsersPage from "@/pages/admin-users";
import AnalyticsPage from "@/pages/analytics";
import LawyerReviewPage from "@/pages/lawyer-review";
import RegisterLawyerPage from "@/pages/register-lawyer";
import LawyerAppointmentsPage from "@/pages/lawyer-appointments";
import AuditLogsPage from "@/pages/audit-logs";
import AdminLoginPage from "@/pages/admin-login";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import RoleSelectionPage from "@/pages/role-selection";
import EditProfilePage from "@/pages/edit-profile";
import VerificationLock from "@/components/verification-lock";
import NotFound from "@/pages/not-found";

const locationEvents = ["popstate", "pushState", "replaceState", "hashchange"];
function subscribeToLocation(cb: () => void) {
  for (const e of locationEvents) addEventListener(e, cb);
  return () => { for (const e of locationEvents) removeEventListener(e, cb); };
}
function getPathname() { return location.pathname; }
function usePathname() {
  return useSyncExternalStore(subscribeToLocation, getPathname, getPathname);
}

function Router() {
  const pathname = usePathname();
  const { isAdmin, isLawyer, isPendingVerification, verificationStatus } = useAuth();

  const lockedRoutes = ["/ai-chat", "/lawyers", "/bookings", "/documents", "/videos",
    "/lawyer/appointments", "/lawyer/reviews"];

  if (isPendingVerification && lockedRoutes.includes(pathname)) {
    return <VerificationLock verificationStatus={verificationStatus as "pending" | "rejected"} />;
  }

  const lawyerMatch = pathname.match(/^\/lawyers\/(\d+)$/);
  if (lawyerMatch) {
    if (isPendingVerification) return <VerificationLock verificationStatus={verificationStatus as "pending" | "rejected"} />;
    return <LawyerProfilePage id={lawyerMatch[1]} />;
  }

  switch (pathname) {
    case "/":
    case "/dashboard":
      return <DashboardPage />;
    case "/ai-chat":
      return <AiChatPage />;
    case "/lawyers":
      return <LawyersPage />;
    case "/bookings":
      return <BookingsPage />;
    case "/documents":
      return <DocumentsPage />;
    case "/videos":
      return <VideosPage />;
    case "/register/lawyer":
      return <RegisterLawyerPage />;
    case "/profile":
      return <EditProfilePage />;
    case "/lawyer/appointments":
      return isLawyer || isAdmin ? <LawyerAppointmentsPage /> : <NotFound />;
    case "/lawyer/reviews":
      return isLawyer || isAdmin ? <LawyerReviewPage /> : <NotFound />;
    case "/admin":
      return isAdmin ? <AdminPage /> : <NotFound />;
    case "/admin/users":
      return isAdmin ? <AdminUsersPage /> : <NotFound />;
    case "/admin/analytics":
      return isAdmin ? <AnalyticsPage /> : <NotFound />;
    case "/admin/audit-logs":
      return isAdmin ? <AuditLogsPage /> : <NotFound />;
    default:
      return <NotFound />;
  }
}

function AppLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-3 w-24 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  const role = (user as any).role;
  if (role !== "tenant_admin" && !(user as any).onboardingComplete) {
    const initialStep = role === "professional" ? 3 : undefined;
    return <RoleSelectionPage initialStep={initialStep} />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-2 p-2 border-b shrink-0 sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const pathname = usePathname();

  if (pathname === "/admin-login") return <AdminLoginPage />;
  if (pathname === "/login") return <LoginPage />;
  if (pathname === "/register") return <RegisterPage />;

  return <AppLayout />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
