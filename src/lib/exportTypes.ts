export type ExportPlatform = "instagram" | "facebook" | "tiktok" | "youtube";

export type ExportSentiment = "positive" | "neutral" | "negative";

export interface CommentSentimentSummary {
  positive: number;
  neutral: number;
  negative: number;
}

export interface ExportPost {
  id: string;
  platform: ExportPlatform;
  url: string;
  username: string;
  content: string;
  likes: number;
  comments: number;
  exportedComments: number;
  shares: number;
  views: number;
  timestamp: string;
  sentiment: ExportSentiment;
  commentSentiments: CommentSentimentSummary;
}

export interface ExportComment {
  id: string;
  postId: string;
  postPlatform: ExportPlatform;
  postUrl: string;
  postUsername: string;
  postTimestamp: string;
  author: string;
  content: string;
  likes: number;
  timestamp: string;
  parent: string;
  sentiment: ExportSentiment;
}

export interface ExportDataset {
  posts: ExportPost[];
  comments: ExportComment[];
}