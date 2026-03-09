import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  TrendingUp,
  TrendingDown,
  Video,
  Zap,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Video as VideoType } from "@shared/schema";

export default function Dashboard() {
  const { data: videos, isLoading } = useQuery<VideoType[]>({
    queryKey: ["/api/videos"],
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const totalViews = videos?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;
  const totalLikes = videos?.reduce((sum, v) => sum + (v.likes || 0), 0) || 0;
  const totalComments = videos?.reduce((sum, v) => sum + (v.comments || 0), 0) || 0;
  const totalShares = videos?.reduce((sum, v) => sum + (v.shares || 0), 0) || 0;
  const totalSaves = videos?.reduce((sum, v) => sum + (v.saves || 0), 0) || 0;
  const successCount = videos?.filter((v) => v.isSuccessful).length || 0;
  const totalCount = videos?.length || 0;
  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

  const chartData = videos
    ?.slice(-10)
    .map((v) => ({
      name: v.title.length > 15 ? v.title.slice(0, 15) + "..." : v.title,
      views: v.views || 0,
      likes: v.likes || 0,
    })) || [];

  const recentVideos = videos?.slice(-5).reverse() || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track your content performance and growth
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/videos">
            <Button variant="outline" size="sm" data-testid="button-view-all-videos">
              <Video className="w-4 h-4 mr-1" />
              All Videos
            </Button>
          </Link>
          <Link href="/chat">
            <Button size="sm" data-testid="button-start-coaching">
              <Zap className="w-4 h-4 mr-1" />
              Start Coaching
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={<Eye className="w-4 h-4" />} label="Total Views" value={formatNumber(totalViews)} />
        <StatCard icon={<Heart className="w-4 h-4" />} label="Total Likes" value={formatNumber(totalLikes)} />
        <StatCard icon={<MessageSquare className="w-4 h-4" />} label="Comments" value={formatNumber(totalComments)} />
        <StatCard icon={<Share2 className="w-4 h-4" />} label="Shares" value={formatNumber(totalShares)} />
        <StatCard icon={<Bookmark className="w-4 h-4" />} label="Saves" value={formatNumber(totalSaves)} />
        <StatCard
          icon={<BarChart3 className="w-4 h-4" />}
          label="Success Rate"
          value={`${successRate}%`}
          highlight
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Views" />
                  <Bar dataKey="likes" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Likes" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Videos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentVideos.length > 0 ? (
              recentVideos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-start gap-3 p-2 rounded-md hover-elevate"
                  data-testid={`card-recent-video-${video.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{video.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatNumber(video.views || 0)} views
                      </span>
                      {video.isSuccessful !== null && (
                        <Badge variant={video.isSuccessful ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                          {video.isSuccessful ? (
                            <><TrendingUp className="w-2.5 h-2.5 mr-0.5" /> Hit</>
                          ) : (
                            <><TrendingDown className="w-2.5 h-2.5 mr-0.5" /> Miss</>
                          )}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyRecent />
            )}
            {recentVideos.length > 0 && (
              <Link href="/videos">
                <Button variant="ghost" size="sm" className="w-full mt-2" data-testid="button-see-all">
                  See All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-primary/30 bg-primary/5" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className={`text-xl font-bold ${highlight ? "text-primary" : ""}`} data-testid={`text-stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center h-[280px] text-center">
      <BarChart3 className="w-10 h-10 text-muted-foreground/30 mb-3" />
      <p className="text-sm text-muted-foreground">No video data yet</p>
      <p className="text-xs text-muted-foreground mt-1">Add videos to see performance trends</p>
      <Link href="/videos">
        <Button size="sm" variant="outline" className="mt-4" data-testid="button-add-first-video">
          Add Your First Video
        </Button>
      </Link>
    </div>
  );
}

function EmptyRecent() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Video className="w-8 h-8 text-muted-foreground/30 mb-2" />
      <p className="text-xs text-muted-foreground">No videos tracked yet</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-md" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-[350px] lg:col-span-2 rounded-md" />
        <Skeleton className="h-[350px] rounded-md" />
      </div>
    </div>
  );
}
