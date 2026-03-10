import { Button } from "@/components/ui/button";
import { Zap, MessageSquare, BarChart3, TrendingUp, ArrowRight } from "lucide-react";
import { ScriptLabsLogo } from "@/components/scriptlabs-logo";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between gap-2 px-6 py-4 border-b">
        <ScriptLabsLogo iconSize={32} />
        <a href="/api/login">
          <Button data-testid="button-login">Sign In</Button>
        </a>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-3xl mx-auto text-center space-y-8 py-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Content Coaching
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
            Grow your social media with{" "}
            <span className="text-primary">intelligent coaching</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Analyze your scripts, track video performance, and discover your
            unique Virality DNA. Your personal AI coach learns from every video
            you post to help you create content that resonates.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="/api/login">
              <Button size="lg" data-testid="button-get-started">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </a>
          </div>
        </div>

        <div className="w-full max-w-4xl mx-auto pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<MessageSquare className="w-5 h-5" />}
              title="AI Script Coach"
              description="Chat with Claude to craft scripts, analyze what works, and refine your content strategy based on real performance data."
            />
            <FeatureCard
              icon={<BarChart3 className="w-5 h-5" />}
              title="Performance Tracking"
              description="Log your video metrics - views, engagement, watch time, skip rates - and see patterns across your content library."
            />
            <FeatureCard
              icon={<TrendingUp className="w-5 h-5" />}
              title="Virality DNA"
              description="Build your unique content formula. Your AI coach extracts lessons from every video to maximize your chances of going viral."
            />
          </div>
        </div>
      </main>

      <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">
        ScriptLabs - AI-Powered Content Strategy
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
      <div className="flex items-start gap-2">
        <div className="text-primary mt-0.5">{icon}</div>
        <div className="text-left">
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
