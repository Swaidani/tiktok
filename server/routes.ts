import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { TikTokApiService, MockTikTokApiService } from "./services/tiktokApi";
import { insertPostSchema, insertTikTokAccountSchema } from "../shared/schema";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Ensure uploads directory exists
  await fs.mkdir('uploads', { recursive: true });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // TikTok account routes
  app.get('/api/tiktok-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await storage.getTikTokAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching TikTok accounts:", error);
      res.status(500).json({ message: "Failed to fetch TikTok accounts" });
    }
  });

  app.post('/api/tiktok-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accountData = insertTikTokAccountSchema.parse({
        ...req.body,
        userId
      });

      // Use mock service for development
      const apiService = new MockTikTokApiService(accountData.accessToken);
      const userInfo = await apiService.getUserInfo();

      const account = await storage.createTikTokAccount({
        ...accountData,
        tiktokUserId: userInfo.open_id,
        username: userInfo.display_name.toLowerCase().replace(/\s+/g, ''),
        displayName: userInfo.display_name,
        avatarUrl: userInfo.avatar_url,
        followerCount: userInfo.follower_count,
        followingCount: userInfo.following_count,
        likesCount: userInfo.likes_count,
        videoCount: userInfo.video_count,
      });

      res.json(account);
    } catch (error: any) {
      console.error("Error creating TikTok account:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/tiktok-accounts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const accountId = parseInt(req.params.id);
      await storage.deleteTikTokAccount(accountId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting TikTok account:", error);
      res.status(500).json({ message: "Failed to delete TikTok account" });
    }
  });

  // Post routes
  app.get('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const posts = await storage.getPosts(userId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post('/api/posts', isAuthenticated, upload.single('video'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "Video file is required" });
      }

      // Create upload session
      const uploadSession = await storage.createUploadSession({
        userId,
        filename: file.filename,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadPath: file.path,
        status: "completed"
      });

      // Parse post data
      const postData = insertPostSchema.parse({
        ...req.body,
        userId,
        videoUrl: `/uploads/${file.filename}`,
        hashtags: req.body.hashtags ? JSON.parse(req.body.hashtags) : [],
        tiktokAccountId: parseInt(req.body.tiktokAccountId),
      });

      const post = await storage.createPost(postData);
      res.json(post);
    } catch (error: any) {
      console.error("Error creating post:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.patch('/api/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const updates = req.body;

      const post = await storage.updatePost(postId, updates);
      res.json(post);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.delete('/api/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      await storage.deletePost(postId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Post to TikTok
  app.post('/api/posts/:id/publish', isAuthenticated, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const tiktokAccount = await storage.getTikTokAccount(post.tiktokAccountId);
      if (!tiktokAccount) {
        return res.status(404).json({ message: "TikTok account not found" });
      }

      // Update post status to posting
      await storage.updatePost(postId, { status: "posting" });

      try {
        // Use mock service for development
        const apiService = new MockTikTokApiService(tiktokAccount.accessToken);
        
        const postInfo = {
          title: post.title,
          privacy_level: post.privacyLevel === 'public' ? 'PUBLIC_TO_EVERYONE' as const :
                        post.privacyLevel === 'friends' ? 'MUTUAL_FOLLOW_FRIEND' as const :
                        'SELF_ONLY' as const,
          disable_duet: !post.allowDuet,
          disable_comment: !post.allowComments,
          disable_stitch: !post.allowStitch,
        };

        const result = await apiService.postVideoFromUrl(
          `${req.protocol}://${req.get('host')}${post.videoUrl}`,
          postInfo
        );

        // Update post with success
        const updatedPost = await storage.updatePost(postId, {
          status: "posted",
          tiktokPostId: result.data.publish_id,
          postedAt: new Date(),
        });

        res.json(updatedPost);
      } catch (error: any) {
        // Update post with error
        await storage.updatePost(postId, {
          status: "failed",
          errorMessage: error.message,
        });
        throw error;
      }
    } catch (error: any) {
      console.error("Error publishing post:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Analytics routes
  app.get('/api/posts/:id/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const analytics = await storage.getPostAnalytics(postId);
      
      if (!analytics) {
        return res.status(404).json({ message: "Analytics not found" });
      }

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.post('/api/sync-analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const posts = await storage.getPosts(userId);
      const postedPosts = posts.filter(p => p.status === 'posted' && p.tiktokPostId);

      for (const post of postedPosts) {
        if (!post.tiktokPostId) continue;

        const tiktokAccount = await storage.getTikTokAccount(post.tiktokAccountId);
        if (!tiktokAccount) continue;

        try {
          // Use mock service for development
          const apiService = new MockTikTokApiService(tiktokAccount.accessToken);
          const analyticsData = await apiService.getVideoAnalytics([post.tiktokPostId]);
          const metrics = analyticsData[post.tiktokPostId]?.metrics;

          if (metrics) {
            await storage.upsertPostAnalytics({
              postId: post.id,
              viewCount: metrics.views,
              likeCount: metrics.likes,
              commentCount: metrics.comments,
              shareCount: metrics.shares,
              profileViewCount: metrics.profile_view,
              averagePlayDuration: metrics.video_view_duration_avg,
            });
          }
        } catch (error) {
          console.error(`Error syncing analytics for post ${post.id}:`, error);
        }
      }

      res.json({ message: "Analytics synced successfully" });
    } catch (error) {
      console.error("Error syncing analytics:", error);
      res.status(500).json({ message: "Failed to sync analytics" });
    }
  });

  // Serve uploaded files
  app.get('/uploads/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    res.sendFile(filePath);
  });

  const httpServer = createServer(app);
  return httpServer;
}