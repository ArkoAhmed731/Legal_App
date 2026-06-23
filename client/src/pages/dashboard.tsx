import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TenantLink } from "@/components/tenant-link";
import {
  MessageSquare,
  Users,
  Calendar,
  FileText,
  ArrowRight,
  Video,
  Clock,
  TrendingUp,
} from "lucide-react";
import { APP_CONFIG } from "@/lib/app-config";
interface Appointment {
  id: number;
  clientId: string;
  professionalId: number;
  serviceType: string;
  status: string;
  scheduledDate: string;
  durationMinutes: number | null;
  notes: string | null;
  amount: string | null;
  createdAt: string | null;
}

interface LegalDoc {
  id: number;
  clientId: string;
  documentTypeId: number;
  status: string;
  currentDraft: string | null;
  amount: string | null;
  createdAt: string | null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const DisclaimerIcon = APP_CONFIG.icon;

  const { data: appointments, isLoading: loadingAppts } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: documents, isLoading: loadingDocs } = useQuery<LegalDoc[]>({
    queryKey: ["/api/documents"],
  });

  const upcomingAppts = appointments?.filter(
    (a) => a.status === "confirmed" || a.status === "hold"
  ) || [];

  const activeDocs = documents?.filter(
    (d) => d.status !== "delivered"
  ) || [];

  const quickActions = APP_CONFIG.quickActions.map((action) => ({
    ...action,
    href: action.route,
  }));

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-bold" data-testid="text-dashboard-title">
          Welcome back, {user?.firstName || "there"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {APP_CONFIG.dashboardSubtitle}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <TenantLink key={action.title} href={action.href}>
            <Card className="hover-elevate cursor-pointer transition-all duration-200 h-full" data-testid={`card-action-${action.title.toLowerCase().replace(/\s/g, "-")}`}>
              <CardContent className="p-4 space-y-3">
                <div className={`h-10 w-10 rounded-md flex items-center justify-center ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{action.title}</h3>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
              </CardContent>
            </Card>
          </TenantLink>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Upcoming Appointments
            </CardTitle>
            <TenantLink href="/bookings">
              <Button variant="ghost" size="sm" data-testid="button-view-bookings">
                View All
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </TenantLink>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingAppts ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : upcomingAppts.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Calendar className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">No upcoming appointments</p>
                <TenantLink href="/lawyers">
                  <Button size="sm" variant="outline" data-testid="button-book-now">
                    {APP_CONFIG.bookCTALabel}
                  </Button>
                </TenantLink>
              </div>
            ) : (
              upcomingAppts.slice(0, 3).map((appt) => (
                <div key={appt.id} className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{appt.serviceType}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(appt.scheduledDate).toLocaleDateString()} at{" "}
                        {new Date(appt.scheduledDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {appt.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Active Documents
            </CardTitle>
            <TenantLink href="/documents">
              <Button variant="ghost" size="sm" data-testid="button-view-documents">
                View All
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </TenantLink>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingDocs ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : activeDocs.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">No active documents</p>
                <TenantLink href="/documents">
                  <Button size="sm" variant="outline" data-testid="button-create-doc">
                    Generate a Document
                  </Button>
                </TenantLink>
              </div>
            ) : (
              activeDocs.slice(0, 3).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">Document #{doc.id}</p>
                    <p className="text-xs text-muted-foreground capitalize">{doc.status.replace(/_/g, " ")}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs capitalize">
                    {doc.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-accent/20 flex items-center justify-center">
                <DisclaimerIcon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium text-sm">{APP_CONFIG.dashboardDisclaimer}</p>
                <p className="text-xs text-muted-foreground">
                  {APP_CONFIG.dashboardDisclaimerDetail}
                </p>
              </div>
            </div>
            <TenantLink href="/ai-chat">
              <Button size="sm" data-testid="button-ask-ai">
                <MessageSquare className="mr-1 h-4 w-4" />
                {APP_CONFIG.dashboardCTALabel}
              </Button>
            </TenantLink>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
