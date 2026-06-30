import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  FileText,
  Calendar,
  BadgeCheck,
  AlertTriangle,
  Video,
  Plus,
  Trash2,
  Loader2,
  Globe,
  BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AdminStats {
  totalLawyers: number;
  pendingVerifications: number;
  totalAppointments: number;
  totalDocuments: number;
  totalRevenue: string;
}

interface PendingLawyer {
  id: number;
  userId: string;
  specialty: string;
  secondarySpecialties: string[] | null;
  barNumber: string | null;
  yearsExperience: number | null;
  hourlyRate: string | null;
  consultationRate: string | null;
  verificationStatus: string;
  jurisdictions: string[] | null;
  languages: string[] | null;
  rating: string | null;
  totalReviews: number | null;
  totalCases: number | null;
  isActive: boolean | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  profileImageUrl: string | null;
}

interface AdminDocument {
  id: number;
  clientId: string;
  documentTypeId: number;
  assignedLawyerId: number | null;
  status: string;
  currentDraft: string | null;
  reviewNotes: string | null;
  amount: string | null;
  createdAt: string | null;
  documentType: { name: string; category: string } | null;
  assignedLawyer: { id: number; firstName: string | null; lastName: string | null } | null;
  client: { id: string; firstName: string | null; lastName: string | null; email: string | null } | null;
}

interface VideoItem {
  id: number;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  category: string;
  duration: number | null;
  jurisdiction: string | null;
  language: string | null;
  isPublished: boolean | null;
  createdAt: string | null;
  submittedByUserId: string | null;
}

const videoCategories = [
  "Employment",
  "Family Law",
  "Immigration",
  "Business",
  "Contracts",
  "Real Estate",
  "Criminal",
  "Tax Law",
  "Estate Planning",
  "Intellectual Property",
];

export default function AdminPage() {
  const { toast } = useToast();
  const [assignDialogOpen, setAssignDialogOpen] = useState<number | null>(null);
  const [selectedLawyerId, setSelectedLawyerId] = useState<string>("");
  const [addVideoOpen, setAddVideoOpen] = useState(false);
  const [deletingLawyer, setDeletingLawyer] = useState<PendingLawyer | null>(null);
  const [videoForm, setVideoForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    category: "",
    duration: "",
    jurisdiction: "",
    language: "en",
  });

  const { data: stats, isLoading: loadingStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: pendingLawyers, isLoading: loadingPending } = useQuery<PendingLawyer[]>({
    queryKey: ["/api/admin/lawyers/pending"],
  });

  const { data: allLawyers, isLoading: loadingAll } = useQuery<PendingLawyer[]>({
    queryKey: ["/api/admin/lawyers"],
  });

  const { data: adminVideos, isLoading: loadingVideos } = useQuery<VideoItem[]>({
    queryKey: ["/api/admin/videos"],
  });

  const { data: adminDocuments, isLoading: loadingDocuments } = useQuery<AdminDocument[]>({
    queryKey: ["/api/admin/documents"],
  });

  const assignLawyerMutation = useMutation({
    mutationFn: async ({ docId, lawyerId }: { docId: number; lawyerId: number }) => {
      await apiRequest("POST", `/api/admin/documents/${docId}/assign`, { lawyerId });
    },
    onSuccess: () => {
      toast({ title: "Lawyer Assigned" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setAssignDialogOpen(null);
      setSelectedLawyerId("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const getDocStatusStyle = (status: string) => {
    switch (status) {
      case "drafting":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "in_review":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "needs_client_input":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "finalized":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "delivered":
        return "bg-muted text-muted-foreground";
      case "awaiting_payment":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const verifiedLawyers = allLawyers?.filter((l) => l.verificationStatus === "verified") || [];

  const verifyMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: "approve" | "reject" }) => {
      await apiRequest("POST", `/api/admin/lawyers/${id}/${action}`);
    },
    onSuccess: (_, vars) => {
      toast({ title: vars.action === "approve" ? "Lawyer Approved" : "Lawyer Rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lawyers/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lawyers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const createVideoMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/videos", {
        ...videoForm,
        duration: videoForm.duration ? parseInt(videoForm.duration) : null,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Video Added", description: "The video has been published successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      setAddVideoOpen(false);
      setVideoForm({
        title: "",
        description: "",
        videoUrl: "",
        thumbnailUrl: "",
        category: "",
        duration: "",
        jurisdiction: "",
        language: "en",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/videos/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Video Deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const approveVideoMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/admin/videos/${id}/approve`);
    },
    onSuccess: () => {
      toast({ title: "Video Approved", description: "The submission has been published to the video library." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const rejectVideoMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/admin/videos/${id}/reject`);
    },
    onSuccess: () => {
      toast({ title: "Submission Rejected", description: "The video submission has been removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/videos"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteLawyerMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/lawyers/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Lawyer Profile Removed", description: "The professional profile has been removed and the user has been demoted to client." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lawyers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lawyers/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setDeletingLawyer(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const statCards = [
    { title: "Total Lawyers", value: stats?.totalLawyers || 0, icon: Users, color: "text-blue-600" },
    { title: "Pending Reviews", value: stats?.pendingVerifications || 0, icon: Clock, color: "text-amber-600" },
    { title: "Appointments", value: stats?.totalAppointments || 0, icon: Calendar, color: "text-emerald-600" },
    { title: "Documents", value: stats?.totalDocuments || 0, icon: FileText, color: "text-purple-600" },
  ];

  const canSubmitVideo = videoForm.title && videoForm.videoUrl && videoForm.category;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-accent" />
        <div>
          <h1 className="font-serif text-2xl font-bold" data-testid="text-admin-title">
            Admin Panel
          </h1>
          <p className="text-muted-foreground text-sm">Manage lawyers, videos, and platform</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-md bg-muted flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                {loadingStats ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  <p className="text-2xl font-bold" data-testid={`text-stat-${stat.title.toLowerCase().replace(/\s/g, "-")}`}>
                    {stat.value}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="pending">
        <TabsList data-testid="tabs-admin">
          <TabsTrigger value="pending" data-testid="tab-pending-lawyers">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Pending ({pendingLawyers?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all-lawyers">
            <Users className="h-3 w-3 mr-1" />
            All Lawyers
          </TabsTrigger>
          <TabsTrigger value="videos" data-testid="tab-videos">
            <Video className="h-3 w-3 mr-1" />
            Videos ({adminVideos?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents">
            <FileText className="h-3 w-3 mr-1" />
            Documents ({adminDocuments?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {loadingPending ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : pendingLawyers?.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <CheckCircle className="h-10 w-10 text-emerald-500/40 mx-auto" />
              <p className="text-muted-foreground text-sm">No pending verifications</p>
            </div>
          ) : (
            pendingLawyers?.map((lawyer) => (
              <Card key={lawyer.id} data-testid={`card-pending-lawyer-${lawyer.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={lawyer.profileImageUrl || ""} />
                        <AvatarFallback className="text-xs">
                          {(lawyer.firstName || "L")[0]}{(lawyer.lastName || "")[0] || ""}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h3 className="font-medium text-sm">
                          {lawyer.firstName} {lawyer.lastName}
                        </h3>
                        <p className="text-xs text-muted-foreground">{lawyer.specialty}</p>
                        <div className="flex flex-wrap gap-1">
                          {lawyer.jurisdictions?.map((j) => (
                            <Badge key={j} variant="secondary" className="text-[10px]">{j}</Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Bar #: {lawyer.barNumber || "Not provided"} | {lawyer.yearsExperience} years exp.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => verifyMutation.mutate({ id: lawyer.id, action: "approve" })}
                        disabled={verifyMutation.isPending}
                        data-testid={`button-approve-${lawyer.id}`}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => verifyMutation.mutate({ id: lawyer.id, action: "reject" })}
                        disabled={verifyMutation.isPending}
                        data-testid={`button-reject-${lawyer.id}`}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-3 mt-4">
          {loadingAll ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : allLawyers?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">No lawyers registered</p>
            </div>
          ) : (
            allLawyers?.map((lawyer) => (
              <Card key={lawyer.id} data-testid={`card-lawyer-admin-${lawyer.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={lawyer.profileImageUrl || ""} />
                        <AvatarFallback className="text-xs">
                          {(lawyer.firstName || "L")[0]}{(lawyer.lastName || "")[0] || ""}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-medium truncate">
                            {lawyer.firstName} {lawyer.lastName}
                          </p>
                          {lawyer.verificationStatus === "verified" && (
                            <BadgeCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{lawyer.specialty}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          lawyer.verificationStatus === "verified"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : lawyer.verificationStatus === "pending"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {lawyer.verificationStatus}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingLawyer(lawyer)}
                        data-testid={`button-delete-lawyer-${lawyer.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="videos" className="space-y-4 mt-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Manage educational video library ({adminVideos?.length || 0} videos)
            </p>
            <Dialog open={addVideoOpen} onOpenChange={setAddVideoOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-video">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Video
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-serif">Add New Video</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="video-title">Title *</Label>
                    <Input
                      id="video-title"
                      placeholder="e.g., Understanding Employment Rights"
                      value={videoForm.title}
                      onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                      data-testid="input-video-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="video-url">Video URL *</Label>
                    <Input
                      id="video-url"
                      placeholder="https://youtube.com/watch?v=..."
                      value={videoForm.videoUrl}
                      onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value })}
                      data-testid="input-video-url"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="video-category">Category *</Label>
                    <Select
                      value={videoForm.category}
                      onValueChange={(v) => setVideoForm({ ...videoForm, category: v })}
                    >
                      <SelectTrigger data-testid="select-video-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {videoCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="video-description">Description</Label>
                    <Textarea
                      id="video-description"
                      placeholder="Brief description of the video content..."
                      value={videoForm.description}
                      onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                      className="resize-none text-sm"
                      rows={3}
                      data-testid="input-video-description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="video-thumbnail">Thumbnail URL</Label>
                      <Input
                        id="video-thumbnail"
                        placeholder="https://..."
                        value={videoForm.thumbnailUrl}
                        onChange={(e) => setVideoForm({ ...videoForm, thumbnailUrl: e.target.value })}
                        data-testid="input-video-thumbnail"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="video-duration">Duration (seconds)</Label>
                      <Input
                        id="video-duration"
                        type="number"
                        placeholder="e.g., 600"
                        value={videoForm.duration}
                        onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })}
                        data-testid="input-video-duration"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="video-jurisdiction">Jurisdiction</Label>
                      <Input
                        id="video-jurisdiction"
                        placeholder="e.g., Federal, California"
                        value={videoForm.jurisdiction}
                        onChange={(e) => setVideoForm({ ...videoForm, jurisdiction: e.target.value })}
                        data-testid="input-video-jurisdiction"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="video-language">Language</Label>
                      <Select
                        value={videoForm.language}
                        onValueChange={(v) => setVideoForm({ ...videoForm, language: v })}
                      >
                        <SelectTrigger data-testid="select-video-language">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="zh">Chinese</SelectItem>
                          <SelectItem value="hi">Hindi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    disabled={!canSubmitVideo || createVideoMutation.isPending}
                    onClick={() => createVideoMutation.mutate()}
                    data-testid="button-submit-video"
                  >
                    {createVideoMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Publish Video
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Pending lawyer submissions */}
          {(() => {
            const pendingSubmissions = adminVideos?.filter(
              (v) => v.isPublished === false && v.submittedByUserId != null
            ) ?? [];
            if (loadingVideos || pendingSubmissions.length === 0) return null;
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-semibold">
                    Pending Submissions
                    <Badge className="ml-2 text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                      {pendingSubmissions.length}
                    </Badge>
                  </h3>
                </div>
                {pendingSubmissions.map((video) => (
                  <Card key={`pending-${video.id}`} className="border-amber-500/20 bg-amber-500/5">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                            <Video className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <h3 className="text-sm font-medium truncate">{video.title}</h3>
                            {video.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{video.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary" className="text-[10px]">{video.category}</Badge>
                              {video.duration && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5" />
                                  {formatDuration(video.duration)}
                                </span>
                              )}
                              {video.jurisdiction && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <Globe className="h-2.5 w-2.5" />
                                  {video.jurisdiction}
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                Submitted {video.createdAt ? new Date(video.createdAt).toLocaleDateString() : "—"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                            disabled={approveVideoMutation.isPending || rejectVideoMutation.isPending}
                            onClick={() => approveVideoMutation.mutate(video.id)}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                            disabled={approveVideoMutation.isPending || rejectVideoMutation.isPending}
                            onClick={() => rejectVideoMutation.mutate(video.id)}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="border-t pt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Published Library</p>
                </div>
              </div>
            );
          })()}

          {loadingVideos ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : adminVideos?.filter(v => !(v.isPublished === false && v.submittedByUserId != null)).length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Video className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-muted-foreground text-sm">No videos uploaded yet</p>
              <Button size="sm" variant="outline" onClick={() => setAddVideoOpen(true)} data-testid="button-add-first-video">
                <Plus className="h-3 w-3 mr-1" /> Add Your First Video
              </Button>
            </div>
          ) : (
            adminVideos?.filter(v => !(v.isPublished === false && v.submittedByUserId != null)).map((video) => (
              <Card key={video.id} data-testid={`card-admin-video-${video.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                        {video.thumbnailUrl ? (
                          <img src={video.thumbnailUrl} alt="" className="h-10 w-10 rounded-md object-cover" />
                        ) : (
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <h3 className="text-sm font-medium truncate">{video.title}</h3>
                        {video.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{video.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">{video.category}</Badge>
                          {video.duration && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {formatDuration(video.duration)}
                            </span>
                          )}
                          {video.jurisdiction && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Globe className="h-2.5 w-2.5" />
                              {video.jurisdiction}
                            </span>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${video.isPublished ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground"}`}
                          >
                            {video.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteVideoMutation.mutate(video.id)}
                      disabled={deleteVideoMutation.isPending}
                      data-testid={`button-delete-video-${video.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-3 mt-4">
          {loadingDocuments ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : adminDocuments?.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-muted-foreground text-sm">No documents found</p>
            </div>
          ) : (
            adminDocuments?.map((doc) => (
              <Card key={doc.id} data-testid={`card-admin-doc-${doc.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-medium">
                          #{doc.id} {doc.documentType?.name || "Document"}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${getDocStatusStyle(doc.status)}`}
                        >
                          {doc.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Client: {doc.client?.firstName} {doc.client?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Lawyer: {doc.assignedLawyer
                          ? `${doc.assignedLawyer.firstName} ${doc.assignedLawyer.lastName}`
                          : "Unassigned"}
                      </p>
                      {doc.createdAt && (
                        <p className="text-[10px] text-muted-foreground">
                          Created: {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Dialog
                      open={assignDialogOpen === doc.id}
                      onOpenChange={(open) => {
                        setAssignDialogOpen(open ? doc.id : null);
                        if (!open) setSelectedLawyerId("");
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`button-assign-lawyer-${doc.id}`}
                        >
                          <Users className="h-3 w-3 mr-1" />
                          Assign Lawyer
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm">
                        <DialogHeader>
                          <DialogTitle className="font-serif">Assign Lawyer</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Select Lawyer</Label>
                            <Select
                              value={selectedLawyerId}
                              onValueChange={setSelectedLawyerId}
                            >
                              <SelectTrigger data-testid="select-assign-lawyer">
                                <SelectValue placeholder="Choose a verified lawyer" />
                              </SelectTrigger>
                              <SelectContent>
                                {verifiedLawyers.map((lawyer) => (
                                  <SelectItem
                                    key={lawyer.id}
                                    value={lawyer.id.toString()}
                                  >
                                    {lawyer.firstName} {lawyer.lastName} — {lawyer.specialty}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            className="w-full"
                            disabled={!selectedLawyerId || assignLawyerMutation.isPending}
                            onClick={() =>
                              assignLawyerMutation.mutate({
                                docId: doc.id,
                                lawyerId: parseInt(selectedLawyerId),
                              })
                            }
                            data-testid="button-confirm-assign"
                          >
                            {assignLawyerMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Assigning...
                              </>
                            ) : (
                              "Assign"
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!deletingLawyer} onOpenChange={(open) => !open && setDeletingLawyer(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Remove Lawyer Profile
            </DialogTitle>
          </DialogHeader>
          {deletingLawyer && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={deletingLawyer.profileImageUrl || ""} />
                  <AvatarFallback className="text-xs">
                    {(deletingLawyer.firstName || "L")[0]}{(deletingLawyer.lastName || "")[0] || ""}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {deletingLawyer.firstName} {deletingLawyer.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{deletingLawyer.specialty}</p>
                </div>
              </div>

              <div className="p-3 rounded-md bg-destructive/5 border border-destructive/10">
                <p className="text-xs text-muted-foreground">
                  This will remove the professional profile and demote the user to a client role. The user account itself will remain active.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={deleteLawyerMutation.isPending}
                  onClick={() => deleteLawyerMutation.mutate(deletingLawyer.id)}
                  data-testid="button-confirm-delete-lawyer"
                >
                  {deleteLawyerMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove Profile
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setDeletingLawyer(null)}
                  data-testid="button-cancel-delete-lawyer"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
