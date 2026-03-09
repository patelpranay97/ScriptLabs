import {
  videos,
  conversations,
  messages,
  type Video,
  type InsertVideo,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
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
}

export const storage = new DatabaseStorage();
