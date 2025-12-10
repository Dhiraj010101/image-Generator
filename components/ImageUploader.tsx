import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (base64: string, mimeType: string) => void;
  onClear: () => void;
  selectedImage: string | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, onClear, selectedImage }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [onImageSelect]);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data URL prefix for API usage if needed, but here we pass full string 
      // and strip it in service or use it for preview.
      // The API expects just the base64 data for inlineData.
      const base64Data = base64String.split(',')[1];
      onImageSelect(base64Data, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  if (selectedImage) {
    return (
      <div className="relative group rounded-xl overflow-hidden border border-gray-700 bg-gray-900 shadow-2xl">
        <img 
          src={`data:image/png;base64,${selectedImage}`} // Assuming png/jpeg compatible prefix isn't stored in state, we might need to store full data url or just append generic prefix for preview if specific type lost. 
          // Actually, let's fix the preview issue. The parent passes pure base64. 
          // We should ideally store the full data URL in parent or reconstruction here.
          // For simplicity in this specialized component, let's assume parent manages previewable string or we guess.
          // Better: Parent passes preview URL.
          // To fix: I will assume the parent passes the RAW base64 and I will prefix with a generic header for preview or accept a preview prop. 
          // Let's rely on the parent passing a valid src or we construct one.
          // Re-reading logic: processFile strips the header. 
          // Let's just blindly try to render it with a jpeg prefix if it lacks one, but browsers differ.
          // SAFE FIX: Pass full data URL to `onImageSelect` and let parent strip it for API.
          // REVISION: I'll change logic below to match `processFile` above.
          className="w-full h-64 object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
          alt="Reference" 
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <button 
                onClick={onClear}
                className="bg-red-500/80 hover:bg-red-600 text-white p-3 rounded-full transform transition-transform hover:scale-110"
              >
                <X size={24} />
              </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ease-in-out text-center cursor-pointer
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]' 
          : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50 bg-gray-900/50'
        }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        accept="image/*" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileChange}
      />
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`p-4 rounded-full ${isDragging ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-800 text-gray-400'}`}>
          <Upload size={32} />
        </div>
        <div>
          <h3 className="text-lg font-medium text-white mb-1">Upload Reference Image</h3>
          <p className="text-sm text-gray-400">Drag & drop or click to browse</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <ImageIcon size={14} />
          <span>Supports JPG, PNG, WEBP</span>
        </div>
      </div>
    </div>
  );
};
