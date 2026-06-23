import { useLocation } from "wouter";
import {
  Home,
  MessageSquare,
  Users,
  Calendar,
  FileText,
  Video,
  Shield,
  BarChart3,
  LogOut,
  ClipboardCheck,
  UserCog,
  ScrollText,
  Scale,
  UserPen,
  Lock,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const defaultRoleLabels: Record<string, string> = {
  client: "Client",
  professional: "Lawyer",
  tenant_admin: "Admin",
};

const roleBadgeStyles: Record<string, string> = {
  client: "",
  professional: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  tenant_admin: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

function useNavigate() {
  return (path: string) => {
    window.history.pushState(null, "", path);
  };
}

export function AppSidebar() {
  const [location] = useLocation();
  const navigate = useNavigate();
  const { user, role, isAdmin, isLawyer, hasFeature, isPendingVerification } = useAuth();

  const currentPath = window.location.pathname;

  const initials = user
    ? `${(user.firstName || "U")[0]}${(user.lastName || "")[0] || ""}`
    : "U";

  const lockedPaths = isPendingVerification
    ? ["/ai-chat", "/lawyers", "/bookings", "/documents", "/videos"]
    : [];

  const clientMenu = [
    { title: "Dashboard", url: "/dashboard", icon: Home, show: true },
    { title: "AI Assistant", url: "/ai-chat", icon: MessageSquare, show: hasFeature("AI_CHAT_ENABLED") },
    { title: "Find Lawyers", url: "/lawyers", icon: Users, show: hasFeature("APPOINTMENTS_ENABLED") },
    { title: "My Bookings", url: "/bookings", icon: Calendar, show: hasFeature("APPOINTMENTS_ENABLED") },
    { title: "Documents", url: "/documents", icon: FileText, show: hasFeature("DOCUMENT_SYSTEM_ENABLED") },
    { title: "Legal Videos", url: "/videos", icon: Video, show: hasFeature("VIDEO_LIBRARY_ENABLED") },
  ].filter((item) => item.show);

  const lawyerMenu = [
    { title: "My Appointments", url: "/lawyer/appointments", icon: Calendar, show: hasFeature("APPOINTMENTS_ENABLED") },
    { title: "Document Reviews", url: "/lawyer/reviews", icon: ClipboardCheck, show: hasFeature("DOCUMENT_SYSTEM_ENABLED") },
  ].filter((item) => item.show);

  const adminMenu = [
    { title: "Admin Panel", url: "/admin", icon: Shield },
    { title: "User Management", url: "/admin/users", icon: UserCog },
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
    { title: "Audit Logs", url: "/admin/audit-logs", icon: ScrollText },
  ];

  const handleNav = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    navigate(url);
  };

  const isActive = (url: string) => currentPath === url || currentPath.startsWith(url + "/");

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Scale className="h-6 w-6 text-sidebar-primary" />
          <span className="font-serif text-lg font-bold text-sidebar-foreground">
            Bichar Bebostha
          </span>
          <Badge
            variant="outline"
            className="text-[10px] border-sidebar-border text-sidebar-foreground/60"
            data-testid="badge-tenant"
          >
            Law
          </Badge>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {clientMenu.map((item) => {
                const isLocked = lockedPaths.includes(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      <a href={item.url} onClick={(e) => handleNav(e, item.url)} className={isLocked ? "opacity-50" : ""}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {isLocked && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isLawyer && lawyerMenu.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
              Lawyer
              {isPendingVerification && (
                <Badge variant="outline" className="ml-2 text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                  Pending
                </Badge>
              )}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {lawyerMenu.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      <a href={item.url} onClick={(e) => handleNav(e, item.url)} className={isPendingVerification ? "opacity-50" : ""}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {isPendingVerification && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenu.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      <a href={item.url} onClick={(e) => handleNav(e, item.url)}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImageUrl || ""} />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-medium text-sidebar-foreground truncate" data-testid="text-user-name">
                {user?.firstName || "User"} {user?.lastName || ""}
              </p>
              {role !== "client" && (
                <Badge className={`text-[9px] px-1.5 py-0 ${roleBadgeStyles[role] || ""}`} data-testid="badge-user-role">
                  {defaultRoleLabels[role] || role}
                </Badge>
              )}
            </div>
            <p className="text-xs text-sidebar-foreground/50 truncate">
              {user?.email || ""}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e: React.MouseEvent) => { e.preventDefault(); handleNav(e, "/profile"); }}
              data-testid="button-edit-profile"
            >
              <UserPen className="h-4 w-4 text-sidebar-foreground/50" />
            </Button>
            <a href="/api/logout" data-testid="button-logout">
              <LogOut className="h-4 w-4 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors" />
            </a>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
