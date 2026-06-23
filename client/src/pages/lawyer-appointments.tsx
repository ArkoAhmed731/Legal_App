import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  User,
  XCircle,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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

const statusStyles: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
  confirmed: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle, label: "Confirmed" },
  hold: { color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock, label: "On Hold" },
  in_progress: { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: AlertCircle, label: "In Progress" },
  completed: { color: "bg-muted text-muted-foreground", icon: CheckCircle, label: "Completed" },
  cancelled: { color: "bg-destructive/10 text-destructive", icon: XCircle, label: "Cancelled" },
  expired: { color: "bg-muted text-muted-foreground", icon: XCircle, label: "Expired" },
  no_show: { color: "bg-destructive/10 text-destructive", icon: XCircle, label: "No Show" },
};

export default function LawyerAppointmentsPage() {
  const { toast } = useToast();

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/lawyer/appointments"],
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("POST", `/api/lawyer/appointments/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({ title: "Status Updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/lawyer/appointments"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const upcoming = appointments?.filter((a) => ["confirmed", "hold", "in_progress"].includes(a.status)) || [];
  const past = appointments?.filter((a) => ["completed", "cancelled", "expired", "no_show"].includes(a.status)) || [];

  const renderAppointment = (appt: Appointment) => {
    const style = statusStyles[appt.status] || statusStyles.hold;
    const StatusIcon = style.icon;
    const isActive = ["confirmed", "hold", "in_progress"].includes(appt.status);

    return (
      <Card key={appt.id} data-testid={`card-lawyer-appointment-${appt.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-sm capitalize">{appt.serviceType.replace(/-/g, " ")}</h3>
                <Badge className={`text-[10px] ${style.color}`}>
                  <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                  {style.label}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(appt.scheduledDate).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(appt.scheduledDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {appt.durationMinutes} min
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Client
                </span>
              </div>
              {appt.notes && (
                <p className="text-xs text-muted-foreground line-clamp-2">{appt.notes}</p>
              )}
              {appt.amount && (
                <p className="text-sm font-semibold">${appt.amount}</p>
              )}
            </div>
            {isActive && (
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => statusMutation.mutate({ id: appt.id, status: "completed" })}
                  disabled={statusMutation.isPending}
                  data-testid={`button-complete-${appt.id}`}
                >
                  {statusMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                  Complete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => statusMutation.mutate({ id: appt.id, status: "cancelled" })}
                  disabled={statusMutation.isPending}
                  data-testid={`button-cancel-lawyer-${appt.id}`}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-bold" data-testid="text-lawyer-appointments-title">
          My Appointments
        </h1>
        <p className="text-muted-foreground text-sm">
          View and manage your scheduled client appointments.
        </p>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList data-testid="tabs-lawyer-appointments">
          <TabsTrigger value="upcoming" data-testid="tab-lawyer-upcoming">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past" data-testid="tab-lawyer-past">
            Past ({past.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="space-y-3 mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-muted-foreground text-sm">No upcoming appointments</p>
              <p className="text-xs text-muted-foreground">
                Appointments will appear here when clients book consultations with you.
              </p>
            </div>
          ) : (
            upcoming.map(renderAppointment)
          )}
        </TabsContent>
        <TabsContent value="past" className="space-y-3 mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : past.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-muted-foreground text-sm">No past appointments</p>
            </div>
          ) : (
            past.map(renderAppointment)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
