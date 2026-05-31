"use client";

import React, { useSyncExternalStore } from "react";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from "recharts";
import { 
  TrendingUp, 
  BarChart4, 
  PieChart as PieIcon, 
  Tag
} from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { useSaaSStore } from "@/store/useSaaSStore";
import { useChartContainerReady } from "@/lib/useChartContainerReady";

const subscribe = () => () => {};

export default function AnalyticsPage() {
  const { activeWorkspaceId, posts, workspaces } = useSaaSStore();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const {
    ref: dailyChartRef,
    width: dailyChartWidth,
    height: dailyChartHeight,
    isReady: isDailyChartReady,
  } = useChartContainerReady<HTMLDivElement>();
  const {
    ref: sentimentChartRef,
    width: sentimentChartWidth,
    height: sentimentChartHeight,
    isReady: isSentimentChartReady,
  } = useChartContainerReady<HTMLDivElement>();
  const {
    ref: platformChartRef,
    width: platformChartWidth,
    height: platformChartHeight,
    isReady: isPlatformChartReady,
  } = useChartContainerReady<HTMLDivElement>();

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const wsPosts = posts.filter(p => p.workspace_id === activeWorkspaceId);

  // 1. Sentiment Data calculations
  const positiveCount = wsPosts.filter((p) => p.sentiment === "positive").length;
  const neutralCount = wsPosts.filter((p) => p.sentiment === "neutral").length;
  const negativeCount = wsPosts.filter((p) => p.sentiment === "negative").length;

  const sentimentData = [
    { name: "Positive", value: positiveCount, color: "#10b981" }, // Emerald
    { name: "Neutral", value: neutralCount, color: "#f59e0b" },  // Amber
    { name: "Negative", value: negativeCount, color: "#ef4444" }, // Rose
  ];

  // 2. Platform Comparison calculations
  const platforms = ["instagram", "tiktok", "facebook", "youtube"] as const;
  const platformData = platforms.map((plat) => {
    const platPosts = wsPosts.filter((p) => p.platform === plat);
    const count = platPosts.length;
    const totalEng = platPosts.reduce((sum, p) => sum + p.likes + p.comments + p.shares, 0);
    return {
      name: plat.toUpperCase(),
      "Post Count": count,
      "Total Engagement": totalEng,
    };
  });

  // 3. Daily Engagement Line Chart calculations
  const dailyData = wsPosts
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .reduce((acc, post) => {
      const date = new Date(post.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const eng = post.likes + post.comments + post.shares;
      const existing = acc.find((item) => item.date === date);
      if (existing) {
        existing.Engagement += eng;
        existing.Posts += 1;
      } else {
        acc.push({ date, Engagement: eng, Posts: 1 });
      }
      return acc;
    }, [] as { date: string; Engagement: number; Posts: number }[]);

  // 4. Custom Keyword Impact Array
  const rawKeywords = [
    { tag: "#AI", mentions: 12, impact: "positive", val: 82 },
    { tag: "Pricing", mentions: 8, impact: "negative", val: -30 },
    { tag: "Dashboard", mentions: 15, impact: "positive", val: 94 },
    { tag: "Support", mentions: 5, impact: "negative", val: -45 },
    { tag: "Aggregator", mentions: 18, impact: "positive", val: 78 },
    { tag: "UX Design", mentions: 14, impact: "positive", val: 88 },
    { tag: "Speed", mentions: 9, impact: "neutral", val: 12 },
    { tag: "Bug", mentions: 4, impact: "negative", val: -60 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Analytics & Performance
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Deep cognitive insights and chart summaries for {activeWorkspace?.name}.
        </p>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Daily Engagement Trend */}
        <Card className="min-w-0 bg-[#09090b]/80 border-zinc-900 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <CardTitle className="text-md flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-400" /> Engagement Trends
              </CardTitle>
              <CardDescription className="text-xs">Daily social engagement aggregate (likes, comments, shares)</CardDescription>
            </div>
          </div>
          <div ref={dailyChartRef} className="h-64 w-full min-w-0">
            {mounted && isDailyChartReady && dailyData.length > 0 ? (
              <LineChart
                width={dailyChartWidth}
                height={dailyChartHeight}
                data={dailyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                  <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#1f1f23', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#a1a1aa' }}
                  />
                  <Line type="monotone" dataKey="Engagement" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
            ) : mounted && isDailyChartReady ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-zinc-500">
                Not enough time-series records to chart.
              </div>
            ) : null}
          </div>
        </Card>

        {/* Chart 2: Sentiment breakdown */}
        <Card className="min-w-0 bg-[#09090b]/80 border-zinc-900 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <CardTitle className="text-md flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-indigo-400" /> Sentiment Distribution
              </CardTitle>
              <CardDescription className="text-xs">Distribution percentage of all scanned posts</CardDescription>
            </div>
          </div>
          <div className="h-64 w-full min-w-0 flex items-center justify-center">
            {mounted && wsPosts.length > 0 ? (
              <div className="w-full h-full min-w-0 flex flex-col sm:flex-row items-center justify-around">
                <div ref={sentimentChartRef} className="h-48 w-48 relative shrink-0">
                  {isSentimentChartReady ? (
                    <PieChart width={sentimentChartWidth} height={sentimentChartHeight}>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#1f1f23', borderRadius: '8px', fontSize: '12px' }}
                      />
                    </PieChart>
                  ) : null}
                </div>
                
                {/* Labels list */}
                <div className="space-y-2 mt-4 sm:mt-0 text-xs">
                  {sentimentData.map((item) => {
                    const total = wsPosts.length;
                    const pct = total ? Math.round((item.value / total) * 100) : 0;
                    return (
                      <div key={item.name} className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-semibold text-zinc-300 w-16">{item.name}</span>
                        <span className="text-zinc-500 w-10 text-right">{item.value}</span>
                        <span className="text-white font-bold">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-500">No database comments to analyze.</div>
            )}
          </div>
        </Card>

        {/* Chart 3: Platform Comparison */}
        <Card className="min-w-0 bg-[#09090b]/80 border-zinc-900 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <CardTitle className="text-md flex items-center gap-2">
                <BarChart4 className="h-4 w-4 text-indigo-400" /> Platform Metrics
              </CardTitle>
              <CardDescription className="text-xs">Total post frequency and engagement levels per channel</CardDescription>
            </div>
          </div>
          <div ref={platformChartRef} className="h-64 w-full min-w-0">
            {mounted && isPlatformChartReady && wsPosts.length > 0 ? (
              <BarChart
                width={platformChartWidth}
                height={platformChartHeight}
                data={platformData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                  <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#1f1f23', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', color: '#a1a1aa' }} />
                  <Bar dataKey="Post Count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Total Engagement" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
            ) : mounted && isPlatformChartReady ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-zinc-500">No channel data.</div>
            ) : null}
          </div>
        </Card>

        {/* Card 4: Top Keywords & Tag Cloud */}
        <Card className="min-w-0 bg-[#09090b]/80 border-zinc-900 p-6 flex flex-col justify-between">
          <div>
            <CardTitle className="text-md flex items-center gap-2">
              <Tag className="h-4 w-4 text-indigo-400" /> Cognitive Keywords & Impact
            </CardTitle>
            <CardDescription className="text-xs">Top discussed terms and their corresponding AI impact rating</CardDescription>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-6">
            {rawKeywords.map((kw) => {
              const textColors = {
                positive: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5",
                negative: "text-red-400 border-red-500/10 bg-red-500/5",
                neutral: "text-zinc-400 border-zinc-800 bg-zinc-900/40"
              };
              return (
                <div 
                  key={kw.tag} 
                  className={`flex flex-col p-3 rounded-lg border text-xs gap-1.5 transition-all hover:scale-[1.02] ${textColors[kw.impact as keyof typeof textColors]}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{kw.tag}</span>
                    <span className="text-[10px] text-zinc-500 font-semibold">{kw.mentions} hits</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-500">AI Impact Value</span>
                    <span className="font-semibold">{kw.val > 0 ? `+${kw.val}` : kw.val}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
