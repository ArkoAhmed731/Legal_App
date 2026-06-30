import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Calendar, CheckCircle, Clock, TrendingUp } from "lucide-react";

interface EarningsData {
  total: string;
  completed: number;
  pending: number;
  appointments: {
    id: number;
    serviceType: string;
    status: string;
    scheduledDate: string;
    amount: string | null;
    clientId: string;
  }[];
}

const statusStyles: Record<string, string> = {
  completed:  "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  confirmed:  "bg-blue-500/10 text-blue-600 border-blue-500/20",
  hold:       "bg-amber-500/10 text-amber-600 border-amber-500/20",
  cancelled:  "bg-muted text-muted-foreground",
  no_show:    "bg-destructive/10 text-destructive border-destructive/20",
  in_progress:"bg-purple-500/10 text-purple-600 border-purple-500/20",
};

export default function LawyerEarningsPage() {
  const { data, isLoading } = useQuery<EarningsData>({
    queryKey: ["/api/lawyer/earnings"],
  });

  const statCards = [
    {
      label: "Total Earnings",
      value: data ? `$${parseFloat(data.total).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—",
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
      sub: "From completed appointments",
    },
    {
      label: "Completed Sessions",
      value: data?.completed ?? "—",
      icon: CheckCircle,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
      sub: "Fully delivered appointments",
    },
    {
      label: "Upcoming / Pending",
      value: data?.pending ?? "—",
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
      sub: "Confirmed or on hold",
    },
    {
      label: "Total Appointments",
      value: data?.appointments.length ?? "—",
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-500/10",
      sub: "All time",
    },
  ];

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-bold">Earnings Overview</h1>
        <p className="text-muted-foreground text-sm">
          A summary of your professional earnings and appointment history on the platform.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className={`h-10 w-10 rounded-md flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                {isLoading ? (
                  <Skeleton className="h-7 w-16 mb-1" />
                ) : (
                  <p className="text-xl font-bold truncate">{stat.value}</p>
                )}
                <p className="text-xs font-medium">{stat.label}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{stat.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Appointment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : !data?.appointments.length ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No appointments recorded yet.
            </div>
          ) : (
            <div className="space-y-2">
              {data.appointments.map(appt => (
                <div key={appt.id} className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center border shrink-0">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate capitalize">{appt.serviceType}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(appt.scheduledDate).toLocaleDateString("en-US", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                        {" · "}
                        {new Date(appt.scheduledDate).toLocaleTimeString("en-US", {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge className={`text-xs ${statusStyles[appt.status] || "bg-muted text-muted-foreground"}`}>
                      {appt.status.replace(/_/g, " ")}
                    </Badge>
                    <span className={`text-sm font-semibold min-w-[60px] text-right ${appt.status === "completed" ? "text-emerald-600" : "text-muted-foreground"}`}>
                      {appt.amount ? `$${parseFloat(appt.amount).toFixed(2)}` : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
