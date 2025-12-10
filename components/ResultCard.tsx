
import React from 'react';
import { Download, Sparkles } from 'lucide-react';
import { GeneratedImage } from '../types';

interface ResultCardProps {
  image: GeneratedImage;
}

export const ResultCard: React.FC<ResultCardProps> = ({ image }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `visionary-ai-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Determine container aspect ratio class based on image data
  const aspectRatioClass = {
    '1:1': 'aspect-square',
    '9:16': 'aspect-[9/16]',
    '16:9': 'aspect-[16/9]',
    '3:4': 'aspect-[3/4]',
    '4:3': 'aspect-[4/3]',
  }[image.aspectRatio] || 'aspect-square';

  return (
    <div className={`group relative rounded-xl overflow-hidden bg-gray-900 border shadow-xl transition-all duration-300 hover:shadow-indigo-500/20 ${image.enhanced ? 'border-amber-500/30' : 'border-gray-800'}`}>
      <div className={`${aspectRatioClass} w-full overflow-hidden bg-gray-800 relative`}>
        <img 
          src={image.url} 
          alt={image.prompt} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex gap-2 mb-2">
                {image.enhanced ? (
                   <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-500 text-black px-2 py-0.5 rounded flex items-center gap-1">
                     <Sparkles size={10} fill="black" /> ENHANCED
                   </span>
                ) : (
                   <span className="text-[10px] uppercase tracking-wider font-bold bg-indigo-600 text-white px-2 py-0.5 rounded">HQ</span>
                )}
                <span className="text-[10px] uppercase tracking-wider font-bold bg-gray-700 text-white px-2 py-0.5 rounded border border-gray-600">{image.aspectRatio}</span>
            </div>
            <p className="text-xs text-gray-300 line-clamp-2 mb-4">{image.prompt}</p>
            <div className="flex gap-2">
              <button 
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download size={16} />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};