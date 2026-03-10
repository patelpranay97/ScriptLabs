import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export { users, sessions } from "./models/auth";
export type { User, UpsertUser } from "./models/auth";

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  link: text("link"),
  platform: text("platform").notNull().default("instagram"),
  script: text("script"),
  views: integer("views"),
  likes: integer("likes"),
  comments: integer("comments"),
  shares: integer("shares"),
  saves: integer("saves"),
  accountsReached: integer("accounts_reached"),
  watchTime: text("watch_time"),
  avgWatchTime: text("avg_watch_time"),
  skipRate: real("skip_rate"),
  interactions: integer("interactions"),
  profileActivity: integer("profile_activity"),
  day1Views: integer("day1_views"),
  day2Views: integer("day2_views"),
  day3Views: integer("day3_views"),
  week1Views: integer("week1_views"),
  isSuccessful: boolean("is_successful"),
  keyPoints: text("key_points"),
  postedAt: timestamp("posted_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  niche: text("niche"),
  platforms: text("platforms").array(),
  goals: text("goals"),
  inspirationCreators: text("inspiration_creators").array(),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  viralityDna: text("virality_dna"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const referenceScripts = pgTable("reference_scripts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  creatorHandle: text("creator_handle").notNull(),
  creatorName: text("creator_name"),
  videoLink: text("video_link"),
  platform: text("platform").notNull().default("instagram"),
  transcript: text("transcript").notNull(),
  aiAnalysis: text("ai_analysis"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
});

export const insertReferenceScriptSchema = createInsertSchema(referenceScripts).omit({
  id: true,
  createdAt: true,
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type ReferenceScript = typeof referenceScripts.$inferSelect;
export type InsertReferenceScript = z.infer<typeof insertReferenceScriptSchema>;
