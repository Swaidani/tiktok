import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User accounts table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// TikTok account connections
export const tiktokAccounts = pgTable("tiktok_accounts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tiktokUserId: varchar("tiktok_user_id").notNull(),
  username: varchar("username").notNull(),
  displayName: varchar("display_name"),
  avatarUrl: varchar("avatar_url"),
  followerCount: integer("follower_count").default(0),
  followingCount: integer("following_count").default(0),
  likesCount: integer("likes_count").default(0),
  videoCount: integer("video_count").default(0),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Video posts
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tiktokAccountId: integer("tiktok_account_id").notNull().references(() => tiktokAccounts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  hashtags: text("hashtags").array(),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  status: varchar("status", { enum: ["draft", "scheduled", "posting", "posted", "failed"] }).default("draft"),
  scheduledAt: timestamp("scheduled_at"),
  postedAt: timestamp("posted_at"),
  tiktokPostId: varchar("tiktok_post_id"),
  privacyLevel: varchar("privacy_level", { enum: ["public", "friends", "private"] }).default("public"),
  allowComments: boolean("allow_comments").default(true),
  allowDuet: boolean("allow_duet").default(true),
  allowStitch: boolean("allow_stitch").default(true),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Post analytics
export const postAnalytics = pgTable("post_analytics", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  shareCount: integer("share_count").default(0),
  playDuration: integer("play_duration").default(0),
  averagePlayDuration: integer("average_play_duration").default(0),
  profileViewCount: integer("profile_view_count").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Upload sessions for tracking file uploads
export const uploadSessions = pgTable("upload_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type").notNull(),
  uploadPath: text("upload_path").notNull(),
  status: varchar("status", { enum: ["uploading", "completed", "failed"] }).default("uploading"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type TikTokAccount = typeof tiktokAccounts.$inferSelect;
export type InsertTikTokAccount = typeof tiktokAccounts.$inferInsert;

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

export type PostAnalytics = typeof postAnalytics.$inferSelect;
export type InsertPostAnalytics = typeof postAnalytics.$inferInsert;

export type UploadSession = typeof uploadSessions.$inferSelect;
export type InsertUploadSession = typeof uploadSessions.$inferInsert;

// Zod schemas for validation
export const insertTikTokAccountSchema = z.object({
  userId: z.string(),
  tiktokUserId: z.string(),
  username: z.string(),
  displayName: z.string().optional(),
  avatarUrl: z.string().optional(),
  followerCount: z.number().optional(),
  followingCount: z.number().optional(),
  likesCount: z.number().optional(),
  videoCount: z.number().optional(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.date().optional(),
  isActive: z.boolean().optional(),
});

export const insertPostSchema = z.object({
  userId: z.string(),
  tiktokAccountId: z.number(),
  title: z.string(),
  description: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  videoUrl: z.string(),
  thumbnailUrl: z.string().optional(),
  status: z.enum(["draft", "scheduled", "posting", "posted", "failed"]).optional(),
  scheduledAt: z.date().optional(),
  postedAt: z.date().optional(),
  tiktokPostId: z.string().optional(),
  privacyLevel: z.enum(["public", "friends", "private"]).optional(),
  allowComments: z.boolean().optional(),
  allowDuet: z.boolean().optional(),
  allowStitch: z.boolean().optional(),
  errorMessage: z.string().optional(),
});

export const insertPostAnalyticsSchema = z.object({
  postId: z.number(),
  viewCount: z.number().optional(),
  likeCount: z.number().optional(),
  commentCount: z.number().optional(),
  shareCount: z.number().optional(),
  playDuration: z.number().optional(),
  averagePlayDuration: z.number().optional(),
  profileViewCount: z.number().optional(),
});

export const insertUploadSessionSchema = z.object({
  userId: z.string(),
  filename: z.string(),
  originalName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  uploadPath: z.string(),
  status: z.enum(["uploading", "completed", "failed"]).optional(),
});

export type InsertTikTokAccountForm = z.infer<typeof insertTikTokAccountSchema>;
export type InsertPostForm = z.infer<typeof insertPostSchema>;
export type InsertPostAnalyticsForm = z.infer<typeof insertPostAnalyticsSchema>;
export type InsertUploadSessionForm = z.infer<typeof insertUploadSessionSchema>;