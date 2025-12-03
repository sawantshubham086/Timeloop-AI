import React, { useState } from 'react';
import { ShoppingBag, ArrowRight, Wand2, X, Copy, Check, Shirt, Loader2, Image as ImageIcon, Download, Ratio, Zap } from 'lucide-react';
import { adaptPromptToProduct, generateBrandImage } from '../services/geminiService.proxy';

interface ProductIntegrationProps {
  originalPrompt: string;
}

const ProductIntegration: React.FC<ProductIntegrationProps> = ({ originalPrompt }) => {
  const [productImage, setProductImage] = useState<{ url: string; base64: string; mime: string } | null>(null);
  const [modifiedPrompt, setModifiedPrompt] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>("9:16");
  
  const [isAdapting, setIsAdapting] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [copied, setCopied] = useState(false);

  const ASPECT_RATIOS = [
    { label: "9:16", value: "9:16" },
    { label: "16:9", value: "16:9" },
    { label: "1:1", value: "1:1" },
    { label: "4:3", value: "4:3" },
  ];

  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case "16:9": return "aspect-video";
      case "9:16": return "aspect-[9/16]";
      case "1:1": return "aspect-square";
      case "4:3": return "aspect-[4/3]";
      case "3:4": return "aspect-[3/4]";
      default: return "aspect-[9/16]";
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const base64 = result.split(',')[1];
        setProductImage({
          url: URL.createObjectURL(file),
          base64: base64,
          mime: file.type
        });
        setModifiedPrompt(null);
        setGeneratedImageUrl(null);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleRemix = async () => {
    if (!productImage) return;

    setIsAdapting(true);
    setGeneratedImageUrl(null);
    try {
      const result = await adaptPromptToProduct(originalPrompt, productImage.base64, productImage.mime);
      setModifiedPrompt(result);
    } catch (error) {
      console.error(error);
      alert("Failed to adapt prompt. Please try again.");
    } finally {
      setIsAdapting(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!modifiedPrompt) return;
    
    setIsGeneratingImage(true);
    try {
      const imageUrl = await generateBrandImage(
        modifiedPrompt,
        productImage?.base64,
        productImage?.mime,
        aspectRatio
      );
      setGeneratedImageUrl(imageUrl);
    } catch (error) {
      console.error(error);
      alert("Failed to generate preview image.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCopy = () => {
    if (modifiedPrompt) {
      navigator.clipboard.writeText(modifiedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 pt-12 border-t border-white/10 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            Reality Injection
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Overwrite reality by inserting your object into the generated loop.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        
        {/* Left Column: Input & Controls */}
        <div className="space-y-6">
          <div className="relative group">
            {!productImage ? (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-white/20 rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 hover:border-neon-purple hover:shadow-[0_0_15px_rgba(135,92,255,0.2)] transition-all duration-300">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400 group-hover:text-neon-purple transition-colors">
                  <div className="p-4 rounded-full bg-space-800 mb-3 group-hover:scale-110 transition-transform">
                    <Shirt className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-semibold tracking-wide uppercase">Upload Asset</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG (Transparency Supported)</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            ) : (
              <div className="relative w-full h-64 bg-space-900 rounded-xl overflow-hidden border border-white/20 group-hover:border-neon-blue transition-colors">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <img src={productImage.url} alt="Product" className="w-full h-full object-contain p-6 relative z-10" />
                <button 
                  onClick={() => { setProductImage(null); setModifiedPrompt(null); setGeneratedImageUrl(null); }}
                  className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-red-500/80 transition-colors z-20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <button
              onClick={handleRemix}
              disabled={!productImage || isAdapting}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all uppercase tracking-wider text-sm ${
                !productImage 
                  ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5' 
                  : 'bg-gradient-to-r from-neon-purple to-indigo-600 text-white hover:shadow-[0_0_20px_rgba(135,92,255,0.4)] hover:scale-[1.01] border border-white/10'
              }`}
            >
              {isAdapting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Rewriting Timeline...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Generate Prompt Variant
                </>
              )}
            </button>
            
            {modifiedPrompt && (
              <div className="pt-4 space-y-4 border-t border-white/10">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <Ratio className="w-4 h-4 text-neon-blue" />
                     <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Output Ratio</span>
                   </div>
                 </div>
                 
                 <div className="flex gap-2">
                   {ASPECT_RATIOS.map((ratio) => (
                     <button
                       key={ratio.value}
                       onClick={() => setAspectRatio(ratio.value)}
                       disabled={isGeneratingImage}
                       className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                         aspectRatio === ratio.value
                           ? 'bg-neon-blue/20 border-neon-blue text-neon-blue shadow-[0_0_10px_rgba(106,225,255,0.2)]'
                           : 'bg-space-900 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                       }`}
                     >
                       {ratio.label}
                     </button>
                   ))}
                 </div>
                 
                 <button
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all uppercase tracking-wider text-sm border ${
                    isGeneratingImage
                    ? 'bg-white/5 text-gray-500 border-white/5'
                    : 'bg-space-900 text-neon-blue border-neon-blue/30 hover:bg-neon-blue/10 hover:border-neon-blue hover:shadow-[0_0_15px_rgba(106,225,255,0.2)]'
                  }`}
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Rendering Simulation...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5" />
                      Visualise Scene
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Results (Prompt & Image) */}
        <div className="flex flex-col gap-4">
          
          {/* Modified Prompt Box */}
          <div className="flex-1 glass-card rounded-xl p-1 flex flex-col min-h-[200px]">
             <div className="bg-space-900/50 w-full h-full rounded-lg p-6 flex flex-col">
              {modifiedPrompt ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-neon-purple uppercase tracking-wider flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-neon-purple"></span>
                       Injected Prompt
                    </span>
                    <button
                      onClick={handleCopy}
                      className="text-gray-500 hover:text-white transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[200px]">
                    <p className="text-gray-300 font-mono text-xs md:text-sm leading-relaxed whitespace-pre-wrap">
                      {modifiedPrompt}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                    <ArrowRight className="w-6 h-6 opacity-50" />
                  </div>
                  <p className="text-sm text-center px-8 opacity-60">
                    Awaiting asset upload for timeline injection.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Generated Image Preview Box */}
          {modifiedPrompt && (
             <div className={`relative rounded-xl border border-white/10 overflow-hidden bg-space-900 min-h-[250px] flex items-center justify-center transition-all duration-500 ${generatedImageUrl ? getAspectRatioClass(aspectRatio) : 'p-8'}`}>
                {/* Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                
                {generatedImageUrl ? (
                  <div className="group relative w-full h-full animate-in fade-in zoom-in-95 duration-700 z-10">
                    <img src={generatedImageUrl} alt="Generated Scene" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                      <a 
                        href={generatedImageUrl} 
                        download="branded_scene.png"
                        className="px-6 py-3 bg-neon-blue/20 border border-neon-blue/50 backdrop-blur-md text-white rounded-full font-bold text-sm flex items-center gap-2 hover:bg-neon-blue/30 hover:shadow-[0_0_20px_rgba(106,225,255,0.3)] transition-all"
                      >
                        <Download className="w-4 h-4" />
                        Save Image
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3 z-10">
                     {isGeneratingImage ? (
                        <div className="flex flex-col items-center text-neon-blue">
                          <Loader2 className="w-10 h-10 animate-spin mb-3" />
                          <p className="text-sm font-bold tracking-widest uppercase">Synthesizing...</p>
                        </div>
                     ) : (
                        <div className="flex flex-col items-center text-gray-600">
                          <ImageIcon className="w-10 h-10 mb-3 opacity-30" />
                          <p className="text-sm opacity-50">Visualisation ready</p>
                        </div>
                     )}
                  </div>
                )}
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProductIntegration;
