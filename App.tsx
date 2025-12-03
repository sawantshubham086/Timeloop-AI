import React, { useState, useRef, useEffect } from 'react';
import { VideoData, AnalysisResult, AppState, SceneSegment } from './types';
import VideoUploader from './components/VideoUploader';
import PromptDisplay from './components/PromptDisplay';
import { analyzeVideoContent } from './services/geminiService.proxy';
import { supabase } from './src/lib/supabaseClient';
import LoginPage from './src/pages/LoginPage';
import { ScanEye, RefreshCw, X, ArrowDown, Aperture, Layers, Play, Zap, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const uploadSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || "");
      } else {
        setIsAuthenticated(false);
        setUserEmail("");
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || "");
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    handleReset();
  };

  const handleLoginSuccess = () => {
    checkAuth();
  };

  const handleVideoSelected = (data: VideoData) => {
    setVideoData(data);
    setAppState(AppState.PREVIEW);
    setErrorMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setVideoData(null);
    setResult(null);
    setErrorMsg(null);
  };

  const scrollToUpload = () => {
    uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const captureFrames = async (videoUrl: string, segments: SceneSegment[]): Promise<SceneSegment[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";
      
      const capturedSegments: SceneSegment[] = [];
      let currentIndex = 0;

      video.onloadedmetadata = async () => {
        const processNextFrame = async () => {
          if (currentIndex >= segments.length) {
            video.remove();
            resolve(capturedSegments);
            return;
          }

          const segment = segments[currentIndex];
          let seekTime = segment.timestampSeconds;
          if (seekTime > video.duration) seekTime = video.duration - 0.1;
          if (seekTime < 0) seekTime = 0;

          video.currentTime = seekTime;
        };

        video.onseeked = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
              capturedSegments.push({
                ...segments[currentIndex],
                screenshotUrl: dataUrl
              });
            } else {
              capturedSegments.push(segments[currentIndex]);
            }
            
            currentIndex++;
            processNextFrame();
          } catch (e) {
            console.error("Error capturing frame", e);
            currentIndex++;
            processNextFrame();
          }
        };
        
        processNextFrame();
      };

      video.onerror = (e) => reject(e);
    });
  };

  const handleAnalyze = async () => {
    if (!videoData) return;

    setAppState(AppState.ANALYZING);
    setErrorMsg(null);
    setProcessingStatus("Initializing Gemini 2.5 Vision Core...");

    try {
      setTimeout(() => setProcessingStatus("Scanning temporal data..."), 1500);
      setTimeout(() => setProcessingStatus("Extracting cinematic vectors..."), 3000);
      
      const analysis = await analyzeVideoContent(videoData.base64Data, videoData.mimeType);
      
      if (analysis.segments && analysis.segments.length > 0) {
        setProcessingStatus("Capturing keyframe evidence...");
        const segmentsWithImages = await captureFrames(videoData.previewUrl, analysis.segments);
        analysis.segments = segmentsWithImages;
      }

      setResult(analysis);
      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      setAppState(AppState.ERROR);
      setErrorMsg(err.message || "Analysis sequence failed.");
    }
  };

  return (
    <div className="min-h-screen bg-space text-gray-100 font-sans selection:bg-neon-purple/30 overflow-x-hidden">
      
      {/* Show login if not authenticated */}
      {!isAuthenticated && <LoginPage onLoginSuccess={handleLoginSuccess} />}

      {/* Show app if authenticated */}
      {isAuthenticated && (
        <>
      
      {/* --- Dynamic Background --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Deep space gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-space-800 via-space to-black"></div>
        
        {/* Animated Orbs */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-neon-purple/10 rounded-full blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-neon-blue/10 rounded-full blur-[100px] animate-float"></div>
        
        {/* Grid Floor */}
        <div className="absolute bottom-0 w-full h-[50vh] bg-[linear-gradient(to_bottom,transparent,rgba(135,92,255,0.05))] perspective-[1000px] transform-style-3d">
           <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [transform:rotateX(60deg)_scale(2)] opacity-30 origin-bottom"></div>
        </div>

        {/* Time Rings (Center) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full animate-spin-slow opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-dashed border-white/5 rounded-full animate-spin-reverse-slow opacity-20"></div>
      </div>

      {/* --- Navbar --- */}
      <nav className="fixed w-full z-50 top-0 border-b border-white/5 bg-space/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center shadow-[0_0_15px_rgba(135,92,255,0.4)]">
              <Aperture className="w-6 h-6 text-white animate-spin-slow" />
            </div>
            <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 font-display">
              TimeLoop AI
            </span>
          </div>
          
          {appState !== AppState.IDLE && (
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors backdrop-blur-sm"
            >
              <RefreshCw className="w-4 h-4" />
              New Loop
            </button>
          )}

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{userEmail}</span>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors backdrop-blur-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* --- Main Content Switcher --- */}
      <main className="relative z-10 pt-20">
        
        {/* ================= LANDING VIEW ================= */}
        {appState === AppState.IDLE && (
          <div className="flex flex-col">
            
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
               {/* Hero Content */}
               <div className="space-y-8 max-w-5xl mx-auto z-10 animate-in fade-in zoom-in-95 duration-1000">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neon-blue/30 bg-neon-blue/10 text-neon-blue text-xs font-mono tracking-widest mb-4">
                   <span className="w-2 h-2 rounded-full bg-neon-blue animate-pulse"></span>
                   Turn back time with a single tap
                 </div>
                 
                 <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-tight">
                   <span className="block text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">BEND TIME.</span>
                   <span className="block bg-clip-text text-transparent bg-gradient-to-r from-neon-purple via-neon-blue to-white drop-shadow-[0_0_30px_rgba(135,92,255,0.3)]">
                     REWIND REALITY.
                   </span>
                 </h1>
                 
                 <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
                   AI-powered video transformation. Reverse-engineer any footage into the perfect generation prompt.
                 </p>

                 <div className="pt-8">
                   <button 
                     onClick={scrollToUpload}
                     className="group relative inline-flex items-center justify-center px-10 py-5 font-bold text-white transition-all duration-300 bg-neon-purple rounded-full hover:shadow-[0_0_40px_rgba(135,92,255,0.6)] hover:scale-105"
                   >
                     <div className="absolute inset-0 rounded-full border border-white/20"></div>
                     <span className="flex items-center gap-3 text-lg tracking-wide">
                       INITIATE SEQUENCE
                       <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                     </span>
                   </button>
                 </div>
               </div>
            </section>

            {/* Upload Section (Anchor) */}
            <section ref={uploadSectionRef} className="py-24 px-4 relative">
              <div className="max-w-4xl mx-auto">
                 <VideoUploader onVideoSelected={handleVideoSelected} disabled={false} />
              </div>
            </section>

            {/* How It Works */}
            <section className="py-20 border-t border-white/5 bg-black/20 backdrop-blur-sm">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold mb-4">Workflow Protocol</h2>
                  <p className="text-gray-400">Three steps to master the loop</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    { icon: <Layers className="w-8 h-8 text-neon-blue" />, title: "Upload Source", desc: "Ingest any video file into the temporal engine." },
                    { icon: <Aperture className="w-8 h-8 text-neon-purple" />, title: "AI Analysis", desc: "Gemini 2.5 deconstructs lighting, motion, and composition." },
                    { icon: <Zap className="w-8 h-8 text-white" />, title: "Prompt Synthesis", desc: "Receive precise replication prompts & inject new reality." }
                  ].map((step, i) => (
                    <div key={i} className="glass-card p-8 rounded-2xl border border-white/5 hover:border-neon-purple/50 transition-all duration-300 group">
                      <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-black/50">
                        {step.icon}
                      </div>
                      <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                      <p className="text-gray-400 leading-relaxed">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Showcase / Footer */}
            <footer className="py-12 border-t border-white/5 text-center relative z-10 bg-black">
               <div className="mb-8">
                 <Aperture className="w-8 h-8 text-neon-purple mx-auto mb-4 animate-spin-slow" />
                 <h2 className="text-2xl font-bold tracking-tighter">TimeLoop AI</h2>
               </div>
               <p className="text-gray-600 text-sm">Designed by shubham sawant</p>
            </footer>

          </div>
        )}

        {/* ================= WORKSPACE VIEW ================= */}
        {appState !== AppState.IDLE && (
          <div className="max-w-7xl mx-auto px-4 py-10 min-h-[85vh] flex flex-col items-center animate-in fade-in duration-700">
            
            {/* State: PREVIEW */}
            {appState === AppState.PREVIEW && videoData && (
              <div className="w-full max-w-4xl flex flex-col items-center space-y-10">
                 <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] group">
                    <video 
                      src={videoData.previewUrl} 
                      controls 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-[1px] border-white/10 rounded-3xl box-border"></div>
                    
                    {/* Corner accents */}
                    <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-neon-blue"></div>
                    <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-neon-blue"></div>
                    <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-neon-blue"></div>
                    <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-neon-blue"></div>
                 </div>

                 <div className="text-center space-y-6">
                   <h2 className="text-3xl font-bold">Source Locked. Ready to Scan.</h2>
                   
                   <button
                     onClick={handleAnalyze}
                     className="group relative inline-flex items-center justify-center px-12 py-5 font-bold text-white transition-all duration-300 bg-white/5 rounded-full overflow-hidden hover:bg-white/10 border border-neon-purple/50 hover:border-neon-purple hover:shadow-[0_0_30px_rgba(135,92,255,0.4)]"
                   >
                     <div className="absolute inset-0 bg-neon-purple/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <span className="relative flex items-center gap-3 text-lg tracking-wide">
                       <ScanEye className="w-6 h-6 text-neon-purple" />
                       ANALYZE VECTORS
                     </span>
                   </button>
                   <p className="text-sm text-gray-500 font-mono uppercase tracking-widest">
                     Model: Gemini 2.5 Flash • Vision Enabled
                   </p>
                 </div>
              </div>
            )}

            {/* State: ANALYZING */}
            {appState === AppState.ANALYZING && (
              <div className="flex flex-col items-center justify-center py-32 space-y-12 w-full">
                <div className="relative w-48 h-48">
                  {/* Outer Rings */}
                  <div className="absolute inset-0 border-2 border-neon-purple/20 rounded-full animate-spin-slow"></div>
                  <div className="absolute inset-4 border-2 border-neon-blue/20 rounded-full animate-spin-reverse-slow"></div>
                  
                  {/* Center Pulse */}
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-32 h-32 bg-neon-purple/10 rounded-full blur-xl animate-pulse"></div>
                     <ScanEye className="w-12 h-12 text-white animate-pulse relative z-10" />
                  </div>
                </div>
                
                <div className="text-center space-y-4">
                  <h3 className="text-3xl font-bold text-white tracking-tight">Processing Timeline</h3>
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-neon-blue font-mono text-sm uppercase tracking-widest animate-pulse">
                      {processingStatus}
                    </p>
                    <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden mt-4">
                      <div className="h-full bg-gradient-to-r from-neon-purple to-neon-blue animate-progress-indeterminate"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* State: SUCCESS */}
            {appState === AppState.SUCCESS && result && (
              <PromptDisplay result={result} />
            )}

            {/* State: ERROR */}
            {appState === AppState.ERROR && (
               <div className="w-full max-w-md mx-auto p-8 glass-card border-red-500/30 rounded-2xl text-center space-y-6 animate-in fade-in zoom-in-95">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                    <X className="w-8 h-8 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Sequence Failed</h3>
                    <p className="text-red-300/80">{errorMsg}</p>
                  </div>
                  <button 
                    onClick={handleReset}
                    className="px-8 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-full transition-colors text-sm font-bold tracking-wide uppercase border border-red-500/20"
                  >
                    Reboot System
                  </button>
               </div>
            )}

            {/* Simple Footer for Workspace */}
            <div className="mt-auto py-8 text-center text-gray-600 text-xs font-mono uppercase tracking-widest opacity-50">
              TimeLoop AI • System Online
            </div>

          </div>
        )}

      </main>
        </>
      )}
    </div>
  );
};

export default App;
