import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";

export interface AuthUser {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        queryClient.clear();
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    setIsLoggingOut(false);
  };

  const isLoading = session === undefined;
  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email ?? null,
        firstName: session.user.user_metadata?.first_name ?? null,
        lastName: session.user.user_metadata?.last_name ?? null,
        profileImageUrl: session.user.user_metadata?.avatar_url ?? null,
      }
    : null;

  return {
    user,
    isLoading,
    isAuthenticated: !!session,
    logout,
    isLoggingOut,
  };
}
