import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface AuditLog {
  id: number;
  actorId: string;
  action: string;
  resource: string;
  resourceId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

function humanizeAction(action: string): string {
  return action
    .split(".")
    .map((part) => {
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function getActionColor(action: string): string {
  const actionType = action.split(".")[0];
  const colorMap: Record<string, string> = {
    user: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
    lawyer: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
    document: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    appointment: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400",
  };

  return colorMap[actionType] || "bg-muted text-muted-foreground";
}

function MetadataDisplay({ metadata }: { metadata: Record<string, unknown> }) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  return (
    <div className="space-y-1 text-sm max-w-sm">
      {Object.entries(metadata).map(([key, value]) => (
        <div key={key} className="flex gap-2">
          <span className="text-muted-foreground">{key}:</span>
          <span className="font-medium truncate">
            {typeof value === "string" ? value : JSON.stringify(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AuditLogsPage() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    window.history.pushState(null, "", "/dashboard");
    window.dispatchEvent(new PopStateEvent("popstate"));
    return null;
  }

  const {
    data: auditLogs,
    isLoading: isLogsLoading,
  } = useQuery<AuditLog[]>({
    queryKey: ["/api/admin/audit-logs"],
    queryFn: async () => {
      const url = new URL("/api/admin/audit-logs", window.location.origin);
      url.searchParams.set("limit", "100");
      const res = await fetch(url, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-accent" />
          <h1 className="font-serif text-2xl font-bold" data-testid="text-audit-logs-title">
            Audit Logs
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          View audit logs of privileged actions
        </p>
      </div>

      <Card data-testid="card-audit-logs-table">
        <CardContent className="p-0">
          {isLogsLoading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !auditLogs || auditLogs.length === 0 ? (
            <div className="text-center py-12">
              <ScrollText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Time</TableHead>
                  <TableHead className="w-24">Actor</TableHead>
                  <TableHead className="w-20">Action</TableHead>
                  <TableHead className="w-20">Resource</TableHead>
                  <TableHead className="w-40">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log, idx) => (
                  <TableRow key={`${log.id}-${idx}`} data-testid={`row-audit-log-${log.id}`}>
                    <TableCell className="text-sm text-muted-foreground">
                      <div data-testid={`text-audit-time-${log.id}`}>
                        {formatDate(log.createdAt)}
                      </div>
                      <div className="text-xs text-muted-foreground/70">
                        {new Date(log.createdAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className="text-sm truncate"
                        title={log.actorId}
                        data-testid={`text-audit-actor-${log.id}`}
                      >
                        {log.actorId}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs ${getActionColor(log.action)}`}
                        data-testid={`badge-action-${log.id}`}
                      >
                        {humanizeAction(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <span
                          className="text-sm font-medium block"
                          data-testid={`text-audit-resource-${log.id}`}
                        >
                          {log.resource}
                        </span>
                        <span
                          className="text-xs text-muted-foreground"
                          data-testid={`text-audit-resource-id-${log.id}`}
                        >
                          {log.resourceId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`cell-audit-metadata-${log.id}`}>
                      <MetadataDisplay metadata={log.metadata} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!isLogsLoading && auditLogs && auditLogs.length > 0 && (
        <div className="text-xs text-muted-foreground text-right">
          Showing {auditLogs.length} log{auditLogs.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
