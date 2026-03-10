import {
  videos,
  conversations,
  messages,
  userProfiles,
  referenceScripts,
  type Video,
  type InsertVideo,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type UserProfile,
  type InsertUserProfile,
  type ReferenceScript,
  type InsertReferenceScript,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getVideosByUser(userId: string): Promise<Video[]>;
  getVideo(id: number, userId: string): Promise<Video | undefined>;
  createVideo(data: InsertVideo): Promise<Video>;
  updateVideo(id: number, userId: string, data: Partial<InsertVideo>): Promise<Video | undefined>;
  deleteVideo(id: number, userId: string): Promise<void>;

  getConversationsByUser(userId: string): Promise<Conversation[]>;
  getConversation(id: number, userId: string): Promise<Conversation | undefined>;
  createConversation(data: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, userId: string, title: string): Promise<Conversation | undefined>;
  deleteConversation(id: number, userId: string): Promise<void>;

  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(data: InsertMessage): Promise<Message>;

  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  upsertUserProfile(data: InsertUserProfile): Promise<UserProfile>;

  getReferenceScripts(userId: string): Promise<ReferenceScript[]>;
  getReferenceScript(id: number, userId: string): Promise<ReferenceScript | undefined>;
  createReferenceScript(data: InsertReferenceScript): Promise<ReferenceScript>;
  updateReferenceScript(id: number, userId: string, data: Partial<InsertReferenceScript>): Promise<ReferenceScript | undefined>;
  deleteReferenceScript(id: number, userId: string): Promise<void>;
}

class DatabaseStorage implements IStorage {
  async getVideosByUser(userId: string): Promise<Video[]> {
    return db.select().from(videos).where(eq(videos.userId, userId)).orderBy(desc(videos.createdAt));
  }

  async getVideo(id: number, userId: string): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(and(eq(videos.id, id), eq(videos.userId, userId)));
    return video;
  }

  async createVideo(data: InsertVideo): Promise<Video> {
    const [video] = await db.insert(videos).values(data).returning();
    return video;
  }

  async updateVideo(id: number, userId: string, data: Partial<InsertVideo>): Promise<Video | undefined> {
    const [video] = await db
      .update(videos)
      .set(data)
      .where(and(eq(videos.id, id), eq(videos.userId, userId)))
      .returning();
    return video;
  }

  async deleteVideo(id: number, userId: string): Promise<void> {
    await db.delete(videos).where(and(eq(videos.id, id), eq(videos.userId, userId)));
  }

  async getConversationsByUser(userId: string): Promise<Conversation[]> {
    return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
  }

  async getConversation(id: number, userId: string): Promise<Conversation | undefined> {
    const [conv] = await db.select().from(conversations).where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
    return conv;
  }

  async createConversation(data: InsertConversation): Promise<Conversation> {
    const [conv] = await db.insert(conversations).values(data).returning();
    return conv;
  }

  async updateConversation(id: number, userId: string, title: string): Promise<Conversation | undefined> {
    const [conv] = await db
      .update(conversations)
      .set({ title, updatedAt: new Date() })
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
      .returning();
    return conv;
  }

  async deleteConversation(id: number, userId: string): Promise<void> {
    const [conv] = await db.select().from(conversations).where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
    if (!conv) return;
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const [msg] = await db.insert(messages).values(data).returning();
    return msg;
  }

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async upsertUserProfile(data: InsertUserProfile): Promise<UserProfile> {
    const existing = await this.getUserProfile(data.userId);
    if (existing) {
      const [profile] = await db
        .update(userProfiles)
        .set(data)
        .where(eq(userProfiles.userId, data.userId))
        .returning();
      return profile;
    }
    const [profile] = await db.insert(userProfiles).values(data).returning();
    return profile;
  }

  async getReferenceScripts(userId: string): Promise<ReferenceScript[]> {
    return db.select().from(referenceScripts).where(eq(referenceScripts.userId, userId)).orderBy(desc(referenceScripts.createdAt));
  }

  async getReferenceScript(id: number, userId: string): Promise<ReferenceScript | undefined> {
    const [script] = await db.select().from(referenceScripts).where(and(eq(referenceScripts.id, id), eq(referenceScripts.userId, userId)));
    return script;
  }

  async createReferenceScript(data: InsertReferenceScript): Promise<ReferenceScript> {
    const [script] = await db.insert(referenceScripts).values(data).returning();
    return script;
  }

  async updateReferenceScript(id: number, userId: string, data: Partial<InsertReferenceScript>): Promise<ReferenceScript | undefined> {
    const [script] = await db
      .update(referenceScripts)
      .set(data)
      .where(and(eq(referenceScripts.id, id), eq(referenceScripts.userId, userId)))
      .returning();
    return script;
  }

  async deleteReferenceScript(id: number, userId: string): Promise<void> {
    await db.delete(referenceScripts).where(and(eq(referenceScripts.id, id), eq(referenceScripts.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
