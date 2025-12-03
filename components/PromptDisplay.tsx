import React, { useState } from 'react';
import { AnalysisResult, SceneSegment } from '../types';
import { Copy, Check, Sparkles, Camera, Aperture, Sun, Palette, Film, PlayCircle, Clock, Zap } from 'lucide-react';
import ProductIntegration from './ProductIntegration';

interface PromptDisplayProps {
  result: AnalysisResult;
}

const PromptDisplay: React.FC<PromptDisplayProps> = ({ result }) => {
  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedSegmentIndex, setCopiedSegmentIndex] = useState<number | null>(null);

  const handleCopy = (text: string, isMain: boolean, index: number | null = null) => {
    navigator.clipboard.writeText(text);
    if (isMain) {
      setCopiedMain(true);
      setTimeout(() => setCopiedMain(false), 2000);
    } else {
      setCopiedSegmentIndex(index);
      setTimeout(() => setCopiedSegmentIndex(null), 2000);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      
      {/* 1. Main Prompt Card */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="p-2 bg-neon-purple/20 rounded-lg border border-neon-purple/30">
              <Sparkles className="w-6 h-6 text-neon-purple" />
            </span>
            <span>Master Prompt</span>
          </h2>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/5 to-neon-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          <div className="p-8 space-y-6 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-widest text-neon-blue uppercase font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neon-blue animate-pulse"></span>
                Full Sequence Generation
              </span>
              <button
                onClick={() => handleCopy(result.prompt, true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                  copiedMain 
                    ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-neon-purple/20 hover:border-neon-purple/50 hover:text-white hover:shadow-[0_0_15px_rgba(135,92,255,0.3)]'
                }`}
              >
                {copiedMain ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedMain ? 'COPIED' : 'COPY PROMPT'}
              </button>
            </div>
            
            <div className="bg-space-900/50 rounded-xl p-6 border border-white/5 font-mono text-sm md:text-base text-gray-200 leading-loose shadow-inner">
              {result.prompt}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Scene Breakdown / Storyboard */}
      {result.segments && result.segments.length > 0 && (
        <div className="space-y-8">
          <div className="flex items-center gap-3">
             <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
             <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Film className="w-6 h-6 text-neon-blue" />
              Temporal Breakdown
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>
         
          <div className="grid gap-6">
            {result.segments.map((segment, index) => (
              <div key={index} className="glass-card rounded-xl overflow-hidden flex flex-col md:flex-row group border border-white/5 hover:border-neon-blue/30 transition-all duration-300">
                
                {/* Left: Screenshot */}
                <div className="md:w-80 relative bg-space-900 flex-shrink-0">
                   {segment.screenshotUrl ? (
                     <div className="w-full h-full relative overflow-hidden">
                        <img src={segment.screenshotUrl} alt={`Scene at ${segment.timestamp}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                     </div>
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-700 min-h-[180px]">
                       <Film className="w-10 h-10 opacity-20" />
                     </div>
                   )}
                   <div className="absolute bottom-3 left-3 flex items-center gap-2">
                     <span className="bg-neon-blue/20 backdrop-blur-md px-2 py-1 rounded text-xs font-mono text-neon-blue border border-neon-blue/20 flex items-center gap-1">
                       <Clock className="w-3 h-3" />
                       {segment.timestamp}
                     </span>
                   </div>
                </div>

                {/* Right: Prompt Info */}
                <div className="flex-1 p-6 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3 font-sans">{segment.description}</h3>
                    <div className="relative">
                      <div className="pl-4 border-l-2 border-neon-purple/30 text-gray-400 font-mono text-sm leading-relaxed">
                        {segment.prompt}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleCopy(segment.prompt, false, index)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all duration-200 ${
                        copiedSegmentIndex === index
                          ? 'text-green-400' 
                          : 'text-gray-500 hover:text-white'
                      }`}
                    >
                      {copiedSegmentIndex === index ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedSegmentIndex === index ? 'COPIED' : 'COPY SEGMENT'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-10 border-t border-white/5">
        <DetailCard 
          icon={<Film className="w-5 h-5 text-neon-blue" />}
          title="Subject & Action"
          content={`${result.details.subject}. ${result.details.action}`}
        />
        <DetailCard 
          icon={<Camera className="w-5 h-5 text-neon-purple" />}
          title="Camera Work"
          content={result.details.camera}
        />
        <DetailCard 
          icon={<Aperture className="w-5 h-5 text-pink-400" />}
          title="Lighting"
          content={result.details.lighting}
        />
        <DetailCard 
          icon={<Palette className="w-5 h-5 text-emerald-400" />}
          title="Aesthetics"
          content={result.details.style}
        />
      </div>

      {/* 4. Brand Injection / Product Remix */}
      <ProductIntegration originalPrompt={result.prompt} />
      
    </div>
  );
};

const DetailCard: React.FC<{ icon: React.ReactNode; title: string; content: string; className?: string }> = ({ 
  icon, title, content, className = '' 
}) => (
  <div className={`glass-card p-6 rounded-xl hover:bg-white/5 transition-all duration-300 group ${className}`}>
    <div className="flex items-center gap-3 mb-4 text-white font-medium group-hover:text-neon-blue transition-colors">
      <div className="p-2 bg-white/5 rounded-lg group-hover:bg-neon-blue/10 transition-colors">
        {icon}
      </div>
      <span className="font-sans">{title}</span>
    </div>
    <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300">
      {content}
    </p>
  </div>
);

export default PromptDisplay;
