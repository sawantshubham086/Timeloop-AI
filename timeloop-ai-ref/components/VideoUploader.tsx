import React, { useCallback, useState } from 'react';
import { Upload, FileVideo, AlertCircle, Aperture } from 'lucide-react';
import { VideoData } from '../types';

interface VideoUploaderProps {
  onVideoSelected: (data: VideoData) => void;
  disabled: boolean;
}

const MAX_FILE_SIZE_MB = 20;

const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoSelected, disabled }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    setError(null);
    
    if (!file.type.startsWith('video/')) {
      setError("Please upload a valid video file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File is too large. Max size: ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64Data = result.split(',')[1];
      
      onVideoSelected({
        file,
        previewUrl: URL.createObjectURL(file),
        base64Data,
        mimeType: file.type
      });
    };
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsDataURL(file);
  }, [onVideoSelected]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto relative z-10">
      {/* Decorative corners */}
      <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-neon-blue/50 rounded-tl-lg pointer-events-none"></div>
      <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-neon-blue/50 rounded-tr-lg pointer-events-none"></div>
      <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-neon-purple/50 rounded-bl-lg pointer-events-none"></div>
      <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-neon-purple/50 rounded-br-lg pointer-events-none"></div>

      <div 
        className={`relative glass-card overflow-hidden rounded-xl p-12 text-center transition-all duration-500 ease-out border-2 border-dashed
          ${dragActive 
            ? 'border-neon-blue bg-neon-blue/5 scale-[1.02] shadow-[0_0_30px_rgba(106,225,255,0.2)]' 
            : 'border-white/10 hover:border-neon-purple/50 hover:bg-white/5'
          }
          ${disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          accept="video/*"
          onChange={handleChange}
          disabled={disabled}
        />
        
        {/* Animated background particles within the card */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-purple/10 rounded-full blur-3xl transition-opacity duration-700 ${dragActive ? 'opacity-100' : 'opacity-0'}`}></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
          <div className={`relative p-5 rounded-2xl bg-space-800 border border-white/10 transition-transform duration-500 ${dragActive ? 'scale-110 rotate-3' : 'group-hover:scale-105'}`}>
            <Aperture className={`w-10 h-10 ${dragActive ? 'text-neon-blue animate-spin-slow' : 'text-neon-purple'}`} />
            {dragActive && (
              <div className="absolute inset-0 rounded-2xl bg-neon-blue/20 blur-md animate-pulse"></div>
            )}
          </div>
          
          <div className="space-y-2">
            <p className="text-xl font-bold text-white tracking-wide">
              {dragActive ? "Drop to Initialise" : "Upload Video Source"}
            </p>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              Drag & drop or click to browse
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-neon-blue/70 bg-space-900/80 px-4 py-2 rounded-full border border-neon-blue/10">
            <FileVideo className="w-3 h-3" />
            <span>MP4, MOV • MAX {MAX_FILE_SIZE_MB}MB</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 backdrop-blur-md rounded-lg flex items-center gap-3 text-red-200 text-sm animate-in fade-in slide-in-from-top-2 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default VideoUploader;