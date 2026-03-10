import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Download,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  TrendingUp,
  TrendingDown,
  Video,
  ExternalLink,
  Search,
  Upload,
  Camera,
  Loader2,
  CheckCircle2,
  Pencil,
} from "lucide-react";
import type { Video as VideoType, InsertVideo } from "@shared/schema";

export default function Videos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSuccess, setFilterSuccess] = useState<string>("all");
  const { toast } = useToast();

  const { data: videos, isLoading } = useQuery<VideoType[]>({
    queryKey: ["/api/videos"],
  });

  const createVideo = useMutation({
    mutationFn: async (data: Partial<InsertVideo>) => {
      const res = await apiRequest("POST", "/api/videos", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      setDialogOpen(false);
      toast({ title: "Video added", description: "Your video has been added to your library." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add video.", variant: "destructive" });
    },
  });

  const updateVideo = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertVideo> }) => {
      const res = await apiRequest("PATCH", `/api/videos/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      setEditingVideo(null);
      toast({ title: "Video updated", description: "Your video has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update video.", variant: "destructive" });
    },
  });

  const exportCSV = async () => {
    try {
      const res = await fetch("/api/videos/export", { credentials: "include" });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "videos_export.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported", description: "Your video data has been downloaded as CSV." });
    } catch {
      toast({ title: "Error", description: "Failed to export data.", variant: "destructive" });
    }
  };

  const filtered = videos?.filter((v) => {
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterSuccess === "all" ||
      (filterSuccess === "success" && v.isSuccessful === true) ||
      (filterSuccess === "miss" && v.isSuccessful === false) ||
      (filterSuccess === "pending" && v.isSuccessful === null);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-videos-title">Video Library</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track and analyze your content performance
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportCSV} data-testid="button-export-csv">
            <Download className="w-4 h-4 mr-1" />
            Export CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-video">
                <Plus className="w-4 h-4 mr-1" />
                Add Video
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Video</DialogTitle>
              </DialogHeader>
              <AddVideoForm
                onSubmit={(data) => createVideo.mutate(data)}
                isSubmitting={createVideo.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-videos"
          />
        </div>
        <Select value={filterSuccess} onValueChange={setFilterSuccess}>
          <SelectTrigger className="w-[140px]" data-testid="select-filter-success">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Videos</SelectItem>
            <SelectItem value="success">Hits</SelectItem>
            <SelectItem value="miss">Misses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <VideosSkeleton />
      ) : filtered && filtered.length > 0 ? (
        <Card>
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="text-center">Platform</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Likes</TableHead>
                  <TableHead className="text-right">Comments</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Saves</TableHead>
                  <TableHead className="text-right">Skip Rate</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Link</TableHead>
                  <TableHead className="text-center">Edit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((video) => (
                  <TableRow key={video.id} data-testid={`row-video-${video.id}`}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {video.title}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {video.platform}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {video.views?.toLocaleString() ?? "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {video.likes?.toLocaleString() ?? "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {video.comments?.toLocaleString() ?? "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {video.shares?.toLocaleString() ?? "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {video.saves?.toLocaleString() ?? "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {video.skipRate !== null ? `${video.skipRate}%` : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {video.isSuccessful === true ? (
                        <Badge variant="default" className="text-xs">
                          <TrendingUp className="w-3 h-3 mr-0.5" /> Hit
                        </Badge>
                      ) : video.isSuccessful === false ? (
                        <Badge variant="secondary" className="text-xs">
                          <TrendingDown className="w-3 h-3 mr-0.5" /> Miss
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {video.link ? (
                        <a href={video.link} target="_blank" rel="noopener noreferrer">
                          <Button size="icon" variant="ghost" data-testid={`button-link-video-${video.id}`}>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingVideo(video)}
                        data-testid={`button-edit-video-${video.id}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      ) : (
        <EmptyVideos hasSearch={searchQuery.length > 0 || filterSuccess !== "all"} />
      )}

      <Dialog open={!!editingVideo} onOpenChange={(open) => { if (!open) setEditingVideo(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Video</DialogTitle>
          </DialogHeader>
          {editingVideo && (
            <AddVideoForm
              initialValues={editingVideo}
              onSubmit={(data) => updateVideo.mutate({ id: editingVideo.id, data })}
              isSubmitting={updateVideo.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddVideoForm({
  onSubmit,
  isSubmitting,
  initialValues,
}: {
  onSubmit: (data: Partial<InsertVideo>) => void;
  isSubmitting: boolean;
  initialValues?: VideoType;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedFields, setExtractedFields] = useState<Set<string>>(new Set());
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const [extractProgress, setExtractProgress] = useState<{ current: number; total: number } | null>(null);

  const [formData, setFormData] = useState({
    title: initialValues?.title ?? "",
    link: initialValues?.link ?? "",
    platform: initialValues?.platform ?? "instagram",
    script: initialValues?.script ?? "",
    views: initialValues?.views != null ? String(initialValues.views) : "",
    likes: initialValues?.likes != null ? String(initialValues.likes) : "",
    comments: initialValues?.comments != null ? String(initialValues.comments) : "",
    shares: initialValues?.shares != null ? String(initialValues.shares) : "",
    saves: initialValues?.saves != null ? String(initialValues.saves) : "",
    accountsReached: initialValues?.accountsReached != null ? String(initialValues.accountsReached) : "",
    watchTime: initialValues?.watchTime ?? "",
    avgWatchTime: initialValues?.avgWatchTime ?? "",
    skipRate: initialValues?.skipRate != null ? String(initialValues.skipRate) : "",
    interactions: initialValues?.interactions != null ? String(initialValues.interactions) : "",
    profileActivity: initialValues?.profileActivity != null ? String(initialValues.profileActivity) : "",
    day1Views: initialValues?.day1Views != null ? String(initialValues.day1Views) : "",
    day2Views: initialValues?.day2Views != null ? String(initialValues.day2Views) : "",
    day3Views: initialValues?.day3Views != null ? String(initialValues.day3Views) : "",
    week1Views: initialValues?.week1Views != null ? String(initialValues.week1Views) : "",
    isSuccessful: initialValues?.isSuccessful ?? null as boolean | null,
    keyPoints: initialValues?.keyPoints ?? "",
  });

  const extractBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (!imageFiles.length) {
      toast({ title: "Invalid file", description: "Please upload image files.", variant: "destructive" });
      return;
    }

    setIsExtracting(true);
    setScreenshotPreviews(imageFiles.map((f) => URL.createObjectURL(f)));
    setExtractProgress({ current: 0, total: imageFiles.length });

    const allFilled = new Set<string>();

    try {
      for (let i = 0; i < imageFiles.length; i++) {
        setExtractProgress({ current: i + 1, total: imageFiles.length });
        const file = imageFiles[i];
        const base64 = await extractBase64(file);

        const res = await fetch("/api/videos/extract-metrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ image: base64, mediaType: file.type }),
        });

        if (!res.ok) continue;

        const metrics = await res.json();

        setFormData((prev) => {
          const updated = { ...prev };
          if (metrics.title && !prev.title) { updated.title = metrics.title; allFilled.add("title"); }
          if (metrics.platform) { updated.platform = metrics.platform; allFilled.add("platform"); }
          if (metrics.views !== undefined) { updated.views = String(metrics.views); allFilled.add("views"); }
          if (metrics.likes !== undefined) { updated.likes = String(metrics.likes); allFilled.add("likes"); }
          if (metrics.comments !== undefined) { updated.comments = String(metrics.comments); allFilled.add("comments"); }
          if (metrics.shares !== undefined) { updated.shares = String(metrics.shares); allFilled.add("shares"); }
          if (metrics.saves !== undefined) { updated.saves = String(metrics.saves); allFilled.add("saves"); }
          if (metrics.accountsReached !== undefined) { updated.accountsReached = String(metrics.accountsReached); allFilled.add("accountsReached"); }
          if (metrics.watchTime) { updated.watchTime = metrics.watchTime; allFilled.add("watchTime"); }
          if (metrics.avgWatchTime) { updated.avgWatchTime = metrics.avgWatchTime; allFilled.add("avgWatchTime"); }
          if (metrics.skipRate !== undefined) { updated.skipRate = String(metrics.skipRate); allFilled.add("skipRate"); }
          if (metrics.interactions !== undefined) { updated.interactions = String(metrics.interactions); allFilled.add("interactions"); }
          if (metrics.profileActivity !== undefined) { updated.profileActivity = String(metrics.profileActivity); allFilled.add("profileActivity"); }
          return updated;
        });
      }

      setExtractedFields(allFilled);
      toast({
        title: "Metrics extracted",
        description: `Auto-filled ${allFilled.size} field${allFilled.size !== 1 ? "s" : ""} from ${imageFiles.length} screenshot${imageFiles.length !== 1 ? "s" : ""}.`,
      });
    } catch {
      toast({ title: "Extraction failed", description: "Could not read metrics from screenshots. Try clearer images or fill in manually.", variant: "destructive" });
    } finally {
      setIsExtracting(false);
      setExtractProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<InsertVideo> = {
      title: formData.title,
      link: formData.link || null,
      platform: formData.platform,
      script: formData.script || null,
      views: formData.views ? parseInt(formData.views) : null,
      likes: formData.likes ? parseInt(formData.likes) : null,
      comments: formData.comments ? parseInt(formData.comments) : null,
      shares: formData.shares ? parseInt(formData.shares) : null,
      saves: formData.saves ? parseInt(formData.saves) : null,
      accountsReached: formData.accountsReached ? parseInt(formData.accountsReached) : null,
      watchTime: formData.watchTime || null,
      avgWatchTime: formData.avgWatchTime || null,
      skipRate: formData.skipRate ? parseFloat(formData.skipRate) : null,
      interactions: formData.interactions ? parseInt(formData.interactions) : null,
      profileActivity: formData.profileActivity ? parseInt(formData.profileActivity) : null,
      day1Views: formData.day1Views ? parseInt(formData.day1Views) : null,
      day2Views: formData.day2Views ? parseInt(formData.day2Views) : null,
      day3Views: formData.day3Views ? parseInt(formData.day3Views) : null,
      week1Views: formData.week1Views ? parseInt(formData.week1Views) : null,
      isSuccessful: formData.isSuccessful,
      keyPoints: formData.keyPoints || null,
    };
    onSubmit(data);
  };

  const update = (field: string, value: string | boolean | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setExtractedFields((prev) => { const next = new Set(prev); next.delete(field); return next; });
  };

  const isHighlighted = (field: string) => extractedFields.has(field);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div
        className={`relative rounded-md border-2 border-dashed p-4 text-center transition-colors ${
          isExtracting ? "border-primary/50 bg-primary/5" : "border-border"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleScreenshotUpload}
          className="hidden"
          data-testid="input-screenshot-upload"
        />
        {isExtracting ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-sm font-medium text-primary">
              Analyzing screenshot{extractProgress && extractProgress.total > 1 ? ` ${extractProgress.current} of ${extractProgress.total}` : ""}...
            </p>
            <p className="text-xs text-muted-foreground">AI is reading your metrics</p>
          </div>
        ) : screenshotPreviews.length > 0 && extractedFields.size > 0 ? (
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5 shrink-0">
              {screenshotPreviews.slice(0, 4).map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Screenshot ${i + 1}`}
                  className="w-12 h-12 object-cover rounded-md border"
                />
              ))}
              {screenshotPreviews.length > 4 && (
                <div className="w-12 h-12 rounded-md border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  +{screenshotPreviews.length - 4}
                </div>
              )}
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                {extractedFields.size} metrics from {screenshotPreviews.length} screenshot{screenshotPreviews.length !== 1 ? "s" : ""}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Fields highlighted below were auto-filled. You can edit them.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-upload-another-screenshot"
            >
              <Camera className="w-3.5 h-3.5 mr-1" />
              Upload More
            </Button>
          </div>
        ) : (
          <div
            className="flex flex-col items-center gap-2 py-2 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Camera className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-medium">Upload Metrics Screenshots</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Upload one or more screenshots from Instagram Insights, TikTok Analytics, or YouTube Studio — AI will auto-fill all the metrics
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="title">Video Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Day 9 of Building my own brand"
            required
            className={isHighlighted("title") ? "ring-2 ring-green-500/30 border-green-500/50" : ""}
            data-testid="input-video-title"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="link">Video Link</Label>
          <Input
            id="link"
            value={formData.link}
            onChange={(e) => update("link", e.target.value)}
            placeholder="https://..."
            data-testid="input-video-link"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="platform">Platform</Label>
          <Select value={formData.platform} onValueChange={(v) => update("platform", v)}>
            <SelectTrigger data-testid="select-platform" className={isHighlighted("platform") ? "ring-2 ring-green-500/30 border-green-500/50" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="twitter">Twitter/X</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="script">Script</Label>
        <Textarea
          id="script"
          value={formData.script}
          onChange={(e) => update("script", e.target.value)}
          placeholder="Paste your video script here..."
          rows={4}
          data-testid="input-video-script"
        />
      </div>

      <div>
        <p className="text-sm font-medium mb-3">Performance Metrics</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <MetricInput icon={<Eye className="w-3.5 h-3.5" />} label="Views" value={formData.views} onChange={(v) => update("views", v)} testId="input-metric-views" highlighted={isHighlighted("views")} />
          <MetricInput icon={<Heart className="w-3.5 h-3.5" />} label="Likes" value={formData.likes} onChange={(v) => update("likes", v)} testId="input-metric-likes" highlighted={isHighlighted("likes")} />
          <MetricInput icon={<MessageSquare className="w-3.5 h-3.5" />} label="Comments" value={formData.comments} onChange={(v) => update("comments", v)} testId="input-metric-comments" highlighted={isHighlighted("comments")} />
          <MetricInput icon={<Share2 className="w-3.5 h-3.5" />} label="Shares" value={formData.shares} onChange={(v) => update("shares", v)} testId="input-metric-shares" highlighted={isHighlighted("shares")} />
          <MetricInput icon={<Bookmark className="w-3.5 h-3.5" />} label="Saves" value={formData.saves} onChange={(v) => update("saves", v)} testId="input-metric-saves" highlighted={isHighlighted("saves")} />
          <div className="space-y-1.5">
            <Label className="text-xs">Skip Rate (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={formData.skipRate}
              onChange={(e) => update("skipRate", e.target.value)}
              placeholder="e.g. 56.1"
              className={isHighlighted("skipRate") ? "ring-2 ring-green-500/30 border-green-500/50" : ""}
              data-testid="input-metric-skip-rate"
            />
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-3">Multi-Day Tracking</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Day 1</Label>
            <Input type="number" value={formData.day1Views} onChange={(e) => update("day1Views", e.target.value)} placeholder="Views" data-testid="input-day1-views" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Day 2</Label>
            <Input type="number" value={formData.day2Views} onChange={(e) => update("day2Views", e.target.value)} placeholder="Views" data-testid="input-day2-views" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Day 3</Label>
            <Input type="number" value={formData.day3Views} onChange={(e) => update("day3Views", e.target.value)} placeholder="Views" data-testid="input-day3-views" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Week 1</Label>
            <Input type="number" value={formData.week1Views} onChange={(e) => update("week1Views", e.target.value)} placeholder="Views" data-testid="input-week1-views" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Watch Time</Label>
          <Input value={formData.watchTime} onChange={(e) => update("watchTime", e.target.value)} placeholder="e.g. 13h 54m 12s" className={isHighlighted("watchTime") ? "ring-2 ring-green-500/30 border-green-500/50" : ""} data-testid="input-watch-time" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Avg Watch Time</Label>
          <Input value={formData.avgWatchTime} onChange={(e) => update("avgWatchTime", e.target.value)} placeholder="e.g. 18sec" className={isHighlighted("avgWatchTime") ? "ring-2 ring-green-500/30 border-green-500/50" : ""} data-testid="input-avg-watch-time" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="keyPoints">Key Points / Learnings</Label>
        <Textarea
          id="keyPoints"
          value={formData.keyPoints}
          onChange={(e) => update("keyPoints", e.target.value)}
          placeholder="What worked? What didn't? Key takeaways..."
          rows={3}
          data-testid="input-key-points"
        />
      </div>

      <div className="flex items-center gap-4">
        <Label>Mark as successful?</Label>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="sm"
            variant={formData.isSuccessful === true ? "default" : "outline"}
            onClick={() => update("isSuccessful", formData.isSuccessful === true ? null : true)}
            data-testid="button-mark-success"
          >
            <TrendingUp className="w-3 h-3 mr-1" /> Hit
          </Button>
          <Button
            type="button"
            size="sm"
            variant={formData.isSuccessful === false ? "destructive" : "outline"}
            onClick={() => update("isSuccessful", formData.isSuccessful === false ? null : false)}
            data-testid="button-mark-miss"
          >
            <TrendingDown className="w-3 h-3 mr-1" /> Miss
          </Button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-submit-video">
        {isSubmitting ? "Adding..." : "Add Video"}
      </Button>
    </form>
  );
}

function MetricInput({
  icon,
  label,
  value,
  onChange,
  testId,
  highlighted,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  testId: string;
  highlighted?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs flex items-center gap-1">
        {icon} {label}
      </Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className={highlighted ? "ring-2 ring-green-500/30 border-green-500/50" : ""}
        data-testid={testId}
      />
    </div>
  );
}

function EmptyVideos({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Video className="w-12 h-12 text-muted-foreground/30 mb-4" />
      <h3 className="text-lg font-medium">
        {hasSearch ? "No matching videos" : "No videos yet"}
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {hasSearch
          ? "Try adjusting your search or filter criteria."
          : "Start tracking your content by adding your first video with its performance metrics."}
      </p>
    </div>
  );
}

function VideosSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-md" />
      ))}
    </div>
  );
}
