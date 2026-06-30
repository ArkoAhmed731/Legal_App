import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Video, Upload, Clock, CheckCircle, XCircle, Loader2, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface VideoItem {
  id: number;
  title: string;
  description: string | null;
  videoUrl: string;
  category: string;
  duration: number | null;
  jurisdiction: string | null;
  language: string | null;
  isPublished: boolean | null;
  createdAt: string | null;
}

const VIDEO_CATEGORIES = [
  "Employment", "Family Law", "Immigration", "Business", "Contracts",
  "Real Estate", "Criminal", "Tax Law", "Estate Planning", "Intellectual Property",
];

export default function LawyerVideosPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    category: "",
    duration: "",
    jurisdiction: "",
    language: "en",
  });

  const { data: myVideos, isLoading } = useQuery<VideoItem[]>({
    queryKey: ["/api/lawyer/videos"],
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/lawyer/videos", {
        ...form,
        duration: form.duration ? parseInt(form.duration) : null,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Video Submitted", description: "Your video has been submitted for admin review. It will appear in the library once approved." });
      queryClient.invalidateQueries({ queryKey: ["/api/lawyer/videos"] });
      setForm({ title: "", description: "", videoUrl: "", category: "", duration: "", jurisdiction: "", language: "en" });
    },
    onError: (err: Error) => {
      toast({ title: "Submission Failed", description: err.message, variant: "destructive" });
    },
  });

  const statusBadge = (isPublished: boolean | null) => {
    if (isPublished === true)
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><CheckCircle className="h-3 w-3 mr-1" />Published</Badge>;
    if (isPublished === false)
      return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
    return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Unknown</Badge>;
  };

  const canSubmit = form.title && form.videoUrl && form.category;

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-bold">Video Library Contributions</h1>
        <p className="text-muted-foreground text-sm">
          Submit educational legal videos for inclusion in the platform library. All submissions are reviewed by an administrator before publication.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Submit a New Video
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                placeholder="e.g., Understanding Tenant Rights"
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Category <span className="text-destructive">*</span></Label>
              <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {VIDEO_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video URL <span className="text-destructive">*</span></Label>
            <Input
              id="videoUrl"
              placeholder="e.g., https://youtube.com/watch?v=..."
              value={form.videoUrl}
              onChange={(e) => setForm(f => ({ ...f, videoUrl: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">YouTube, Vimeo, or direct video links are accepted.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Briefly describe the content and key topics covered in this video."
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="e.g., 600"
                value={form.duration}
                onChange={(e) => setForm(f => ({ ...f, duration: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Input
                id="jurisdiction"
                placeholder="e.g., Texas, Federal"
                value={form.jurisdiction}
                onChange={(e) => setForm(f => ({ ...f, jurisdiction: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={form.language} onValueChange={(v) => setForm(f => ({ ...f, language: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["en", "bn", "hi", "ar", "fr", "es"].map(l => (
                    <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            className="w-full"
            disabled={!canSubmit || submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
          >
            {submitMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" />Submit for Review</>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">My Submissions ({myVideos?.length || 0})</h2>
        </div>
        <Separator />
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />)}
          </div>
        ) : myVideos?.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
            You have not submitted any videos yet.
          </div>
        ) : (
          <div className="space-y-3">
            {myVideos?.map(video => (
              <Card key={video.id}>
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <p className="font-medium text-sm truncate">{video.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span>{video.category}</span>
                      {video.jurisdiction && <><span>·</span><span>{video.jurisdiction}</span></>}
                      {video.duration && <><span>·</span><span>{Math.floor(video.duration / 60)}m {video.duration % 60}s</span></>}
                      <span>·</span>
                      <span>{video.createdAt ? new Date(video.createdAt).toLocaleDateString() : "—"}</span>
                    </div>
                    {video.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{video.description}</p>
                    )}
                  </div>
                  <div className="shrink-0">{statusBadge(video.isPublished)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
