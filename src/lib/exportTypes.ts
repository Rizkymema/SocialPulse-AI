export type ExportPlatform = "instagram" | "facebook" | "tiktok" | "youtube";

export type ExportSentiment = "positive" | "neutral" | "negative";

export interface ExportPost {
  id: string;
  platform: ExportPlatform;
  username: string;
  content: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
  sentiment: ExportSentiment;
}