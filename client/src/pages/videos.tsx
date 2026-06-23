import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Play,
  Clock,
  Video as VideoIcon,
  BookOpen,
  ExternalLink,
  Globe,
} from "lucide-react";
import { APP_CONFIG } from "@/lib/app-config";

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
}

export default function VideosPage() {
  const categoryColors = APP_CONFIG.videoCategories;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  const { data: videos, isLoading } = useQuery<VideoItem[]>({
    queryKey: ["/api/videos"],
  });

  const categories = videos ? Array.from(new Set(videos.map((v) => v.category))) : [];

  const filtered = selectedCategory
    ? videos?.filter((v) => v.category === selectedCategory)
    : videos;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-bold" data-testid="text-videos-title">
          {APP_CONFIG.videosTitle}
        </h1>
        <p className="text-muted-foreground text-sm">
          {APP_CONFIG.videosSubtitle}
        </p>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === null ? "default" : "secondary"}
            className="text-xs cursor-pointer"
            onClick={() => setSelectedCategory(null)}
            data-testid="badge-category-all"
          >
            All ({videos?.length || 0})
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? "default" : "secondary"}
              className={`text-xs cursor-pointer ${selectedCategory !== cat ? (categoryColors[cat] || "") : ""}`}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              data-testid={`badge-category-${cat.toLowerCase().replace(/\s/g, "-")}`}
            >
              {cat} ({videos?.filter((v) => v.category === cat).length || 0})
            </Badge>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="h-40 w-full rounded-t-md" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <VideoIcon className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground">No videos available in this category</p>
          {selectedCategory && (
            <Button variant="outline" size="sm" onClick={() => setSelectedCategory(null)} data-testid="button-show-all-videos">
              Show All Videos
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered?.map((video) => (
            <Card
              key={video.id}
              className="hover-elevate overflow-visible transition-all duration-200 cursor-pointer"
              onClick={() => setSelectedVideo(video)}
              data-testid={`card-video-${video.id}`}
            >
              <CardContent className="p-0">
                <div className="relative h-40 bg-gradient-to-br from-primary/20 to-accent/20 rounded-t-md flex items-center justify-center overflow-hidden">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                  )}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="h-5 w-5 text-foreground ml-0.5" />
                    </div>
                  </div>
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDuration(video.duration)}
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-medium text-sm line-clamp-2">{video.title}</h3>
                  {video.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{video.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`text-[10px] ${categoryColors[video.category] || ""}`}>
                      {video.category}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4">
              <div className="relative h-64 bg-gradient-to-br from-primary/20 to-accent/20 rounded-md flex items-center justify-center overflow-hidden">
                {selectedVideo.thumbnailUrl ? (
                  <img
                    src={selectedVideo.thumbnailUrl}
                    alt={selectedVideo.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center space-y-3">
                    <Play className="h-16 w-16 text-muted-foreground/40 mx-auto" />
                    <p className="text-sm text-muted-foreground">Video Preview</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {selectedVideo.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedVideo.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <Badge variant="secondary" className={`text-xs ${categoryColors[selectedVideo.category] || ""}`}>
                    {selectedVideo.category}
                  </Badge>
                  {selectedVideo.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(selectedVideo.duration)}
                    </span>
                  )}
                  {selectedVideo.jurisdiction && (
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {selectedVideo.jurisdiction}
                    </span>
                  )}
                </div>
                <a
                  href={selectedVideo.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full" data-testid="button-watch-video">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Watch Full Video
                  </Button>
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
