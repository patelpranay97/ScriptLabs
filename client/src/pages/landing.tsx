import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, BarChart3, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import { ScriptLabsLogo } from "@/components/scriptlabs-logo";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type AuthMode = "signin" | "signup" | "magic";

export default function Landing() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName },
      },
    });
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Account created!",
        description: "Check your email to confirm your account, then sign in.",
      });
      setMode("signin");
    }
    setLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      toast({ title: "Failed to send link", description: error.message, variant: "destructive" });
    } else {
      setMagicSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between gap-2 px-6 py-4 border-b">
        <ScriptLabsLogo iconSize={32} />
      </header>

      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              AI-Powered Content Coaching
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              Grow your social media with{" "}
              <span className="text-primary">intelligent coaching</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Analyze your scripts, track video performance, and discover your
              unique Virality DNA. Your personal AI coach learns from every video
              you post.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <FeatureCard
                icon={<MessageSquare className="w-5 h-5" />}
                title="AI Script Coach"
                description="Chat with Claude to craft scripts that perform."
              />
              <FeatureCard
                icon={<BarChart3 className="w-5 h-5" />}
                title="Performance Tracking"
                description="Log metrics and find patterns across your library."
              />
              <FeatureCard
                icon={<TrendingUp className="w-5 h-5" />}
                title="Virality DNA"
                description="Build your unique content formula over time."
              />
            </div>
          </div>
        </div>

        <div className="lg:w-96 border-t lg:border-t-0 lg:border-l flex items-center justify-center p-8">
          <div className="w-full max-w-sm space-y-6">
            {mode === "magic" ? (
              <>
                <div>
                  <h2 className="text-2xl font-bold">Magic link</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    We'll email you a link to sign in instantly.
                  </p>
                </div>
                {magicSent ? (
                  <div className="rounded-lg bg-primary/10 text-primary p-4 text-sm">
                    Check your email for a sign-in link.
                  </div>
                ) : (
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        data-testid="input-email"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading} data-testid="button-magic-link">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send magic link <ArrowRight className="w-4 h-4 ml-1" /></>}
                    </Button>
                  </form>
                )}
                <p className="text-center text-sm text-muted-foreground">
                  <button className="underline" onClick={() => setMode("signin")}>Back to sign in</button>
                </p>
              </>
            ) : mode === "signup" ? (
              <>
                <div>
                  <h2 className="text-2xl font-bold">Create account</h2>
                  <p className="text-sm text-muted-foreground mt-1">Start growing your content today.</p>
                </div>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Alex"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      data-testid="input-first-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      data-testid="input-email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      data-testid="input-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading} data-testid="button-signup">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create account <ArrowRight className="w-4 h-4 ml-1" /></>}
                  </Button>
                </form>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button className="underline text-foreground" onClick={() => setMode("signin")}>Sign in</button>
                </p>
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-2xl font-bold">Sign in</h2>
                  <p className="text-sm text-muted-foreground mt-1">Welcome back to ScriptLabs.</p>
                </div>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      data-testid="input-email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      data-testid="input-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading} data-testid="button-signin">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign in <ArrowRight className="w-4 h-4 ml-1" /></>}
                  </Button>
                </form>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setMode("magic")} data-testid="button-magic-link-option">
                  Sign in with magic link
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button className="underline text-foreground" onClick={() => setMode("signup")}>Sign up</button>
                </p>
              </>
            )}
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
    <div className="flex flex-col gap-2 p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <span className="font-semibold text-sm text-foreground">{title}</span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
