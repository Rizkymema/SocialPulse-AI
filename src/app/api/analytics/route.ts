import { NextResponse } from "next/server";
import { initialPosts } from "@/lib/mockData";

export async function GET() {
  const total = initialPosts.length;
  const positive = initialPosts.filter((p) => p.sentiment === "positive").length;
  const neutral = initialPosts.filter((p) => p.sentiment === "neutral").length;
  const negative = initialPosts.filter((p) => p.sentiment === "negative").length;

  const platformCount = initialPosts.reduce((acc, p) => {
    acc[p.platform] = (acc[p.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return NextResponse.json({
    success: true,
    data: {
      total_posts: total,
      sentiment_breakdown: {
        positive,
        neutral,
        negative,
        ratios: {
          positive: total ? Math.round((positive / total) * 100) : 0,
          neutral: total ? Math.round((neutral / total) * 100) : 0,
          negative: total ? Math.round((negative / total) * 100) : 0,
        },
      },
      platform_distribution: platformCount,
      trending_keywords: [
        { word: "AI", impact: "high" },
        { word: "Dashboard", impact: "high" },
        { word: "Support", impact: "medium" },
        { word: "Pricing", impact: "medium" },
      ],
    },
  });
}
