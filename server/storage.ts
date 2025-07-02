import {
  users,
  tiktokAccounts,
  posts,
  postAnalytics,
  uploadSessions,
  type User,
  type UpsertUser,
  type TikTokAccount,
  type InsertTikTokAccount,
  type Post,
  type InsertPost,
  type PostAnalytics,
  type InsertPostAnalytics,
  type UploadSession,
  type InsertUploadSession,
} from "../shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // TikTok account operations
  getTikTokAccounts(userId: string): Promise<TikTokAccount[]>;
  getTikTokAccount(id: number): Promise<TikTokAccount | undefined>;
  createTikTokAccount(account: InsertTikTokAccount): Promise<TikTokAccount>;
  updateTikTokAccount(id: number, updates: Partial<InsertTikTokAccount>): Promise<TikTokAccount>;
  deleteTikTokAccount(id: number): Promise<void>;

  // Post operations
  getPosts(userId: string): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, updates: Partial<InsertPost>): Promise<Post>;
  deletePost(id: number): Promise<void>;
  getScheduledPosts(): Promise<Post[]>;

  // Analytics operations
  getPostAnalytics(postId: number): Promise<PostAnalytics | undefined>;
  upsertPostAnalytics(analytics: InsertPostAnalytics): Promise<PostAnalytics>;

  // Upload operations
  createUploadSession(upload: InsertUploadSession): Promise<UploadSession>;
  updateUploadSession(id: number, updates: Partial<InsertUploadSession>): Promise<UploadSession>;
  getUploadSession(id: number): Promise<UploadSession | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // TikTok account operations
  async getTikTokAccounts(userId: string): Promise<TikTokAccount[]> {
    return await db
      .select()
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.userId, userId))
      .orderBy(desc(tiktokAccounts.createdAt));
  }

  async getTikTokAccount(id: number): Promise<TikTokAccount | undefined> {
    const [account] = await db
      .select()
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.id, id));
    return account;
  }

  async createTikTokAccount(accountData: InsertTikTokAccount): Promise<TikTokAccount> {
    const [account] = await db
      .insert(tiktokAccounts)
      .values(accountData)
      .returning();
    return account;
  }

  async updateTikTokAccount(id: number, updates: Partial<InsertTikTokAccount>): Promise<TikTokAccount> {
    const [account] = await db
      .update(tiktokAccounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tiktokAccounts.id, id))
      .returning();
    return account;
  }

  async deleteTikTokAccount(id: number): Promise<void> {
    await db.delete(tiktokAccounts).where(eq(tiktokAccounts.id, id));
  }

  // Post operations
  async getPosts(userId: string): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
  }

  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id));
    return post;
  }

  async createPost(postData: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(postData)
      .returning();
    return post;
  }

  async updatePost(id: number, updates: Partial<InsertPost>): Promise<Post> {
    const [post] = await db
      .update(posts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return post;
  }

  async deletePost(id: number): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  async getScheduledPosts(): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.status, "scheduled"),
          eq(posts.scheduledAt, new Date())
        )
      );
  }

  // Analytics operations
  async getPostAnalytics(postId: number): Promise<PostAnalytics | undefined> {
    const [analytics] = await db
      .select()
      .from(postAnalytics)
      .where(eq(postAnalytics.postId, postId));
    return analytics;
  }

  async upsertPostAnalytics(analyticsData: InsertPostAnalytics): Promise<PostAnalytics> {
    const [analytics] = await db
      .insert(postAnalytics)
      .values(analyticsData)
      .onConflictDoUpdate({
        target: postAnalytics.postId,
        set: {
          ...analyticsData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return analytics;
  }

  // Upload operations
  async createUploadSession(uploadData: InsertUploadSession): Promise<UploadSession> {
    const [upload] = await db
      .insert(uploadSessions)
      .values(uploadData)
      .returning();
    return upload;
  }

  async updateUploadSession(id: number, updates: Partial<InsertUploadSession>): Promise<UploadSession> {
    const [upload] = await db
      .update(uploadSessions)
      .set(updates)
      .where(eq(uploadSessions.id, id))
      .returning();
    return upload;
  }

  async getUploadSession(id: number): Promise<UploadSession | undefined> {
    const [upload] = await db
      .select()
      .from(uploadSessions)
      .where(eq(uploadSessions.id, id));
    return upload;
  }
}

export const storage = new DatabaseStorage();