import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  MessageSquare,
  Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface IntakeField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

interface DocumentType {
  id: number;
  name: string;
  description: string | null;
  category: string;
  price: string | null;
  intakeFields: IntakeField[] | null;
  isActive: boolean | null;
  createdAt: string | null;
}

interface LegalDoc {
  id: number;
  clientId: string;
  documentTypeId: number;
  assignedLawyerId: number | null;
  status: string;
  intakeAnswers: Record<string, string> | null;
  currentDraft: string | null;
  finalContent: string | null;
  reviewNotes: string | null;
  amount: string | null;
  createdAt: string | null;
}

const docStatusStyles: Record<string, string> = {
  drafting: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  awaiting_payment: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  in_review: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  needs_client_input: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  finalized: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  delivered: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  drafting: "AI Drafting",
  awaiting_payment: "Awaiting Payment",
  in_review: "Under Lawyer Review",
  needs_client_input: "Changes Requested",
  finalized: "Approved & Finalized",
  delivered: "Delivered",
};

export default function DocumentsPage() {
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, string>>({});
  const [viewingDoc, setViewingDoc] = useState<LegalDoc | null>(null);
  const [editingDoc, setEditingDoc] = useState<LegalDoc | null>(null);
  const [editedDraft, setEditedDraft] = useState("");

  const { data: documentTypes, isLoading: loadingTypes } = useQuery<DocumentType[]>({
    queryKey: ["/api/document-types"],
  });

  const { data: documents, isLoading: loadingDocs } = useQuery<LegalDoc[]>({
    queryKey: ["/api/documents"],
  });

  const createDocument = useMutation({
    mutationFn: async () => {
      if (!selectedType) throw new Error("Select a document type");
      const res = await apiRequest("POST", "/api/documents", {
        documentTypeId: selectedType.id,
        intakeAnswers,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Document Created", description: "AI is generating your draft..." });
      setShowCreate(false);
      setSelectedType(null);
      setIntakeAnswers({});
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const resubmitMutation = useMutation({
    mutationFn: async ({ docId, updatedDraft }: { docId: number; updatedDraft: string }) => {
      await apiRequest("POST", `/api/documents/${docId}/resubmit`, { updatedDraft });
    },
    onSuccess: () => {
      toast({ title: "Document Resubmitted", description: "Your updated document has been sent back for lawyer review." });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setEditingDoc(null);
      setEditedDraft("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const getDocTypeName = (docTypeId: number) => {
    return documentTypes?.find((dt) => dt.id === docTypeId)?.name || `Document Type #${docTypeId}`;
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-serif text-2xl font-bold" data-testid="text-documents-title">
            Legal Documents
          </h1>
          <p className="text-muted-foreground text-sm">
            Generate and manage AI-drafted legal documents
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-document">
              <Plus className="h-4 w-4 mr-1" />
              New Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">Generate Legal Document</DialogTitle>
            </DialogHeader>

            {!selectedType ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Choose a document type:</p>
                {loadingTypes ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : (
                  documentTypes?.map((dt) => (
                    <Card
                      key={dt.id}
                      className="hover-elevate cursor-pointer"
                      onClick={() => setSelectedType(dt)}
                      data-testid={`card-doc-type-${dt.id}`}
                    >
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-medium text-sm">{dt.name}</h3>
                          <p className="text-xs text-muted-foreground">{dt.description}</p>
                          <Badge variant="secondary" className="text-[10px] mt-1">{dt.category}</Badge>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold">${dt.price}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{selectedType.name}</h3>
                    <p className="text-xs text-muted-foreground">${selectedType.price}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedType(null)}>
                    Change
                  </Button>
                </div>

                <div className="space-y-3">
                  {(selectedType.intakeFields || []).map((field) => (
                    <div key={field.name} className="space-y-1.5">
                      <Label className="text-sm">
                        {field.label}
                        {field.required && <span className="text-destructive ml-0.5">*</span>}
                      </Label>
                      {field.type === "textarea" ? (
                        <Textarea
                          value={intakeAnswers[field.name] || ""}
                          onChange={(e) =>
                            setIntakeAnswers((prev) => ({ ...prev, [field.name]: e.target.value }))
                          }
                          className="text-sm resize-none"
                          rows={3}
                          data-testid={`input-intake-${field.name}`}
                        />
                      ) : (
                        <Input
                          value={intakeAnswers[field.name] || ""}
                          onChange={(e) =>
                            setIntakeAnswers((prev) => ({ ...prev, [field.name]: e.target.value }))
                          }
                          className="text-sm"
                          data-testid={`input-intake-${field.name}`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full"
                  onClick={() => createDocument.mutate()}
                  disabled={createDocument.isPending}
                  data-testid="button-submit-document"
                >
                  {createDocument.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-1" />
                      Generate Draft
                    </>
                  )}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {loadingDocs ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : documents?.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground">No documents yet</p>
          <p className="text-xs text-muted-foreground">
            Create your first legal document using AI
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents?.map((doc) => (
            <Card key={doc.id} data-testid={`card-document-${doc.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-sm">
                        {getDocTypeName(doc.documentTypeId)}
                      </h3>
                      <Badge className={`text-[10px] ${docStatusStyles[doc.status] || ""}`}>
                        {statusLabels[doc.status] || doc.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(doc.createdAt!).toLocaleDateString()}
                      </span>
                      {doc.amount && <span>${doc.amount}</span>}
                    </div>

                    {doc.status === "needs_client_input" && doc.reviewNotes && (
                      <div className="mt-2 p-3 rounded-md bg-orange-500/5 border border-orange-500/10">
                        <p className="text-xs font-medium text-orange-600 mb-1 flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Lawyer Feedback
                        </p>
                        <p className="text-xs text-muted-foreground">{doc.reviewNotes}</p>
                      </div>
                    )}

                    {doc.status === "finalized" && (
                      <div className="mt-2 p-3 rounded-md bg-emerald-500/5 border border-emerald-500/10">
                        <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          This document has been reviewed and approved by a lawyer
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {doc.currentDraft && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingDoc(doc)}
                        data-testid={`button-view-doc-${doc.id}`}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
                    {doc.status === "needs_client_input" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingDoc(doc);
                          setEditedDraft(doc.currentDraft || "");
                        }}
                        data-testid={`button-edit-doc-${doc.id}`}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Make Changes
                      </Button>
                    )}
                    {(doc.status === "finalized" || doc.status === "delivered") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/api/documents/${doc.id}/download`, "_blank")}
                        data-testid={`button-download-doc-${doc.id}`}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!viewingDoc} onOpenChange={(open) => !open && setViewingDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {viewingDoc ? getDocTypeName(viewingDoc.documentTypeId) : "Document"} - {viewingDoc?.status === "finalized" ? "Final" : "Draft"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Badge className={`text-[10px] ${docStatusStyles[viewingDoc?.status || ""] || ""}`}>
              {statusLabels[viewingDoc?.status || ""] || viewingDoc?.status?.replace(/_/g, " ")}
            </Badge>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-sm p-4 bg-muted/30 rounded-md border">
                {viewingDoc?.finalContent || viewingDoc?.currentDraft}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingDoc} onOpenChange={(open) => !open && setEditingDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              Edit & Resubmit - {editingDoc ? getDocTypeName(editingDoc.documentTypeId) : ""}
            </DialogTitle>
          </DialogHeader>
          {editingDoc && (
            <div className="space-y-4">
              {editingDoc.reviewNotes && (
                <div className="p-3 rounded-md bg-orange-500/5 border border-orange-500/10">
                  <p className="text-xs font-medium text-orange-600 mb-1 flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Lawyer's Feedback
                  </p>
                  <p className="text-sm text-muted-foreground">{editingDoc.reviewNotes}</p>
                </div>
              )}
              <Textarea
                value={editedDraft}
                onChange={(e) => setEditedDraft(e.target.value)}
                className="text-sm min-h-[300px] font-mono"
                data-testid="input-edited-draft"
              />
              <Button
                className="w-full"
                disabled={!editedDraft.trim() || resubmitMutation.isPending}
                onClick={() =>
                  resubmitMutation.mutate({
                    docId: editingDoc.id,
                    updatedDraft: editedDraft,
                  })
                }
                data-testid="button-resubmit-document"
              >
                {resubmitMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Resubmitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    Resubmit for Review
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
