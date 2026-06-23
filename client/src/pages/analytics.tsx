import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Users,
  FileText,
  Calendar,
  Scale,
  Clock,
  Star,
  TrendingUp,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalLawyers: number;
    totalClients: number;
    totalDocuments: number;
    totalAppointments: number;
    pendingVerifications: number;
  };
  documentsByStatus: { status: string; count: number }[];
  documentsByCategory: { category: string; count: number }[];
  appointmentsByStatus: { status: string; count: number }[];
  lawyersBySpecialty: { specialty: string; count: number }[];
  recentDocuments: {
    id: number;
    status: string;
    amount: string | null;
    createdAt: string | null;
    documentTypeName: string | null;
    documentTypeCategory: string | null;
  }[];
  recentAppointments: {
    id: number;
    status: string;
    serviceType: string;
    scheduledDate: string | null;
    amount: string | null;
    createdAt: string | null;
  }[];
  topLawyers: {
    id: number;
    specialty: string;
    rating: string | null;
    totalReviews: number | null;
    totalCases: number | null;
    firstName: string | null;
    lastName: string | null;
  }[];
}

const statusColors: Record<string, string> = {
  drafting: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  in_review: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
  needs_client_input: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
  finalized: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  delivered: "bg-muted text-muted-foreground",
  awaiting_payment: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  confirmed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  hold: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  completed: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  cancelled: "bg-destructive/10 text-destructive",
  in_progress: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
  no_show: "bg-destructive/10 text-destructive",
  expired: "bg-muted text-muted-foreground",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
};

const barColors = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-lime-500",
];

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function HorizontalBar({ items, colorSet }: { items: { label: string; value: number }[]; colorSet?: string[] }) {
  const maxVal = Math.max(...items.map((i) => i.value), 1);
  const colors = colorSet || barColors;
  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm truncate">{item.label}</span>
            <span className="text-sm font-medium text-muted-foreground shrink-0">{item.value}</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${colors[idx % colors.length]}`}
              style={{ width: `${(item.value / maxVal) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    window.history.pushState(null, "", "/dashboard");
    window.dispatchEvent(new PopStateEvent("popstate"));
    return null;
  }

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics"],
  });

  const overviewCards = data
    ? [
        { title: "Total Users", value: data.overview.totalUsers, icon: Users, color: "text-blue-600 dark:text-blue-400" },
        { title: "Verified Lawyers", value: data.overview.totalLawyers, icon: Scale, color: "text-emerald-600 dark:text-emerald-400" },
        { title: "Clients", value: data.overview.totalClients, icon: Briefcase, color: "text-purple-600 dark:text-purple-400" },
        { title: "Documents", value: data.overview.totalDocuments, icon: FileText, color: "text-amber-600 dark:text-amber-400" },
        { title: "Appointments", value: data.overview.totalAppointments, icon: Calendar, color: "text-cyan-600 dark:text-cyan-400" },
        { title: "Pending Reviews", value: data.overview.pendingVerifications, icon: Clock, color: "text-rose-600 dark:text-rose-400" },
      ]
    : [];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-accent" />
        <div>
          <h1 className="font-serif text-2xl font-bold" data-testid="text-analytics-title">
            Analytics
          </h1>
          <p className="text-muted-foreground text-sm">Platform performance and insights</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div className="space-y-1">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))
          : overviewCards.map((card) => (
              <Card key={card.title} data-testid={`card-stat-${card.title.toLowerCase().replace(/\s/g, "-")}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-md bg-muted flex items-center justify-center ${card.color}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-xs text-muted-foreground">{card.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card data-testid="card-documents-by-status">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Documents by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : data?.documentsByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No documents yet</p>
            ) : (
              <HorizontalBar
                items={(data?.documentsByStatus || []).map((d) => ({
                  label: formatStatusLabel(d.status),
                  value: d.count,
                }))}
              />
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-documents-by-category">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Documents by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : data?.documentsByCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No documents yet</p>
            ) : (
              <HorizontalBar
                items={(data?.documentsByCategory || []).map((d) => ({
                  label: d.category,
                  value: d.count,
                }))}
              />
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-appointments-by-status">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Appointments by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : data?.appointmentsByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No appointments yet</p>
            ) : (
              <HorizontalBar
                items={(data?.appointmentsByStatus || []).map((d) => ({
                  label: formatStatusLabel(d.status),
                  value: d.count,
                }))}
              />
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-lawyers-by-specialty">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Scale className="h-4 w-4 text-muted-foreground" />
              Lawyers by Specialty
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : data?.lawyersBySpecialty.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No lawyers yet</p>
            ) : (
              <HorizontalBar
                items={(data?.lawyersBySpecialty || []).map((d) => ({
                  label: d.specialty,
                  value: d.count,
                }))}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card data-testid="card-top-lawyers">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              Top Rated Lawyers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : data?.topLawyers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No lawyers yet</p>
            ) : (
              <div className="space-y-3">
                {data?.topLawyers.map((lawyer, idx) => (
                  <div
                    key={lawyer.id}
                    className="flex items-center justify-between gap-3"
                    data-testid={`row-top-lawyer-${lawyer.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {lawyer.firstName} {lawyer.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{lawyer.specialty}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-medium">{Number(lawyer.rating || 0).toFixed(1)}</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {lawyer.totalCases || 0} cases
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-recent-documents">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Recent Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : data?.recentDocuments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No documents yet</p>
            ) : (
              <div className="space-y-3">
                {data?.recentDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3"
                    data-testid={`row-recent-doc-${doc.id}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.documentTypeName || "Document"}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "N/A"}
                        {doc.amount ? ` - $${doc.amount}` : ""}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] shrink-0 ${statusColors[doc.status] || "bg-muted text-muted-foreground"}`}
                    >
                      {formatStatusLabel(doc.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-recent-appointments">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Recent Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : data?.recentAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No appointments yet</p>
          ) : (
            <div className="space-y-3">
              {data?.recentAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between gap-3 flex-wrap"
                  data-testid={`row-recent-appt-${appt.id}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {formatStatusLabel(appt.serviceType)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {appt.scheduledDate
                        ? new Date(appt.scheduledDate).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "Not scheduled"}
                      {appt.amount ? ` - $${appt.amount}` : ""}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] shrink-0 ${statusColors[appt.status] || "bg-muted text-muted-foreground"}`}
                  >
                    {formatStatusLabel(appt.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
