import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  BarChart3, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share, 
  TrendingUp,
  Users,
  Clock,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber, formatDateTime, formatDuration } from '@/lib/utils';
import type { Post, PostAnalytics } from '@shared/schema';

export default function Analytics() {
  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ['/api/posts'],
  });

  const publishedPosts = posts.filter(post => post.status === 'posted');

  // Calculate aggregate statistics
  const totalStats = publishedPosts.reduce(
    (acc, post) => {
      acc.posts += 1;
      return acc;
    },
    { posts: 0, views: 0, likes: 0, comments: 0, shares: 0 }
  );

  const averageEngagement = publishedPosts.length > 0 ? 
    Math.round((totalStats.likes + totalStats.comments + totalStats.shares) / publishedPosts.length * 100) / 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.posts}</div>
              <p className="text-xs text-muted-foreground">Published videos</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(totalStats.views)}</div>
              <p className="text-xs text-muted-foreground">Across all posts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(totalStats.likes)}</div>
              <p className="text-xs text-muted-foreground">Hearts from viewers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageEngagement}</div>
              <p className="text-xs text-muted-foreground">Likes + comments + shares</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Posts Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Posts Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border rounded animate-pulse">
                    <div className="w-16 h-16 bg-muted rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-right">
                      <div className="h-4 bg-muted rounded w-12" />
                      <div className="h-4 bg-muted rounded w-12" />
                      <div className="h-4 bg-muted rounded w-12" />
                      <div className="h-4 bg-muted rounded w-12" />
                    </div>
                  </div>
                ))}
              </div>
            ) : publishedPosts.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No analytics yet</h3>
                <p className="text-muted-foreground mb-4">
                  Publish some posts to see their performance data
                </p>
                <Link href="/create">
                  <Button variant="tiktok">Create Your First Post</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {publishedPosts.slice(0, 10).map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      {post.thumbnailUrl ? (
                        <img 
                          src={post.thumbnailUrl} 
                          alt={post.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <BarChart3 className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{post.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Posted {formatDateTime(post.postedAt!)}
                      </p>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-right text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">0</span>
                        <span className="text-xs text-muted-foreground flex items-center justify-end">
                          <Eye className="w-3 h-3 mr-1" />
                          Views
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">0</span>
                        <span className="text-xs text-muted-foreground flex items-center justify-end">
                          <Heart className="w-3 h-3 mr-1" />
                          Likes
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">0</span>
                        <span className="text-xs text-muted-foreground flex items-center justify-end">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Comments
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">0</span>
                        <span className="text-xs text-muted-foreground flex items-center justify-end">
                          <Share className="w-3 h-3 mr-1" />
                          Shares
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Tips */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Performance Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Content Optimization</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>Post consistently at peak hours (7-9 PM)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>Use trending hashtags relevant to your content</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>Create engaging thumbnails and compelling titles</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>Keep videos between 15-30 seconds for best reach</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold">Engagement Strategy</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>Respond to comments within the first hour</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>Use trending sounds and music</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>Cross-promote on other social platforms</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>Collaborate with other creators in your niche</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}