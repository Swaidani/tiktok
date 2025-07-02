import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { MockTikTokApiService } from "./services/tiktokApi";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("uploads"));

// File upload configuration
const upload = multer({ 
  dest: "uploads/",
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Mock TikTok accounts endpoint
app.get('/api/tiktok-accounts', async (req, res) => {
  try {
    const accounts = await storage.getTikTokAccounts("user123");
    res.json(accounts);
  } catch (error) {
    console.error("Error fetching TikTok accounts:", error);
    res.status(500).json({ message: "Failed to fetch TikTok accounts" });
  }
});

// Posts endpoints
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await storage.getPosts("user123");
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});

app.post('/api/posts', upload.single('video'), async (req, res) => {
  try {
    const file = req.file;
    
    if (!file) {
      res.status(400).json({ message: "Video file is required" });
      return;
    }

    const { title, description, hashtags, scheduledFor, privacyLevel, allowComments, allowDuet, allowStitch } = req.body;

    const post = await storage.createPost({
      title,
      description,
      hashtags: hashtags ? hashtags.split(',').map((tag: string) => tag.trim()) : [],
      videoUrl: `/uploads/${file.filename}`,
      scheduledAt: scheduledFor ? new Date(scheduledFor) : null,
      status: scheduledFor ? "scheduled" : "draft",
      userId: "user123",
      tiktokAccountId: 1,
      privacyLevel: privacyLevel || "public",
      allowComments: allowComments === "true",
      allowDuet: allowDuet === "true",
      allowStitch: allowStitch === "true"
    });

    res.json(post);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Failed to create post" });
  }
});

app.post('/api/posts/:id/publish', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await storage.getPost(postId);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    // Use mock TikTok API service
    const apiService = new MockTikTokApiService("mock-token");
    
    const postInfo = {
      title: post.title,
      privacy_level: post.privacyLevel === 'public' ? 'PUBLIC_TO_EVERYONE' as const :
                    post.privacyLevel === 'friends' ? 'MUTUAL_FOLLOW_FRIEND' as const :
                    'SELF_ONLY' as const,
      disable_duet: !post.allowDuet,
      disable_comment: !post.allowComments,
      disable_stitch: !post.allowStitch,
    };

    // Mock publish - in real implementation this would call TikTok API
    const result = await apiService.postVideo();

    // Update post status
    await storage.updatePost(postId, {
      status: "posted",
      postedAt: new Date(),
      tiktokPostId: result.data.publish_id
    });

    res.json({ message: "Post published successfully", tiktokPostId: result.data.publish_id });
  } catch (error) {
    console.error("Error publishing post:", error);
    res.status(500).json({ message: "Failed to publish post" });
  }
});

app.get('/api/posts/:id/analytics', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const analytics = await storage.getPostAnalytics(postId);
    
    if (!analytics) {
      // Create mock analytics data for demo
      const mockAnalytics = await storage.upsertPostAnalytics({
        postId,
        viewCount: Math.floor(Math.random() * 10000),
        likeCount: Math.floor(Math.random() * 1000),
        commentCount: Math.floor(Math.random() * 100),
        shareCount: Math.floor(Math.random() * 50),
        playDuration: Math.floor(Math.random() * 60000),
        averagePlayDuration: Math.floor(Math.random() * 30000),
        profileViewCount: Math.floor(Math.random() * 500)
      });
      
      res.json(mockAnalytics);
      return;
    }
    
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

// Sync analytics endpoint
app.post('/api/sync-analytics', async (req, res) => {
  try {
    const posts = await storage.getPosts("user123");
    const publishedPosts = posts.filter(post => post.status === "posted");

    for (const post of publishedPosts) {
      // Mock analytics update
      await storage.upsertPostAnalytics({
        postId: post.id,
        viewCount: Math.floor(Math.random() * 10000),
        likeCount: Math.floor(Math.random() * 1000),
        commentCount: Math.floor(Math.random() * 100),
        shareCount: Math.floor(Math.random() * 50),
        playDuration: Math.floor(Math.random() * 60000),
        averagePlayDuration: Math.floor(Math.random() * 30000),
        profileViewCount: Math.floor(Math.random() * 500)
      });
    }

    res.json({ message: "Analytics synced successfully" });
  } catch (error) {
    console.error("Error syncing analytics:", error);
    res.status(500).json({ message: "Failed to sync analytics" });
  }
});

// Upload files endpoint
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);
  res.sendFile(filePath);
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction): void => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ message: 'File too large. Max size is 100MB.' });
      return;
    }
  }
  res.status(500).json({ message: error.message || 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 TikTok Bot API server running on port ${PORT}`);
  console.log(`📱 API available at http://localhost:${PORT}/api`);
});