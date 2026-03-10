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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  FlaskConical,
  Sparkles,
  Trash2,
  ExternalLink,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  AtSign,
  FileText,
} from "lucide-react";
import type { ReferenceScript } from "@shared/schema";

export default function Scripts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: scripts, isLoading } = useQuery<ReferenceScript[]>({
    queryKey: ["/api/reference-scripts"],
  });

  const createScript = useMutation({
    mutationFn: async (data: Partial<ReferenceScript>) => {
      const res = await apiRequest("POST", "/api/reference-scripts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reference-scripts"] });
      setDialogOpen(false);
      toast({ title: "Script saved", description: "Reference script added to your library." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save script.", variant: "destructive" });
    },
  });

  const analyzeScript = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/reference-scripts/${id}/analyze`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reference-scripts"] });
      setExpandedId(data.id);
      toast({ title: "Analysis complete", description: "AI breakdown has been generated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to analyze script.", variant: "destructive" });
    },
  });

  const deleteScript = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/reference-scripts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reference-scripts"] });
      toast({ title: "Deleted", description: "Reference script removed." });
    },
  });

  const filtered = scripts?.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.creatorHandle.toLowerCase().includes(q) ||
      s.transcript.toLowerCase().includes(q) ||
      s.platform.toLowerCase().includes(q) ||
      s.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  const creators = scripts
    ? [...new Set(scripts.map((s) => s.creatorHandle))]
    : [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-scripts-title">
            <FlaskConical className="w-6 h-6 text-primary" />
            Script Lab
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Save and analyze scripts from creators you admire. The AI coach uses these patterns when helping you write.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-script">
              <Plus className="w-4 h-4 mr-1" />
              Add Script
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Reference Script</DialogTitle>
              <DialogDescription>
                Save a transcript from a creator you admire so the AI can learn from their style
              </DialogDescription>
            </DialogHeader>
            <AddScriptForm
              onSubmit={(data) => createScript.mutate(data)}
              isSubmitting={createScript.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {scripts && scripts.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search scripts, creators, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-scripts"
            />
          </div>
          <div className="flex gap-1.5">
            {creators.slice(0, 5).map((c) => (
              <Badge
                key={c}
                variant={searchQuery === c ? "default" : "secondary"}
                className="cursor-pointer text-xs"
                onClick={() => setSearchQuery(searchQuery === c ? "" : c)}
                data-testid={`badge-creator-filter-${c}`}
              >
                {c}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {!filtered || filtered.length === 0 ? (
        <EmptyScripts hasSearch={!!searchQuery} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((script) => (
            <ScriptCard
              key={script.id}
              script={script}
              isExpanded={expandedId === script.id}
              onToggleExpand={() => setExpandedId(expandedId === script.id ? null : script.id)}
              onAnalyze={() => analyzeScript.mutate(script.id)}
              onDelete={() => deleteScript.mutate(script.id)}
              isAnalyzing={analyzeScript.isPending && analyzeScript.variables === script.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ScriptCard({
  script,
  isExpanded,
  onToggleExpand,
  onAnalyze,
  onDelete,
  isAnalyzing,
}: {
  script: ReferenceScript;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAnalyze: () => void;
  onDelete: () => void;
  isAnalyzing: boolean;
}) {
  const platformColors: Record<string, string> = {
    instagram: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    tiktok: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    youtube: "bg-red-500/10 text-red-600 dark:text-red-400",
    twitter: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    facebook: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  };

  return (
    <Card className="group" data-testid={`card-script-${script.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0">
              <AtSign className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate" data-testid={`text-creator-${script.id}`}>
                {script.creatorHandle}
              </CardTitle>
              {script.creatorName && (
                <p className="text-xs text-muted-foreground truncate">{script.creatorName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="secondary" className={`text-xs ${platformColors[script.platform] || ""}`}>
              {script.platform}
            </Badge>
            {script.aiAnalysis && (
              <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 dark:text-green-400">
                Analyzed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-muted/50 rounded-md p-3">
          <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap" data-testid={`text-transcript-preview-${script.id}`}>
            {script.transcript}
          </p>
        </div>

        {script.tags && script.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {script.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {script.videoLink && (
          <a
            href={script.videoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
            data-testid={`link-video-${script.id}`}
          >
            <ExternalLink className="w-3 h-3" />
            View original video
          </a>
        )}

        {isExpanded && script.aiAnalysis && (
          <div className="bg-primary/5 border border-primary/10 rounded-md p-4 space-y-1">
            <p className="text-xs font-semibold text-primary flex items-center gap-1 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              AI Analysis
            </p>
            <div className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed" data-testid={`text-analysis-${script.id}`}>
              {script.aiAnalysis}
            </div>
          </div>
        )}

        {isExpanded && !script.aiAnalysis && (
          <div className="bg-muted/30 border border-dashed rounded-md p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">No analysis yet</p>
            <Button
              size="sm"
              onClick={onAnalyze}
              disabled={isAnalyzing}
              data-testid={`button-analyze-inline-${script.id}`}
            >
              {isAnalyzing ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 mr-1" />
              )}
              Analyze with AI
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            {!script.aiAnalysis && (
              <Button
                size="sm"
                variant="outline"
                onClick={onAnalyze}
                disabled={isAnalyzing}
                data-testid={`button-analyze-${script.id}`}
              >
                {isAnalyzing ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                )}
                Analyze
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleExpand}
              data-testid={`button-expand-${script.id}`}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 mr-1" />
                  Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 mr-1" />
                  {script.aiAnalysis ? "View Analysis" : "More"}
                </>
              )}
            </Button>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                data-testid={`button-delete-script-${script.id}`}
              >
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this reference script?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the script from {script.creatorHandle} and any AI analysis.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} data-testid="button-confirm-delete-script">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

function AddScriptForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (data: Partial<ReferenceScript>) => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState({
    creatorHandle: "",
    creatorName: "",
    videoLink: "",
    platform: "instagram",
    transcript: "",
    tagsInput: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = formData.tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSubmit({
      creatorHandle: formData.creatorHandle,
      creatorName: formData.creatorName || null,
      videoLink: formData.videoLink || null,
      platform: formData.platform,
      transcript: formData.transcript,
      tags: tags.length > 0 ? tags : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="creatorHandle">Creator Handle *</Label>
          <Input
            id="creatorHandle"
            value={formData.creatorHandle}
            onChange={(e) => setFormData((p) => ({ ...p, creatorHandle: e.target.value }))}
            placeholder="@username"
            required
            data-testid="input-creator-handle"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="creatorName">Creator Name</Label>
          <Input
            id="creatorName"
            value={formData.creatorName}
            onChange={(e) => setFormData((p) => ({ ...p, creatorName: e.target.value }))}
            placeholder="Their name (optional)"
            data-testid="input-creator-name"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="videoLink">Video Link</Label>
          <Input
            id="videoLink"
            value={formData.videoLink}
            onChange={(e) => setFormData((p) => ({ ...p, videoLink: e.target.value }))}
            placeholder="https://..."
            data-testid="input-script-video-link"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="platform">Platform</Label>
          <Select
            value={formData.platform}
            onValueChange={(v) => setFormData((p) => ({ ...p, platform: v }))}
          >
            <SelectTrigger data-testid="select-script-platform">
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
        <Label htmlFor="transcript">Script / Transcript *</Label>
        <Textarea
          id="transcript"
          value={formData.transcript}
          onChange={(e) => setFormData((p) => ({ ...p, transcript: e.target.value }))}
          placeholder="Paste the video script or transcript here..."
          rows={8}
          required
          data-testid="input-script-transcript"
        />
        <p className="text-xs text-muted-foreground">
          Copy from captions, use a transcription tool, or type it out manually
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          value={formData.tagsInput}
          onChange={(e) => setFormData((p) => ({ ...p, tagsInput: e.target.value }))}
          placeholder="e.g. storytelling, hook, emotional (comma-separated)"
          data-testid="input-script-tags"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-submit-script">
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
        ) : (
          <Plus className="w-4 h-4 mr-1" />
        )}
        Save to Library
      </Button>
    </form>
  );
}

function EmptyScripts({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
        <FileText className="w-8 h-8 text-primary" />
      </div>
      {hasSearch ? (
        <>
          <h3 className="text-lg font-semibold mb-1">No scripts found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Try a different search term or clear your filters.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold mb-1" data-testid="text-empty-scripts">
            Build your reference library
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            Save scripts from creators you admire. The AI will analyze their structure and use those patterns when helping you write your own content.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 max-w-md text-left space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">HOW IT WORKS</p>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <p>1. Find a video you love from a creator you admire</p>
              <p>2. Copy the transcript (from captions, or use a transcription tool)</p>
              <p>3. Paste it here and click "Analyze" to get an AI breakdown</p>
              <p>4. Your AI coach will reference these patterns in chat</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
