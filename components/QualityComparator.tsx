
import React, { useState, useCallback } from 'react';
import { Upload, X, Trophy, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { Button } from './Button';
import { compareImagesQuality } from '../services/geminiService';
import { AnalysisResult } from '../types';

export const QualityComparator: React.FC = () => {
  const [images, setImages] = useState<{data: string, mime: string, preview: string}[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(Array.from(files));
    }
  }, [images]);

  const processFiles = (files: File[]) => {
    const newImages: {data: string, mime: string, preview: string}[] = [];
    let processedCount = 0;

    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        newImages.push({
          data: base64Data,
          mime: file.type,
          preview: base64String
        });
        
        processedCount++;
        if (processedCount === files.length) {
          setImages(prev => [...prev, ...newImages].slice(0, 4)); // Limit to 4 images
          setResult(null); // Reset results on new upload
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const handleCompare = async () => {
    if (images.length < 2) {
      setError("Please upload at least 2 images to compare.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const analysis = await compareImagesQuality(images.map(img => ({ data: img.data, mimeType: img.mime })));
      setResult(analysis);
    } catch (err: any) {
      setError(err.message || "Failed to analyze images.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Quality Analysis Studio</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Upload up to 4 images. AI will analyze technical parameters (sharpness, noise, exposure) and aesthetic composition to identify the winner.
        </p>
      </div>

      {/* Upload Area */}
      {images.length < 4 && (
        <div className="relative border-2 border-dashed border-gray-700 hover:border-indigo-500 bg-gray-900/50 rounded-xl p-8 text-center transition-all group">
          <input 
            type="file" 
            accept="image/*" 
            multiple
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center justify-center space-y-3 text-gray-400 group-hover:text-indigo-400 transition-colors">
            <div className="p-3 bg-gray-800 rounded-full group-hover:bg-indigo-500/10">
              <Upload size={24} />
            </div>
            <p className="font-medium">Drop images here to compare</p>
            <p className="text-xs text-gray-500">Supports JPG, PNG, WEBP (Max 4)</p>
          </div>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {images.map((img, index) => {
            const isWinner = result?.bestImageIndex === index;
            const analysis = result?.analyses.find(a => a.index === index);

            return (
              <div 
                key={index} 
                className={`relative group rounded-xl overflow-hidden bg-gray-900 transition-all duration-500 ${
                  isWinner 
                    ? 'ring-4 ring-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)] scale-[1.02] z-10' 
                    : result 
                      ? 'opacity-60 hover:opacity-100 scale-95 grayscale-[0.5] hover:grayscale-0' 
                      : 'border border-gray-800'
                }`}
              >
                {/* Remove Button (only when not analyzing) */}
                {!isAnalyzing && !result && (
                  <button 
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-20"
                  >
                    <X size={16} />
                  </button>
                )}

                {/* Winner Badge */}
                {isWinner && (
                  <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-amber-500/90 to-transparent p-4 z-20 flex flex-col items-center">
                    <div className="bg-amber-500 text-black p-2 rounded-full shadow-lg mb-1">
                      <Trophy size={24} fill="black" />
                    </div>
                    <span className="font-bold text-white text-sm tracking-wider shadow-black drop-shadow-md">WINNER</span>
                  </div>
                )}

                {/* Image */}
                <div className="aspect-[3/4] w-full">
                  <img src={img.preview} alt={`Upload ${index}`} className="w-full h-full object-cover" />
                </div>

                {/* Analysis Overlay */}
                {result && analysis && (
                  <div className={`absolute inset-x-0 bottom-0 p-4 backdrop-blur-md border-t ${
                    isWinner ? 'bg-amber-950/80 border-amber-500/30' : 'bg-gray-900/90 border-gray-800'
                  }`}>
                    <div className="flex items-end justify-between mb-2">
                       <span className={`text-3xl font-bold ${isWinner ? 'text-amber-400' : 'text-gray-500'}`}>
                         {analysis.score}
                       </span>
                       <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Score</span>
                    </div>
                    <p className={`text-xs leading-relaxed ${isWinner ? 'text-amber-100' : 'text-gray-400'}`}>
                      {analysis.critique}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action Area */}
      {images.length > 0 && (
        <div className="flex flex-col items-center justify-center pt-4">
          {!result && (
            <Button 
                onClick={handleCompare} 
                disabled={images.length < 2 || isAnalyzing}
                isLoading={isAnalyzing}
                className="px-8 py-3 text-lg"
                icon={<Search size={20} />}
            >
                {isAnalyzing ? 'Analyzing Quality...' : 'Compare Images'}
            </Button>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
            </div>
          )}
          
          {result && (
             <div className="mt-8 p-6 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl border border-gray-700 max-w-3xl w-full text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                <h3 className="text-amber-400 font-bold uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                    <CheckCircle size={18} /> Verdict
                </h3>
                <p className="text-xl text-white font-medium">"{result.winnerReason}"</p>
                
                <button 
                  onClick={() => { setResult(null); setImages([]); }}
                  className="mt-6 text-sm text-gray-500 hover:text-white underline underline-offset-4"
                >
                  Start New Comparison
                </button>
             </div>
          )}
        </div>
      )}
    </div>
  );
};
