
import React, { useState } from 'react';
import { Sparkles, Image as ImageIcon, Wand2, AlertCircle, Square, Smartphone, Monitor, Zap, LayoutGrid } from 'lucide-react';
import { ImageUploader } from './components/ImageUploader';
import { ResultCard } from './components/ResultCard';
import { QualityComparator } from './components/QualityComparator';
import { Button } from './components/Button';
import { GeneratedImage, GenerationState } from './types';
import { generateImageVariation } from './services/geminiService';

type AppMode = 'generator' | 'comparator';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('generator');

  // Generator State
  const [refImage, setRefImage] = useState<{data: string, mime: string, preview: string} | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [enhanceQuality, setEnhanceQuality] = useState<boolean>(false);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [genState, setGenState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    error: null
  });

  const handleImageSelect = (base64: string, mimeType: string) => {
    const preview = `data:${mimeType};base64,${base64}`;
    setRefImage({ data: base64, mime: mimeType, preview });
  };

  const handleGenerate = async () => {
    if (!refImage || !prompt) return;

    // Reset old results if re-generating
    setResults([]);
    setGenState({ isGenerating: true, progress: 0, error: null });

    try {
      // We want 4 variations.
      // We will fire 4 parallel requests. The service handles retries internally (Auto-Fix).
      
      const generationPromises = Array(4).fill(null).map(async (_, index) => {
         try {
             const imgData = await generateImageVariation(
                refImage.data, 
                refImage.mime, 
                prompt, 
                aspectRatio,
                enhanceQuality
             );
             if (imgData) {
                 setGenState(prev => ({ ...prev, progress: prev.progress + 1 }));
                 return {
                     id: Date.now().toString() + index,
                     url: imgData,
                     prompt: prompt,
                     aspectRatio: aspectRatio,
                     createdAt: Date.now(),
                     enhanced: enhanceQuality
                 } as GeneratedImage;
             }
             return null;
         } catch (e) {
             console.error(`Generation ${index + 1} failed`, e);
             return null;
         }
      });

      const generatedResults = await Promise.all(generationPromises);
      const validResults = generatedResults.filter((r): r is GeneratedImage => r !== null);
      
      if (validResults.length === 0) {
          throw new Error("Unable to generate images after multiple auto-fix attempts. This might be due to safety filters or high server load. Please modify your prompt and try again.");
      }

      setResults(validResults);
      setGenState({ isGenerating: false, progress: 4, error: null });

    } catch (error: any) {
      setGenState({ 
        isGenerating: false, 
        progress: 0, 
        error: error.message || "An unexpected error occurred." 
      });
    }
  };

  const ratios = [
    { value: '1:1', label: 'Square', icon: Square },
    { value: '9:16', label: 'Portrait', icon: Smartphone },
    { value: '16:9', label: 'Landscape', icon: Monitor },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-sans selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="border-b border-gray-900 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Wand2 size={20} className="text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">Visionary AI</h1>
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">Image Architect</p>
                </div>
            </div>
             <nav className="hidden md:flex bg-gray-900/50 p-1 rounded-lg border border-gray-800">
                <button 
                  onClick={() => setMode('generator')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                    mode === 'generator' 
                    ? 'bg-gray-800 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Generator
                </button>
                <button 
                  onClick={() => setMode('comparator')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                    mode === 'comparator' 
                    ? 'bg-gray-800 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Quality Analyzer
                </button>
            </nav>
        </div>
      </header>

      {/* Mobile Nav */}
      <div className="md:hidden border-b border-gray-800 bg-black p-2 flex gap-2">
          <button 
              onClick={() => setMode('generator')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                mode === 'generator' ? 'bg-gray-800 text-white' : 'text-gray-500'
              }`}
            >
              Generator
            </button>
            <button 
              onClick={() => setMode('comparator')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                mode === 'comparator' ? 'bg-gray-800 text-white' : 'text-gray-500'
              }`}
            >
              Quality Analyzer
            </button>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-12">
        
        {mode === 'generator' ? (
          <>
            {/* Input Section */}
            <section className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Left: Upload */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 text-xs font-bold text-gray-400 border border-gray-700">1</span>
                        <h2 className="text-lg font-semibold text-gray-200">Reference Image</h2>
                    </div>
                    <ImageUploader 
                        selectedImage={refImage ? refImage.data : null} 
                        onImageSelect={handleImageSelect}
                        onClear={() => setRefImage(null)}
                    />
                     <p className="text-xs text-gray-500 pl-8">
                        Upload an image to analyze its features, composition, and lighting.
                    </p>
                </div>

                {/* Right: Prompt & Controls */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 text-xs font-bold text-gray-400 border border-gray-700">2</span>
                            <h2 className="text-lg font-semibold text-gray-200">Prompt Instruction</h2>
                        </div>
                        <div className="relative group">
                            <textarea 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe how you want to transform the image... (e.g., 'Change the setting to a futuristic cyber city at night, keep the main subject')"
                                className="w-full h-40 bg-gray-900 border-2 border-gray-800 rounded-xl p-4 text-gray-200 placeholder-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 text-xs font-bold text-gray-400 border border-gray-700">3</span>
                            <h2 className="text-lg font-semibold text-gray-200">Settings</h2>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                            {ratios.map((ratio) => (
                                <button
                                    key={ratio.value}
                                    onClick={() => setAspectRatio(ratio.value)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200 ${
                                        aspectRatio === ratio.value 
                                        ? 'bg-indigo-600/20 border-indigo-500 text-white' 
                                        : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700 hover:bg-gray-800'
                                    }`}
                                >
                                    <ratio.icon size={20} className="mb-2" />
                                    <span className="text-xs font-medium">{ratio.label}</span>
                                    <span className="text-[10px] text-gray-500 mt-0.5">{ratio.value}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setEnhanceQuality(!enhanceQuality)}
                            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                                enhanceQuality 
                                ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                                : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg transition-colors ${enhanceQuality ? 'bg-amber-500 text-black' : 'bg-gray-800'}`}>
                                    {enhanceQuality ? <Sparkles size={20} fill="currentColor" /> : <Zap size={20} />}
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold text-sm flex items-center gap-2">
                                        Magic Enhance
                                        {enhanceQuality && <span className="text-[9px] bg-amber-500 text-black px-1.5 rounded-full font-bold">ON</span>}
                                    </div>
                                    <div className="text-[10px] opacity-70">Boost details, lighting, and remove artifacts</div>
                                </div>
                            </div>
                            <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${enhanceQuality ? 'bg-amber-500' : 'bg-gray-800 border border-gray-700'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${enhanceQuality ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </button>
                    </div>

                    <div className="pt-4 border-t border-gray-800">
                        <Button 
                            onClick={handleGenerate} 
                            disabled={!refImage || !prompt}
                            isLoading={genState.isGenerating}
                            className={`w-full py-4 text-lg transition-all duration-500 ${enhanceQuality ? 'shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]' : ''}`}
                            variant={enhanceQuality ? 'primary' : 'primary'}
                            style={enhanceQuality ? { background: 'linear-gradient(to right, #d97706, #b45309)' } : {}}
                            icon={genState.isGenerating ? undefined : <Sparkles size={20} className={enhanceQuality ? "animate-pulse" : ""} />}
                        >
                            {genState.isGenerating 
                                ? `Generating ${enhanceQuality ? 'Enhanced ' : ''}Variations...` 
                                : `Generate ${enhanceQuality ? 'Enhanced ' : ''}Variations`}
                        </Button>
                        
                        {genState.error && (
                            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 animate-in slide-in-from-top-2">
                                <AlertCircle size={20} />
                                <span className="text-sm">{genState.error}</span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Results Section */}
            {(genState.isGenerating || results.length > 0) && (
                 <section className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <ImageIcon className={enhanceQuality ? "text-amber-500" : "text-indigo-500"} />
                            Generated Results
                        </h2>
                        {genState.isGenerating && (
                            <span className={`text-sm font-mono ${enhanceQuality ? "text-amber-500" : "text-indigo-400"}`}>
                                Processing {genState.progress}/4...
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {/* Loading Skeletons */}
                        {genState.isGenerating && results.length < 4 && Array.from({ length: 4 - results.length }).map((_, i) => (
                            <div key={`skeleton-${i}`} className={`rounded-xl bg-gray-900 border border-gray-800 overflow-hidden relative ${
                                aspectRatio === '9:16' ? 'aspect-[9/16]' : aspectRatio === '16:9' ? 'aspect-[16/9]' : 'aspect-square'
                            }`}>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-800/30 to-transparent w-full h-full -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 space-y-3">
                                    <Sparkles size={32} className={`animate-pulse opacity-50 ${enhanceQuality ? "text-amber-500" : ""}`} />
                                    <span className="text-xs font-medium tracking-widest uppercase">Rendering...</span>
                                </div>
                            </div>
                        ))}

                        {/* Actual Results */}
                        {results.map((img) => (
                            <ResultCard key={img.id} image={img} />
                        ))}
                    </div>
                 </section>
            )}
          </>
        ) : (
          <QualityComparator />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 mt-20 py-8 text-center text-gray-600 text-sm">
        <p>© {new Date().getFullYear()} Visionary AI. Powered by Gemini.</p>
      </footer>

    </div>
  );
};

export default App;
