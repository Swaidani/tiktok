import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Play, 
  Calendar, 
  BarChart3, 
  Plus, 
  Sun, 
  Moon, 
  Video, 
  Eye, 
  Heart, 
  MessageCircle,
  Share,
  Upload,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/components/ThemeProvider';
import { formatNumber, formatDateTime } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Post, TikTokAccount } from '@shared/schema';

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);

  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ['/api/posts'],
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<TikTokAccount[]>({
    queryKey: ['/api/tiktok-accounts'],
  });

  const syncAnalyticsMutation = useMutation({
    mutationFn: () => apiRequest('/api/sync-analytics', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (postId: number) => 
      apiRequest(`/api/posts/${postId}/publish`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    },
  });

  const filteredPosts = selectedAccount 
    ? posts.filter(post => post.tiktokAccountId === selectedAccount)
    : posts;

  const stats = {
    totalPosts: posts.length,
    scheduledPosts: posts.filter(p => p.status === 'scheduled').length,
    publishedPosts: posts.filter(p => p.status === 'posted').length,
    draftPosts: posts.filter(p => p.status === 'draft').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Video className="w-8 h-8 text-[#ff0050]" />
                <h1 className="text-2xl font-bold">TikTok Bot</h1>
              </div>
              <nav className="hidden md:flex space-x-6">
                <Link href="/">
                  <Button variant="ghost" className="text-foreground">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/create">
                  <Button variant="ghost" className="text-foreground">
                    Create Post
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button variant="ghost" className="text-foreground">
                    Analytics
                  </Button>
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="w-10 h-10"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
              <Link href="/create">
                <Button variant="tiktok" className="bg-[#ff0050] hover:bg-[#e6004a]">
                  <Plus className="w-4 h-4 mr-2" />
                  New Post
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPosts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <Play className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.publishedPosts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.scheduledPosts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <Upload className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draftPosts}</div>
            </CardContent>
          </Card>
        </div>

        {/* Account Filter & Sync */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Filter by Account:</label>
            <select
              value={selectedAccount || ''}
              onChange={(e) => setSelectedAccount(e.target.value ? Number(e.target.value) : null)}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="">All Accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  @{account.username}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={() => syncAnalyticsMutation.mutate()}
            disabled={syncAnalyticsMutation.isPending}
            variant="outline"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {syncAnalyticsMutation.isPending ? 'Syncing...' : 'Sync Analytics'}
          </Button>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {postsLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="w-full h-48 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredPosts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Video className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first TikTok post to get started
              </p>
              <Link href="/create">
                <Button variant="tiktok">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              </Link>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <CardHeader className="p-0">
                  <div className="relative">
                    {post.thumbnailUrl ? (
                      <img
                        src={post.thumbnailUrl}
                        alt={post.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center">
                        <Video className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${
                          post.status === 'posted'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                            : post.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                            : post.status === 'posting'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                            : post.status === 'failed'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {post.status}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">{post.title}</h3>
                  {post.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {post.description}
                    </p>
                  )}
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.hashtags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                      {post.hashtags.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{post.hashtags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mb-3">
                    {post.scheduledAt && post.status === 'scheduled' ? (
                      <span>Scheduled: {formatDateTime(post.scheduledAt)}</span>
                    ) : post.postedAt ? (
                      <span>Posted: {formatDateTime(post.postedAt)}</span>
                    ) : (
                      <span>Created: {formatDateTime(post.createdAt!)}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    {post.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => publishMutation.mutate(post.id)}
                        disabled={publishMutation.isPending}
                        className="bg-[#ff0050] hover:bg-[#e6004a] text-white"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Publish
                      </Button>
                    )}
                    {post.status === 'posted' && (
                      <Link href={`/analytics?post=${post.id}`}>
                        <Button size="sm" variant="outline">
                          <BarChart3 className="w-3 h-3 mr-1" />
                          Analytics
                        </Button>
                      </Link>
                    )}
                    {post.status === 'failed' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => publishMutation.mutate(post.id)}
                        disabled={publishMutation.isPending}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}