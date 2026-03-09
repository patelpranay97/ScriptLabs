import { useState } from "react";
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
} from "lucide-react";
import type { Video as VideoType, InsertVideo } from "@shared/schema";

export default function Videos() {
  const [dialogOpen, setDialogOpen] = useState(false);
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      ) : (
        <EmptyVideos hasSearch={searchQuery.length > 0 || filterSuccess !== "all"} />
      )}
    </div>
  );
}

function AddVideoForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (data: Partial<InsertVideo>) => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState({
    title: "",
    link: "",
    platform: "instagram",
    script: "",
    views: "",
    likes: "",
    comments: "",
    shares: "",
    saves: "",
    accountsReached: "",
    watchTime: "",
    avgWatchTime: "",
    skipRate: "",
    interactions: "",
    profileActivity: "",
    day1Views: "",
    day2Views: "",
    day3Views: "",
    week1Views: "",
    isSuccessful: null as boolean | null,
    keyPoints: "",
  });

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
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="title">Video Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Day 9 of Building my own brand"
            required
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
            <SelectTrigger data-testid="select-platform">
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
          <MetricInput icon={<Eye className="w-3.5 h-3.5" />} label="Views" value={formData.views} onChange={(v) => update("views", v)} testId="input-metric-views" />
          <MetricInput icon={<Heart className="w-3.5 h-3.5" />} label="Likes" value={formData.likes} onChange={(v) => update("likes", v)} testId="input-metric-likes" />
          <MetricInput icon={<MessageSquare className="w-3.5 h-3.5" />} label="Comments" value={formData.comments} onChange={(v) => update("comments", v)} testId="input-metric-comments" />
          <MetricInput icon={<Share2 className="w-3.5 h-3.5" />} label="Shares" value={formData.shares} onChange={(v) => update("shares", v)} testId="input-metric-shares" />
          <MetricInput icon={<Bookmark className="w-3.5 h-3.5" />} label="Saves" value={formData.saves} onChange={(v) => update("saves", v)} testId="input-metric-saves" />
          <div className="space-y-1.5">
            <Label className="text-xs">Skip Rate (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={formData.skipRate}
              onChange={(e) => update("skipRate", e.target.value)}
              placeholder="e.g. 56.1"
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
          <Input value={formData.watchTime} onChange={(e) => update("watchTime", e.target.value)} placeholder="e.g. 13h 54m 12s" data-testid="input-watch-time" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Avg Watch Time</Label>
          <Input value={formData.avgWatchTime} onChange={(e) => update("avgWatchTime", e.target.value)} placeholder="e.g. 18sec" data-testid="input-avg-watch-time" />
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  testId: string;
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
