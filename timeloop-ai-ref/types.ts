
export interface SceneSegment {
  timestamp: string; // e.g. "00:05"
  timestampSeconds: number;
  description: string;
  prompt: string;
  screenshotUrl?: string; // Populated client-side
}

export interface AnalysisResult {
  prompt: string;
  details: {
    subject: string;
    action: string;
    camera: string;
    lighting: string;
    style: string;
  };
  segments: SceneSegment[];
}

export interface VideoData {
  file: File;
  previewUrl: string;
  base64Data: string; // Raw base64 without prefix
  mimeType: string;
}

export enum AppState {
  IDLE = 'IDLE',
  PREVIEW = 'PREVIEW',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}