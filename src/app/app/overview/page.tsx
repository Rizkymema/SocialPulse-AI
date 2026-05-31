"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  MessageSquareCode, 
  Files, 
  ArrowRight,
  TrendingDown, 
  FolderPlus,
  FileDown,
  Sparkles,
  Zap
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip 
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSaaSStore } from "@/store/useSaaSStore";
import { exportToCSV } from "@/lib/exportEngine";
import { getAnalyticsSummary, getPosts, type ScrapedPost } from "@/lib/apiClient";
import type { Post } from "@/lib/mockData";
import { useChartContainerReady } from "@/lib/useChartContainerReady";

const subscribe = () => () => {};

const isLocalPost = (post: ScrapedPost | Post): post is Post => "timestamp" in post;

const getPostTimestamp = (post: ScrapedPost | Post) => {
  return isLocalPost(post) ? post.timestamp : (post.posted_at ?? post.created_at);
};

export default function OverviewPage() {
  const { 
    workspaces, 
    activeWorkspaceId, 
    posts, 
    reports, 
    addNotification 
  } = useSaaSStore();
  const [apiSummary, setApiSummary] = useState<Awaited<ReturnType<typeof getAnalyticsSummary>> | null>(null);
  const [apiPosts, setApiPosts] = useState<ScrapedPost[]>([]);
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const {
    ref: overviewChartRef,
    width: overviewChartWidth,
    height: overviewChartHeight,
    isReady: isOverviewChartReady,
  } = useChartContainerReady<HTMLDivElement>();

  useEffect(() => {
    // Load real data from backend
    getAnalyticsSummary().then(setApiSummary).catch(() => {});
    getPosts({ size: 50 }).then((r) => setApiPosts(r.items)).catch(() => {});
  }, []);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const workspacePosts = posts.filter(p => p.workspace_id === activeWorkspaceId);
  const isGlobalWorkspace = activeWorkspace?.id === "ws-global";
  const canUseBackendSummary = isGlobalWorkspace && (apiSummary?.total_posts ?? 0) > 0;
  const canUseBackendPosts = isGlobalWorkspace && apiPosts.length > 0;
  const backendSummary = canUseBackendSummary ? apiSummary : null;
  
  // Use API data when available, fallback to local store
  const totalPosts = backendSummary ? backendSummary.total_posts : workspacePosts.length;
  const totalLikes = backendSummary
    ? Object.values(backendSummary.platforms).reduce((s, p) => s + p.likes, 0)
    : workspacePosts.reduce((s, p) => s + p.likes, 0);
  const totalComments = backendSummary
    ? Object.values(backendSummary.platforms).reduce((s, p) => s + p.comments, 0)
    : workspacePosts.reduce((s, p) => s + p.comments, 0);
  const totalShares = backendSummary
    ? Object.values(backendSummary.platforms).reduce((s, p) => s + p.shares, 0)
    : workspacePosts.reduce((s, p) => s + p.shares, 0);
  const totalEngagement = totalLikes + totalComments + totalShares;

  // Chart: use API posts for time-series
  const chartPosts: Array<ScrapedPost | Post> = canUseBackendPosts ? apiPosts : workspacePosts;
  const chartData = chartPosts
    .sort((a, b) => new Date(getPostTimestamp(a) ?? 0).getTime() - new Date(getPostTimestamp(b) ?? 0).getTime())
    .map(p => {
      const ts = getPostTimestamp(p) ?? "";
      return {
        date: ts ? new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "?",
        engagement: p.likes + p.comments + ("shares" in p ? p.shares : 0),
      };
    });

  const posSentiment = workspacePosts.filter(p => p.sentiment === "positive").length;
  const posPct = workspacePosts.length ? Math.round((posSentiment / workspacePosts.length) * 100) : 0;

  const recentPosts = canUseBackendPosts ? apiPosts.slice(0, 3) : workspacePosts.slice(-3).reverse();

  const handleRefresh = () => {
    getAnalyticsSummary().then(setApiSummary).catch(() => {});
    getPosts({ size: 50 }).then((r) => setApiPosts(r.items)).catch(() => {});
    addNotification("Refreshed analytics from backend.");
  };

  const handleExportCSV = () => {
    if (workspacePosts.length === 0) { alert("No data to export."); return; }
    exportToCSV(workspacePosts, `${activeWorkspace.name.toLowerCase().replace(/\s+/g, '_')}_overview.csv`);
    addNotification(`Exported CSV for workspace ${activeWorkspace.name}`);
  };

  // Chart data formatting: Group engagement by date
  const chartDataFormatted = chartData;


  return (
    <div className="space-y-6">
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Workspace Hub <span className="text-zinc-500 font-normal">/</span> {activeWorkspace?.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor real-time social metrics and extract actionable marketing sentiment.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-zinc-800 hover:bg-zinc-900"
            onClick={handleExportCSV}
          >
            <FileDown className="h-4 w-4" /> Export CSV
          </Button>
          <Button 
            size="sm" 
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={handleRefresh}
          >
            <Zap className="h-4 w-4" /> Refresh Data
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Collected Posts */}
        <Card className="bg-zinc-950/40 border-zinc-900 hover-glow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Collected Posts</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 active-pulse" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{totalPosts}</span>
              <span className="text-[10px] text-emerald-400 flex items-center font-medium">
                <TrendingUp className="h-3 w-3 mr-0.5" /> +12%
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-2">Active database records</p>
          </CardContent>
        </Card>

        {/* KPI 2: Total Engagement */}
        <Card className="bg-zinc-950/40 border-zinc-900 hover-glow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Engagement Score</span>
              <TrendingUp className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{totalEngagement.toLocaleString()}</span>
              <span className="text-[10px] text-emerald-400 flex items-center font-medium">
                <TrendingUp className="h-3 w-3 mr-0.5" /> +18.4%
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-2">Likes, Comments & Shares</p>
          </CardContent>
        </Card>

        {/* KPI 3: Sentiment Index */}
        <Card className="bg-zinc-950/40 border-zinc-900 hover-glow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Sentiment Index</span>
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-400">{posPct}%</span>
              <span className="text-[10px] text-red-400 flex items-center font-medium">
                <TrendingDown className="h-3 w-3 mr-0.5" /> -1.2%
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-2">Positive customer reviews</p>
          </CardContent>
        </Card>

        {/* KPI 4: Reports Count */}
        <Card className="bg-zinc-950/40 border-zinc-900 hover-glow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Generated Reports</span>
              <Files className="h-4 w-4 text-violet-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {reports.filter(r => r.workspaceName === activeWorkspace.name).length}
              </span>
              <span className="text-[10px] text-zinc-500 font-medium">Active logs</span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-2">PDF, Excel, & CSV backups</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Chart + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Area Chart */}
        <Card className="lg:col-span-2 min-w-0 bg-[#09090b]/80 border-zinc-900 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <CardTitle className="text-md">Workspace Engagement Trend</CardTitle>
              <CardDescription className="text-xs">Visualizing cumulative likes and comments over time</CardDescription>
            </div>
            <div className="text-xs font-semibold text-zinc-400 bg-zinc-900/50 border border-zinc-800 px-2 py-1 rounded">
              30 Days
            </div>
          </div>
          
          {/* Recharts Area Container */}
          <div ref={overviewChartRef} className="h-64 w-full min-w-0 mt-4">
            {mounted && isOverviewChartReady && chartDataFormatted.length > 0 ? (
              <AreaChart
                width={overviewChartWidth}
                height={overviewChartHeight}
                data={chartDataFormatted}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                  <defs>
                    <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    stroke="#52525b" 
                    fontSize={10}
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#52525b" 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#1f1f23', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#a1a1aa' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="engagement" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorEngagement)" 
                  />
                </AreaChart>
            ) : mounted && isOverviewChartReady ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-zinc-500">
                No engagement logs recorded. Click &quot;Fetch Live Data&quot; to seed.
              </div>
            ) : null}
          </div>
        </Card>

        {/* Right Col: Feed & Actions */}
        <div className="space-y-6">
          {/* Activity Feed */}
          <Card className="bg-[#09090b]/80 border-zinc-900 flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-md">Recent Activity</CardTitle>
              <CardDescription className="text-xs">Live channel listener logs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[160px] overflow-y-auto pr-1">
                {recentPosts.map((p) => {
                  const platform = ("platform" in p ? p.platform : "unknown") as string;
                  const username = ("username" in p ? p.username : (p as {username?: string}).username) ?? "unknown";
                  const content = ("content" in p ? p.content : "") ?? "";
                  const ts = ("posted_at" in p ? p.posted_at : (p as {timestamp: string}).timestamp) ?? "";
                  const pColors: Record<string, string> = {
                    instagram: "text-pink-500",
                    tiktok: "text-red-400",
                    facebook: "text-blue-500",
                    youtube: "text-red-600"
                  };
                  return (
                    <div key={p.id} className="text-xs flex items-start gap-2.5 border-b border-zinc-900/60 pb-3 last:border-0 last:pb-0">
                      <span className={`font-semibold shrink-0 uppercase tracking-wider text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 ${pColors[platform] ?? "text-zinc-400"}`}>
                        {platform}
                      </span>
                      <div className="space-y-0.5">
                        <p className="text-zinc-300 leading-snug font-medium line-clamp-1">
                          @{username}: &quot;{content}&quot;
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {ts ? new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {recentPosts.length === 0 && (
                  <div className="text-center py-6 text-xs text-zinc-500">No recent channel events.</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
          <Card className="bg-[#09090b]/80 border-zinc-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-md">Quick Toolkit</CardTitle>
              <CardDescription className="text-xs">One-click operational shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/app/reports" className="block w-full">
                <Button variant="secondary" className="w-full text-xs justify-between hover:bg-zinc-850">
                  <span className="flex items-center gap-2">
                    <MessageSquareCode className="h-4 w-4 text-indigo-400" /> Compile AI Report
                  </span>
                  <ArrowRight className="h-3 w-3 text-zinc-500" />
                </Button>
              </Link>

              <Link href="/app/workspaces" className="block w-full">
                <Button variant="secondary" className="w-full text-xs justify-between hover:bg-zinc-850">
                  <span className="flex items-center gap-2">
                    <FolderPlus className="h-4 w-4 text-indigo-400" /> Add Workspaces
                  </span>
                  <ArrowRight className="h-3 w-3 text-zinc-500" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
