import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { 
  ArrowLeft, 
  Upload, 
  Calendar, 
  Video, 
  Hash, 
  Type, 
  FileText,
  Play,
  Save,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { TikTokAccount } from '@shared/schema';

const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150, 'Title too long'),
  description: z.string().optional(),
  hashtags: z.string().optional(),
  tiktokAccountId: z.number().min(1, 'Please select a TikTok account'),
  privacyLevel: z.enum(['public', 'friends', 'private']).default('public'),
  allowComments: z.boolean().default(true),
  allowDuet: z.boolean().default(true),
  allowStitch: z.boolean().default(true),
  scheduledAt: z.string().optional(),
});

type CreatePostForm = z.infer<typeof createPostSchema>;

export default function CreatePost() {
  const [, setLocation] = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);

  const { data: accounts = [] } = useQuery<TikTokAccount[]>({
    queryKey: ['/api/tiktok-accounts'],
  });

  const form = useForm<CreatePostForm>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      privacyLevel: 'public',
      allowComments: true,
      allowDuet: true,
      allowStitch: true,
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: CreatePostForm) => {
      if (!selectedFile) {
        throw new Error('Please select a video file');
      }

      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('title', data.title);
      formData.append('tiktokAccountId', data.tiktokAccountId.toString());
      formData.append('privacyLevel', data.privacyLevel);
      formData.append('allowComments', data.allowComments.toString());
      formData.append('allowDuet', data.allowDuet.toString());
      formData.append('allowStitch', data.allowStitch.toString());
      
      if (data.description) formData.append('description', data.description);
      if (data.hashtags) {
        const hashtagArray = data.hashtags
          .split(/[,\s]+/)
          .map(tag => tag.replace('#', '').trim())
          .filter(tag => tag.length > 0);
        formData.append('hashtags', JSON.stringify(hashtagArray));
      }
      if (data.scheduledAt) formData.append('scheduledAt', data.scheduledAt);

      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      setLocation('/');
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const onSubmit = (data: CreatePostForm) => {
    createPostMutation.mutate(data);
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">Create New Post</h1>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Video Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Video className="w-5 h-5" />
                  <span>Upload Video</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedFile ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted-foreground/25 hover:border-primary/50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">
                      Drop your video here or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Supports MP4, MOV, AVI (max 100MB)
                    </p>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="video-upload"
                    />
                    <label htmlFor="video-upload">
                      <Button type="button" variant="outline" asChild>
                        <span>Choose File</span>
                      </Button>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Video className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Post Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Type className="w-5 h-5" />
                  <span>Post Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Title *
                  </label>
                  <input
                    {...form.register('title')}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="Enter your video title..."
                    maxLength={150}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    {...form.register('description')}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md bg-background resize-none"
                    placeholder="Tell people about your video..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Hashtags
                  </label>
                  <input
                    {...form.register('hashtags')}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="#viral #fyp #trending"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Separate hashtags with spaces or commas
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    TikTok Account *
                  </label>
                  <select
                    {...form.register('tiktokAccountId', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="">Select an account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        @{account.username} ({account.displayName})
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.tiktokAccountId && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.tiktokAccountId.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Privacy & Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Privacy Level
                  </label>
                  <select
                    {...form.register('privacyLevel')}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...form.register('allowComments')}
                      className="rounded"
                    />
                    <span className="text-sm">Allow comments</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...form.register('allowDuet')}
                      className="rounded"
                    />
                    <span className="text-sm">Allow duets</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...form.register('allowStitch')}
                      className="rounded"
                    />
                    <span className="text-sm">Allow stitches</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Schedule for later</span>
                  </label>
                  {isScheduled && (
                    <input
                      type="datetime-local"
                      {...form.register('scheduledAt')}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4">
              <Link href="/">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={createPostMutation.isPending || !selectedFile}
                className="bg-[#ff0050] hover:bg-[#e6004a] text-white"
              >
                {createPostMutation.isPending ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    {isScheduled ? 'Scheduling...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {isScheduled ? (
                      <Calendar className="w-4 h-4 mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isScheduled ? 'Schedule Post' : 'Create Post'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}