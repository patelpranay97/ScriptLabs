import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { registerAuthRoutes } from "./replit_integrations/auth/routes";
import Anthropic from "@anthropic-ai/sdk";
import { insertVideoSchema, insertUserProfileSchema, insertReferenceScriptSchema } from "@shared/schema";
import { z } from "zod";

const SYSTEM_PROMPT = `You are ScriptLabs AI, an expert AI content strategy coach specializing in social media growth. You help creators craft viral content by analyzing scripts, reviewing video performance, and building their unique "Virality DNA."

Your expertise includes:
- Script writing and analysis for short-form video content (Reels, TikToks, Shorts)
- Understanding Instagram, TikTok, YouTube, and Twitter/X algorithms
- Analyzing video performance metrics (views, engagement, watch time, skip rates, retention curves)
- Identifying patterns in successful vs unsuccessful content
- Building personalized content strategies based on data

THE VIRALITY DNA FRAMEWORK:
When helping users craft content, reference these proven elements:
1. Start Midstream - Drop viewers directly into a memory, thought, or emotional situation. No setup or introductions.
2. Use Specific Cultural Anchors - Details that trigger nostalgia: names, foods, locations, products, language. Be specific, not generic.
3. Introduce Tension Early - Include clear internal or external pressure: embarrassment, cultural clash, identity conflict, parental expectations.
4. Include a Clear Emotional Shift - Childhood vs adult perspective. Moment of clarity, understanding, humor, or soft contradiction.
5. First Payoff by 20-25 Seconds - First emotional or narrative payoff should land here to retain attention.
6. End with Poetic, Not Preachy, Reflection - Don't moralize. Use soft emotional bow: nostalgia, irony, or quiet pride.
7. Optional but Powerful: Sensory Moments - Add one sensory visual: a smell, sound, or texture that makes the story feel real.

COACHING APPROACH:
- When a user shares a script, analyze it against the Virality DNA elements
- When performance data is shared, identify what worked and what didn't
- Ask probing questions to understand the creator's niche and audience
- Be encouraging but honest - point out weaknesses constructively
- Reference their past videos when they share performance data to build on patterns
- Remind users to track their metrics after posting (Day 1, Day 2, Day 3, Week 1)
- Help them build their personalized Virality DNA over time

When a user provides video data context, analyze it carefully and reference specific metrics in your advice. If they mention multiple videos, look for patterns across their content library.

Keep responses conversational, actionable, and focused. You're a coach, not a lecturer.

FORMATTING RULES:
- Write in a natural, conversational tone — like texting a smart friend
- Use short paragraphs (2-3 sentences max)
- Use bold sparingly for key takeaways only
- Use bullet points for lists, but keep them brief
- NEVER use markdown tables — present data in simple bullet lists instead
- NEVER use markdown headers (## or ###) — use bold text or line breaks to separate sections
- Avoid horizontal rules (---)
- Use emojis sparingly — one or two per response max
- Keep responses concise and scannable on mobile`;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  const anthropic = new Anthropic({
    apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  });

  app.get("/api/videos", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vids = await storage.getVideosByUser(userId);
      res.json(vids);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  app.post("/api/videos", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertVideoSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid video data", details: parsed.error.flatten() });
      }
      const video = await storage.createVideo(parsed.data);
      res.status(201).json(video);
    } catch (error) {
      console.error("Error creating video:", error);
      res.status(500).json({ error: "Failed to create video" });
    }
  });

  app.patch("/api/videos/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const video = await storage.updateVideo(id, userId, req.body);
      if (!video) return res.status(404).json({ error: "Video not found" });
      res.json(video);
    } catch (error) {
      console.error("Error updating video:", error);
      res.status(500).json({ error: "Failed to update video" });
    }
  });

  app.delete("/api/videos/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      await storage.deleteVideo(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting video:", error);
      res.status(500).json({ error: "Failed to delete video" });
    }
  });

  app.post("/api/videos/extract-metrics", isAuthenticated, async (req: any, res) => {
    try {
      const { image, mediaType } = req.body;
      if (!image) {
        return res.status(400).json({ error: "No image provided" });
      }

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType || "image/png",
                  data: image,
                },
              },
              {
                type: "text",
                text: `Analyze this social media insights/analytics screenshot and extract all visible metrics. Return a JSON object with ONLY the fields you can find in the image. Use these exact field names:

- "title": the video/post title if visible
- "views": total views (number only)
- "likes": total likes (number only)
- "comments": total comments (number only)
- "shares": total shares/sends (number only)
- "saves": total saves/bookmarks (number only)
- "accountsReached": accounts reached (number only)
- "watchTime": total watch time as a string (e.g. "13h 54m 12s")
- "avgWatchTime": average watch time as a string (e.g. "18sec")
- "skipRate": skip rate as a number (e.g. 56.1)
- "interactions": total interactions (number only)
- "profileActivity": profile activity/visits (number only)
- "platform": the platform if identifiable ("instagram", "tiktok", "youtube", "twitter", "facebook")

Only include fields where you can clearly read the value from the screenshot. For numeric fields, return just the number without commas or formatting. Return ONLY valid JSON, no other text.`,
              },
            ],
          },
        ],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        return res.status(500).json({ error: "No response from AI" });
      }

      let jsonStr = textBlock.text.trim();
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const metrics = JSON.parse(jsonStr);
      res.json(metrics);
    } catch (error) {
      console.error("Error extracting metrics:", error);
      res.status(500).json({ error: "Failed to extract metrics from screenshot" });
    }
  });

  app.get("/api/videos/export", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vids = await storage.getVideosByUser(userId);

      const headers = [
        "Title", "Platform", "Link", "Script", "Views", "Likes", "Comments",
        "Shares", "Saves", "Accounts Reached", "Watch Time", "Avg Watch Time",
        "Skip Rate", "Interactions", "Profile Activity", "Day 1 Views",
        "Day 2 Views", "Day 3 Views", "Week 1 Views", "Successful", "Key Points", "Posted At", "Created At"
      ];

      const escapeCSV = (val: any) => {
        if (val === null || val === undefined) return "";
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows = vids.map((v) => [
        v.title, v.platform, v.link, v.script, v.views, v.likes, v.comments,
        v.shares, v.saves, v.accountsReached, v.watchTime, v.avgWatchTime,
        v.skipRate, v.interactions, v.profileActivity, v.day1Views,
        v.day2Views, v.day3Views, v.week1Views,
        v.isSuccessful === null ? "Pending" : v.isSuccessful ? "Yes" : "No",
        v.keyPoints, v.postedAt, v.createdAt
      ].map(escapeCSV).join(","));

      const csv = [headers.join(","), ...rows].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=videos_export.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error exporting videos:", error);
      res.status(500).json({ error: "Failed to export videos" });
    }
  });

  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getUserProfile(userId);
      res.json(profile || null);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.put("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertUserProfileSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid profile data", details: parsed.error.flatten() });
      }
      const profile = await storage.upsertUserProfile(parsed.data);
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.get("/api/reference-scripts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const scripts = await storage.getReferenceScripts(userId);
      res.json(scripts);
    } catch (error) {
      console.error("Error fetching reference scripts:", error);
      res.status(500).json({ error: "Failed to fetch reference scripts" });
    }
  });

  app.post("/api/reference-scripts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertReferenceScriptSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid script data", details: parsed.error.flatten() });
      }
      const script = await storage.createReferenceScript(parsed.data);
      res.status(201).json(script);
    } catch (error) {
      console.error("Error creating reference script:", error);
      res.status(500).json({ error: "Failed to create reference script" });
    }
  });

  app.patch("/api/reference-scripts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const script = await storage.updateReferenceScript(id, userId, req.body);
      if (!script) return res.status(404).json({ error: "Script not found" });
      res.json(script);
    } catch (error) {
      console.error("Error updating reference script:", error);
      res.status(500).json({ error: "Failed to update reference script" });
    }
  });

  app.delete("/api/reference-scripts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      await storage.deleteReferenceScript(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting reference script:", error);
      res.status(500).json({ error: "Failed to delete reference script" });
    }
  });

  app.post("/api/reference-scripts/:id/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const script = await storage.getReferenceScript(id, userId);
      if (!script) return res.status(404).json({ error: "Script not found" });

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: `Analyze this social media video script from creator "${script.creatorHandle}" (${script.platform}). Break down the structural elements that make it effective.

SCRIPT:
${script.transcript}

Provide your analysis in this format:

HOOK STYLE: How does the video open? What technique is used to grab attention in the first 2-3 seconds?

STRUCTURE: What is the narrative structure? Break down the timing/flow (e.g., setup → escalation → payoff → close).

EMOTION ARC: What emotions does it move through? How does the tone shift throughout?

TONE: What's the overall voice/personality? (e.g., conversational, sarcastic, reflective, energetic)

PACING: How fast does it move? Where are the pauses or acceleration points?

KEY TECHNIQUES: What specific storytelling or content techniques are used? (e.g., pattern interrupts, callbacks, specificity, direct address)

WHAT MAKES IT WORK: In 2-3 sentences, why would this video perform well on ${script.platform}?

Keep the analysis concise and actionable — the creator will use these patterns to inform their own content.`,
          },
        ],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        return res.status(500).json({ error: "No analysis generated" });
      }

      const analysis = textBlock.text;
      const updated = await storage.updateReferenceScript(id, userId, { aiAnalysis: analysis });
      res.json(updated);
    } catch (error) {
      console.error("Error analyzing script:", error);
      res.status(500).json({ error: "Failed to analyze script" });
    }
  });

  app.get("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const convs = await storage.getConversationsByUser(userId);
      res.json(convs);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const conv = await storage.getConversation(id, userId);
      if (!conv) return res.status(404).json({ error: "Conversation not found" });
      const msgs = await storage.getMessagesByConversation(id);
      res.json({ ...conv, messages: msgs });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conv = await storage.createConversation({ userId, title: req.body.title || "New Chat" });
      res.status(201).json(conv);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.delete("/api/conversations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      await storage.deleteConversation(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  app.post("/api/conversations/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      const conv = await storage.getConversation(conversationId, userId);
      if (!conv) return res.status(404).json({ error: "Conversation not found" });

      await storage.createMessage({ conversationId, role: "user", content });

      const existingMessages = await storage.getMessagesByConversation(conversationId);

      const userVideos = await storage.getVideosByUser(userId);
      let videoContext = "";
      if (userVideos.length > 0) {
        const videoSummaries = userVideos.slice(0, 20).map((v) => {
          let summary = `- "${v.title}" (${v.platform})`;
          if (v.views) summary += ` | ${v.views} views`;
          if (v.likes) summary += `, ${v.likes} likes`;
          if (v.skipRate !== null) summary += `, ${v.skipRate}% skip rate`;
          if (v.isSuccessful !== null) summary += ` | ${v.isSuccessful ? "HIT" : "MISS"}`;
          if (v.keyPoints) summary += ` | Notes: ${v.keyPoints}`;
          if (v.script) summary += `\n  Script: "${v.script.slice(0, 500)}${v.script.length > 500 ? "..." : ""}"`;
          return summary;
        });
        videoContext = `\n\nUSER'S VIDEO LIBRARY (${userVideos.length} videos):\n${videoSummaries.join("\n")}\n\nYou have access to the user's video scripts above. When they ask about their scripts, reference them directly. Analyze scripts against the Virality DNA framework when relevant.`;
      }

      const userProfile = await storage.getUserProfile(userId);
      let profileContext = "";
      if (userProfile) {
        profileContext = `\n\nUSER PROFILE:`;
        if (userProfile.niche) profileContext += `\n- Niche: ${userProfile.niche}`;
        if (userProfile.platforms?.length) profileContext += `\n- Platforms: ${userProfile.platforms.join(", ")}`;
        if (userProfile.goals) profileContext += `\n- Goals: ${userProfile.goals}`;
        if (userProfile.inspirationCreators?.length) profileContext += `\n- Inspiration creators: ${userProfile.inspirationCreators.join(", ")}`;
      }

      const refScripts = await storage.getReferenceScripts(userId);
      let refContext = "";
      if (refScripts.length > 0) {
        const scriptSummaries = refScripts.slice(0, 10).map((s) => {
          let summary = `- ${s.creatorHandle} (${s.platform}): "${s.transcript.slice(0, 150)}..."`;
          if (s.aiAnalysis) summary += `\n  Analysis highlights: ${s.aiAnalysis.slice(0, 300)}...`;
          return summary;
        });
        refContext = `\n\nUSER'S REFERENCE SCRIPT LIBRARY (${refScripts.length} scripts from creators they admire):\n${scriptSummaries.join("\n")}\n\nWhen helping the user write scripts, draw on structural patterns, hooks, and techniques from their reference library. Point out when you're using a technique you noticed in their reference creators.`;
      }

      const chatMessages = existingMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: SYSTEM_PROMPT + profileContext + videoContext + refContext,
        messages: chatMessages,
      });

      let fullResponse = "";

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          const text = event.delta.text;
          if (text) {
            fullResponse += text;
            res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
          }
        }
      }

      await storage.createMessage({ conversationId, role: "assistant", content: fullResponse });

      if (existingMessages.length <= 1 && fullResponse.length > 0) {
        const titleSnippet = content.length > 40 ? content.slice(0, 40) + "..." : content;
        await storage.updateConversation(conversationId, userId, titleSnippet);
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error in chat:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "An error occurred" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });

  return httpServer;
}
