import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Zap, ChevronRight, ChevronLeft, Sparkles, Target, Globe, X } from "lucide-react";
import type { UserProfile } from "@shared/schema";

const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "twitter", label: "Twitter/X" },
  { value: "facebook", label: "Facebook" },
];

const NICHE_SUGGESTIONS = [
  "Storytelling", "Educational", "Comedy", "Day-in-my-life", "Fitness",
  "Cooking", "Tech reviews", "Finance", "Fashion", "Travel", "Gaming",
  "Music", "Art", "Motivation", "Business",
];

export function OnboardingModal() {
  const { data: profile, isLoading } = useQuery<UserProfile | null>({
    queryKey: ["/api/profile"],
  });

  const [step, setStep] = useState(0);
  const [niche, setNiche] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [goals, setGoals] = useState("");
  const [creators, setCreators] = useState("");
  const [dismissed, setDismissed] = useState(false);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const creatorList = creators
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      await apiRequest("PUT", "/api/profile", {
        niche,
        platforms,
        goals,
        inspirationCreators: creatorList.length > 0 ? creatorList : null,
        onboardingCompleted: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
  });

  if (isLoading || dismissed) return null;
  if (profile?.onboardingCompleted) return null;

  const isOpen = !profile?.onboardingCompleted && !dismissed;

  const togglePlatform = (p: string) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleComplete = () => {
    saveProfile.mutate();
  };

  const handleSkip = () => {
    setDismissed(true);
  };

  const steps = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "What kind of content do you create?",
      subtitle: "This helps your AI coach give you relevant advice",
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: "Where do you post?",
      subtitle: "Select your primary platforms",
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "What are your goals?",
      subtitle: "Tell us what you're working toward",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => setDismissed(true)}>
      <DialogContent className="sm:max-w-lg" data-testid="dialog-onboarding">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Step {step + 1} of {steps.length}
            </span>
          </div>
          <DialogTitle className="flex items-center gap-2">
            {steps[step].icon}
            {steps[step].title}
          </DialogTitle>
          <DialogDescription>{steps[step].subtitle}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="niche">Your niche or content style</Label>
                <Input
                  id="niche"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g. Cultural storytelling, fitness tips, tech reviews..."
                  data-testid="input-onboarding-niche"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Quick picks:</p>
                <div className="flex flex-wrap gap-1.5">
                  {NICHE_SUGGESTIONS.map((n) => (
                    <Badge
                      key={n}
                      variant={niche === n ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => setNiche(n)}
                      data-testid={`badge-niche-${n.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {n}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {PLATFORM_OPTIONS.map((p) => (
                  <Button
                    key={p.value}
                    type="button"
                    variant={platforms.includes(p.value) ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => togglePlatform(p.value)}
                    data-testid={`button-platform-${p.value}`}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goals">Your content goals</Label>
                <Textarea
                  id="goals"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="e.g. Grow my audience to 10K, improve my hook game, go viral consistently..."
                  rows={3}
                  data-testid="input-onboarding-goals"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creators">Creators you admire (optional)</Label>
                <Input
                  id="creators"
                  value={creators}
                  onChange={(e) => setCreators(e.target.value)}
                  placeholder="@creator1, @creator2, @creator3"
                  data-testid="input-onboarding-creators"
                />
                <p className="text-xs text-muted-foreground">
                  You can save their scripts later in the Script Lab
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            {step === 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                data-testid="button-onboarding-skip"
              >
                Skip for now
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(step - 1)}
                data-testid="button-onboarding-back"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div>
            {step < steps.length - 1 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={step === 0 && !niche}
                data-testid="button-onboarding-next"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={saveProfile.isPending}
                data-testid="button-onboarding-complete"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Get Started
              </Button>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-1.5 pt-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-primary" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
