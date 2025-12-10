
export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  createdAt: number;
  enhanced?: boolean;
}

export interface GenerationState {
  isGenerating: boolean;
  progress: number; // 0 to 4 (number of images generated)
  error: string | null;
}

export interface ImageAnalysis {
  index: number;
  score: number; // 0-100
  critique: string;
}

export interface AnalysisResult {
  bestImageIndex: number;
  winnerReason: string;
  analyses: ImageAnalysis[];
}
