import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  MessageSquare,
  Loader2,
  User,
  Briefcase,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ReviewDocument {
  id: number;
  clientId: string;
  documentTypeId: number;
  assignedLawyerId: number | null;
  status: string;
  currentDraft: string | null;
  reviewNotes: string | null;
  amount: string | null;
  createdAt: string | null;
  documentType: { name: string; category: string; description: string | null } | null;
  client: { id: string; firstName: string | null; lastName: string | null; email: string | null } | null;
}

const statusStyles: Record<string, string> = {
  drafting: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  in_review: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  needs_client_input: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  finalized: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  delivered: "bg-muted text-muted-foreground",
  awaiting_payment: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

export default function LawyerReviewPage() {
  const { toast } = useToast();
  const [viewingDoc, setViewingDoc] = useState<ReviewDocument | null>(null);
  const [requestChangesDoc, setRequestChangesDoc] = useState<ReviewDocument | null>(null);
  const [changeNotes, setChangeNotes] = useState("");

  const { data: documents, isLoading } = useQuery<ReviewDocument[]>({
    queryKey: ["/api/lawyer/documents"],
  });

  const approveMutation = useMutation({
    mutationFn: async (docId: number) => {
      await apiRequest("POST", `/api/lawyer/documents/${docId}/approve`);
    },
    onSuccess: () => {
      toast({ title: "Document Approved", description: "The document has been finalized." });
      queryClient.invalidateQueries({ queryKey: ["/api/lawyer/documents"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const requestChangesMutation = useMutation({
    mutationFn: async ({ docId, notes }: { docId: number; notes: string }) => {
      await apiRequest("POST", `/api/lawyer/documents/${docId}/request-changes`, { notes });
    },
    onSuccess: () => {
      toast({ title: "Changes Requested", description: "The client has been notified to make changes." });
      queryClient.invalidateQueries({ queryKey: ["/api/lawyer/documents"] });
      setRequestChangesDoc(null);
      setChangeNotes("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const pendingReview = documents?.filter((d) => d.status === "in_review") || [];
  const awaitingClient = documents?.filter((d) => d.status === "needs_client_input") || [];
  const completed = documents?.filter((d) => d.status === "finalized" || d.status === "delivered") || [];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2">
        <Briefcase className="h-6 w-6 text-accent" />
        <div>
          <h1 className="font-serif text-2xl font-bold" data-testid="text-lawyer-review-title">
            Document Reviews
          </h1>
          <p className="text-muted-foreground text-sm">
            Review and approve documents assigned to you
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : documents?.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground">No documents assigned to you</p>
          <p className="text-xs text-muted-foreground">
            Documents will appear here when an admin assigns them to you for review
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {pendingReview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-purple-500" />
                <h2 className="font-medium text-sm">Pending Your Review ({pendingReview.length})</h2>
              </div>
              {pendingReview.map((doc) => (
                <Card key={doc.id} data-testid={`card-review-doc-${doc.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-sm">
                            {doc.documentType?.name || `Document #${doc.id}`}
                          </h3>
                          <Badge className={`text-[10px] ${statusStyles[doc.status] || ""}`}>
                            {doc.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Client: {doc.client?.firstName} {doc.client?.lastName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "N/A"}
                          </span>
                          {doc.amount && <span>${doc.amount}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {doc.currentDraft && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingDoc(doc)}
                            data-testid={`button-view-draft-${doc.id}`}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Draft
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRequestChangesDoc(doc);
                            setChangeNotes("");
                          }}
                          data-testid={`button-request-changes-${doc.id}`}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Request Changes
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(doc.id)}
                          disabled={approveMutation.isPending}
                          data-testid={`button-approve-doc-${doc.id}`}
                        >
                          {approveMutation.isPending ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {awaitingClient.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <h2 className="font-medium text-sm">Awaiting Client Changes ({awaitingClient.length})</h2>
              </div>
              {awaitingClient.map((doc) => (
                <Card key={doc.id} data-testid={`card-awaiting-doc-${doc.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-sm">
                            {doc.documentType?.name || `Document #${doc.id}`}
                          </h3>
                          <Badge className={`text-[10px] ${statusStyles[doc.status] || ""}`}>
                            needs client input
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {doc.client?.firstName} {doc.client?.lastName}
                          </span>
                        </div>
                        {doc.reviewNotes && (
                          <div className="mt-2 p-3 rounded-md bg-orange-500/5 border border-orange-500/10">
                            <p className="text-xs font-medium text-orange-600 mb-1">Your feedback:</p>
                            <p className="text-xs text-muted-foreground">{doc.reviewNotes}</p>
                          </div>
                        )}
                      </div>
                      {doc.currentDraft && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingDoc(doc)}
                          data-testid={`button-view-awaiting-${doc.id}`}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {completed.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <h2 className="font-medium text-sm">Completed ({completed.length})</h2>
              </div>
              {completed.map((doc) => (
                <Card key={doc.id} data-testid={`card-completed-doc-${doc.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-sm">
                            {doc.documentType?.name || `Document #${doc.id}`}
                          </h3>
                          <Badge className={`text-[10px] ${statusStyles[doc.status] || ""}`}>
                            {doc.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {doc.client?.firstName} {doc.client?.lastName}
                        </p>
                      </div>
                      {doc.currentDraft && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingDoc(doc)}
                          data-testid={`button-view-completed-${doc.id}`}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={!!viewingDoc} onOpenChange={(open) => !open && setViewingDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {viewingDoc?.documentType?.name || `Document #${viewingDoc?.id}`} - Draft
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>Client: {viewingDoc?.client?.firstName} {viewingDoc?.client?.lastName}</span>
              <Badge className={`text-[10px] ${statusStyles[viewingDoc?.status || ""] || ""}`}>
                {viewingDoc?.status?.replace(/_/g, " ")}
              </Badge>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-sm p-4 bg-muted/30 rounded-md border">
                {viewingDoc?.currentDraft}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!requestChangesDoc} onOpenChange={(open) => !open && setRequestChangesDoc(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Request Changes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Describe what changes the client needs to make to{" "}
              <span className="font-medium text-foreground">
                {requestChangesDoc?.documentType?.name || `Document #${requestChangesDoc?.id}`}
              </span>
            </p>
            <Textarea
              placeholder="e.g., Please provide the correct party names and update the termination clause to include a 30-day notice period..."
              value={changeNotes}
              onChange={(e) => setChangeNotes(e.target.value)}
              className="resize-none text-sm"
              rows={5}
              data-testid="input-change-notes"
            />
            <Button
              className="w-full"
              disabled={!changeNotes.trim() || requestChangesMutation.isPending}
              onClick={() =>
                requestChangesDoc &&
                requestChangesMutation.mutate({
                  docId: requestChangesDoc.id,
                  notes: changeNotes,
                })
              }
              data-testid="button-submit-changes-request"
            >
              {requestChangesMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Send Change Request
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
