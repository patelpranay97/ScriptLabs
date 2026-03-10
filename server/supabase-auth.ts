import { createClient } from "@supabase/supabase-js";
import type { RequestHandler } from "express";
import { authStorage } from "./replit_integrations/auth/storage";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const supabaseUser = data.user;

    await authStorage.upsertUser({
      id: supabaseUser.id,
      email: supabaseUser.email ?? null,
      firstName: supabaseUser.user_metadata?.first_name ?? null,
      lastName: supabaseUser.user_metadata?.last_name ?? null,
      profileImageUrl: supabaseUser.user_metadata?.avatar_url ?? null,
    });

    req.user = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      firstName: supabaseUser.user_metadata?.first_name ?? null,
      lastName: supabaseUser.user_metadata?.last_name ?? null,
      profileImageUrl: supabaseUser.user_metadata?.avatar_url ?? null,
    };

    return next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
