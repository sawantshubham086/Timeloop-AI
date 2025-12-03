import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../services/databaseService';
import { Trash2, Play, Loader2 } from 'lucide-react';
import { createCheckoutSession } from '../../services/paymentService';

interface Video {
  id: string;
  title: string;
  file_size: number;
  created_at: string;
  duration_seconds: number;
}

interface DashboardProps {
  onVideoSelect: (videoId: string) => void;
}

export default function Dashboard({ onVideoSelect }: DashboardProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await DatabaseService.getUserVideos();
      setVideos(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm('Delete this video? This action cannot be undone.')) return;

    try {
      await DatabaseService.deleteVideo(videoId);
      setVideos(videos.filter(v => v.id !== videoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete video');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-neon-purple" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Your Videos</h2>
          <p className="text-gray-400">Manage and view your uploaded videos</p>
        </div>
        <div>
          <button
            onClick={async () => {
              try {
                const priceId = import.meta.env.VITE_STRIPE_PRICE_ID || '';
                if (!priceId) return alert('No price id configured. Set VITE_STRIPE_PRICE_ID in env.');
                const data = await createCheckoutSession(priceId);
                if (data?.url) window.location.href = data.url;
                else alert('Failed to create checkout session');
              } catch (err: any) {
                alert(err?.message || 'Checkout failed');
              }
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
          >
            Buy Credits
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {videos.length === 0 ? (
        <div className="text-center py-12 border border-white/10 rounded-lg">
          <p className="text-gray-400">No videos yet. Upload your first video to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:border-neon-purple/50 transition-all"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">{video.title || 'Untitled Video'}</h3>
                <div className="flex gap-4 text-sm text-gray-400">
                  <span>{formatFileSize(video.file_size)}</span>
                  <span>{video.duration_seconds ? `${Math.round(video.duration_seconds)}s` : 'Unknown duration'}</span>
                  <span>{formatDate(video.created_at)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onVideoSelect(video.id)}
                  className="p-2 rounded-lg bg-neon-purple/20 hover:bg-neon-purple/40 text-neon-purple transition-colors"
                  title="View analysis"
                >
                  <Play className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(video.id)}
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors"
                  title="Delete video"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
