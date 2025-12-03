export interface SceneSegment {
  timestamp: string;
  timestampSeconds: number;
  description: string;
  prompt: string;
  screenshotUrl?: string;
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
  base64Data: string;
  mimeType: string;
}

export enum AppState {
  IDLE = 'IDLE',
  PREVIEW = 'PREVIEW',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
