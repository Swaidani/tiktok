import axios from 'axios';
import FormData from 'form-data';

export interface TikTokUserInfo {
  open_id: string;
  union_id: string;
  avatar_url: string;
  display_name: string;
  bio_description: string;
  profile_deep_link: string;
  is_verified: boolean;
  follower_count: number;
  following_count: number;
  likes_count: number;
  video_count: number;
}

export interface TikTokPostRequest {
  post_info: {
    title: string;
    privacy_level: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIEND' | 'SELF_ONLY';
    disable_duet: boolean;
    disable_comment: boolean;
    disable_stitch: boolean;
    video_cover_timestamp_ms?: number;
  };
  source_info: {
    source: 'FILE_UPLOAD' | 'PULL_FROM_URL';
    video_url?: string;
    video_size?: number;
  };
}

export interface TikTokPostResponse {
  data: {
    publish_id: string;
  };
  error?: {
    code: string;
    message: string;
    log_id: string;
  };
}

export interface TikTokAnalytics {
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    profile_view: number;
    video_view_duration_avg: number;
  };
}

export class TikTokApiService {
  private baseUrl = 'https://open.tiktokapis.com';
  
  constructor(private accessToken: string) {}

  // Get user info
  async getUserInfo(): Promise<TikTokUserInfo> {
    try {
      const response = await axios.get(`${this.baseUrl}/v2/user/info/`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        params: {
          fields: 'open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count'
        }
      });
      
      return response.data.data.user;
    } catch (error: any) {
      throw new Error(`Failed to get user info: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Upload and post video directly
  async postVideo(videoBuffer: Buffer, postInfo: TikTokPostRequest['post_info']): Promise<TikTokPostResponse> {
    try {
      // Step 1: Initialize upload
      const initResponse = await axios.post(`${this.baseUrl}/v2/post/publish/video/init/`, {
        post_info: postInfo,
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: videoBuffer.length
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const { upload_url, publish_id } = initResponse.data.data;

      // Step 2: Upload video file
      const formData = new FormData();
      formData.append('video', videoBuffer, 'video.mp4');
      
      await axios.put(upload_url, formData, {
        headers: {
          ...formData.getHeaders(),
        }
      });

      return { data: { publish_id } };
    } catch (error: any) {
      throw new Error(`Failed to post video: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Post video from URL
  async postVideoFromUrl(videoUrl: string, postInfo: TikTokPostRequest['post_info']): Promise<TikTokPostResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/v2/post/publish/video/init/`, {
        post_info: postInfo,
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: videoUrl
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to post video from URL: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Get video analytics
  async getVideoAnalytics(videoIds: string[]): Promise<Record<string, TikTokAnalytics>> {
    try {
      const response = await axios.post(`${this.baseUrl}/v2/research/video/query/`, {
        query: {
          and: [
            {
              operation: 'IN',
              field_name: 'video_id',
              field_values: videoIds
            }
          ]
        },
        max_count: videoIds.length,
        cursor: 0,
        search_id: Date.now().toString()
      }, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const analytics: Record<string, TikTokAnalytics> = {};
      
      if (response.data.data?.videos) {
        response.data.data.videos.forEach((video: any) => {
          analytics[video.id] = {
            metrics: {
              likes: video.like_count || 0,
              comments: video.comment_count || 0,
              shares: video.share_count || 0,
              views: video.view_count || 0,
              profile_view: video.profile_view || 0,
              video_view_duration_avg: video.video_view_duration_avg || 0,
            }
          };
        });
      }

      return analytics;
    } catch (error: any) {
      throw new Error(`Failed to get analytics: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string, clientKey: string, clientSecret: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
    try {
      const response = await axios.post(`${this.baseUrl}/v2/oauth/token/`, {
        client_key: clientKey,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data.data;
    } catch (error: any) {
      throw new Error(`Failed to refresh token: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

// Mock TikTok API for development/testing
export class MockTikTokApiService extends TikTokApiService {
  async getUserInfo(): Promise<TikTokUserInfo> {
    return {
      open_id: 'mock_user_123',
      union_id: 'union_123',
      avatar_url: 'https://via.placeholder.com/150',
      display_name: 'Test User',
      bio_description: 'This is a test account',
      profile_deep_link: 'https://tiktok.com/@testuser',
      is_verified: false,
      follower_count: 1500,
      following_count: 300,
      likes_count: 25000,
      video_count: 42
    };
  }

  async postVideo(): Promise<TikTokPostResponse> {
    return {
      data: {
        publish_id: `mock_post_${Date.now()}`
      }
    };
  }

  async postVideoFromUrl(): Promise<TikTokPostResponse> {
    return {
      data: {
        publish_id: `mock_post_${Date.now()}`
      }
    };
  }

  async getVideoAnalytics(videoIds: string[]): Promise<Record<string, TikTokAnalytics>> {
    const analytics: Record<string, TikTokAnalytics> = {};
    
    videoIds.forEach(id => {
      analytics[id] = {
        metrics: {
          likes: Math.floor(Math.random() * 10000),
          comments: Math.floor(Math.random() * 1000),
          shares: Math.floor(Math.random() * 500),
          views: Math.floor(Math.random() * 100000),
          profile_view: Math.floor(Math.random() * 200),
          video_view_duration_avg: Math.floor(Math.random() * 30000), // in milliseconds
        }
      };
    });

    return analytics;
  }
}