import type { CommentSentimentSummary, ExportSentiment } from "./exportTypes";

const POSITIVE_TERMS = [
  "bagus",
  "mantap",
  "keren",
  "hebat",
  "suka",
  "senang",
  "puas",
  "luar biasa",
  "terbaik",
  "amazing",
  "awesome",
  "best",
  "cool",
  "excellent",
  "good",
  "great",
  "impressive",
  "love",
  "nice",
  "recommended",
];

const NEGATIVE_TERMS = [
  "bad",
  "benci",
  "bohong",
  "boring",
  "buruk",
  "disappointing",
  "fake",
  "gagal",
  "hate",
  "hoax",
  "jelek",
  "kecewa",
  "menipu",
  "not good",
  "not worth",
  "parah",
  "penipuan",
  "scam",
  "terrible",
  "tidak suka",
  "waste",
  "worst",
];

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const scoreTerms = (text: string, terms: string[]) =>
  terms.reduce((score, term) => {
    const pattern = new RegExp(`(^|\\s)${term.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}(\\s|$)`, "i");
    return score + (pattern.test(text) ? 1 : 0);
  }, 0);

export const createEmptySentimentSummary = (): CommentSentimentSummary => ({
  positive: 0,
  neutral: 0,
  negative: 0,
});

export const detectSentiment = (text: string): ExportSentiment => {
  const normalized = normalizeText(text);
  if (!normalized) {
    return "neutral";
  }

  const positiveScore = scoreTerms(normalized, POSITIVE_TERMS);
  const negativeScore = scoreTerms(normalized, NEGATIVE_TERMS);

  if (positiveScore === negativeScore) {
    return "neutral";
  }

  return positiveScore > negativeScore ? "positive" : "negative";
};

export const summarizeSentiments = (
  sentiments: ExportSentiment[]
): CommentSentimentSummary =>
  sentiments.reduce((summary, sentiment) => {
    summary[sentiment] += 1;
    return summary;
  }, createEmptySentimentSummary());

export const detectPostSentiment = (
  commentTexts: string[],
  fallbackText: string
): ExportSentiment => {
  if (commentTexts.length === 0) {
    return detectSentiment(fallbackText);
  }

  const summary = summarizeSentiments(commentTexts.map(detectSentiment));
  if (summary.positive > summary.negative && summary.positive >= summary.neutral) {
    return "positive";
  }
  if (summary.negative > summary.positive && summary.negative >= summary.neutral) {
    return "negative";
  }
  return "neutral";
};

export const getSentimentLabel = (sentiment: ExportSentiment) => {
  if (sentiment === "positive") return "Positif";
  if (sentiment === "negative") return "Negatif";
  return "Netral";
};
