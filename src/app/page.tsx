"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  BarChart3, 
  Cpu, 
  Download, 
  Layers, 
  Check, 
  Globe, 
  Sparkles,
  Play,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSaaSStore } from "@/store/useSaaSStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function LandingPage() {
  const router = useRouter();
  const { analyzeLink } = useSaaSStore();
  const [isAnnual, setIsAnnual] = useState(false);
  const [inputLink, setInputLink] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(0);

  const analyzeSteps = [
    "Checking URL and resolving platform domains...",
    "Querying official mock API schema descriptors...",
    "Extracting public comment feeds & engagement lists...",
    "Running AI cognitive sentiment classification...",
    "Synchronizing workspace records and redirecting..."
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };

  const handleAnalyzeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputLink.trim()) return;

    setIsAnalyzing(true);
    setAnalyzeStep(0);

    const interval = setInterval(() => {
      setAnalyzeStep((prev) => {
        if (prev >= analyzeSteps.length - 1) {
          clearInterval(interval);
          setTimeout(() => {
            analyzeLink(inputLink.trim());
            setIsAnalyzing(false);
            router.push("/app/overview");
          }, 300);
          return 0;
        }
        return prev + 1;
      });
    }, 800);
  };

  const loadSample = (sample: string) => {
    setInputLink(sample);
  };

  return (
    <div className="relative min-h-screen bg-[#030303] text-[#f4f4f5] overflow-x-hidden grid-bg">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] glow-indigo pointer-events-none rounded-full" />
      <div className="absolute top-[20%] right-[-10%] w-[45%] h-[45%] glow-violet pointer-events-none rounded-full" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-black/60 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 shadow-md shadow-indigo-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
              SocialPulse <span className="text-indigo-400">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex space-x-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link href="/app/overview">
              <Button className="font-semibold bg-indigo-600 hover:bg-indigo-700 flex gap-1.5 items-center">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16 sm:px-6 lg:px-8 flex flex-col items-center text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/5 px-4 py-1.5 text-xs sm:text-sm font-medium text-indigo-300 backdrop-blur-md mb-8 hover-glow cursor-pointer"
        >
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span>Introducing AI Sentiment Analyzer 2.0</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl font-extrabold tracking-tight sm:text-6xl max-w-4xl bg-clip-text text-transparent bg-gradient-to-b from-white via-zinc-200 to-zinc-500 leading-tight"
        >
          Monitor & Analyze Social Media Data in Real-Time with <span className="text-indigo-500 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-500">AI</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl leading-relaxed"
        >
          Aggregate customer comments, run cognitive sentiment scans, and export multi-format intelligence reports from all key social media channels in one unified platform.
        </motion.p>

        {/* Link Input Analyzer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 w-full max-w-2xl bg-zinc-955 border border-zinc-800 p-4 rounded-2xl backdrop-blur-md shadow-xl"
        >
          <form onSubmit={handleAnalyzeSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              required
              placeholder="Paste social media post/video link (Instagram, TikTok, YouTube, Facebook)..."
              value={inputLink}
              onChange={(e) => setInputLink(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-600 placeholder:text-zinc-500 transition-all"
            />
            <Button 
              type="submit" 
              size="lg" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex gap-2 items-center"
            >
              Analyze with AI <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Sample Links Selector */}
          <div className="mt-4 text-left">
            <span className="text-xs text-zinc-500 font-semibold block mb-2">Try Click-to-Load Legal Sample Feeds:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => loadSample("https://www.instagram.com/p/C7xY8zOP5qr/")}
                className="text-[11px] font-semibold bg-zinc-900 hover:bg-zinc-855 border border-zinc-800 hover:border-zinc-700 rounded-lg py-1.5 px-3 flex gap-1.5 items-center text-zinc-300 transition-all cursor-pointer"
              >
                <span className="h-2 w-2 rounded-full bg-pink-500" /> Instagram Post
              </button>
              <button
                onClick={() => loadSample("https://www.tiktok.com/@ecolife/video/7391056345892")}
                className="text-[11px] font-semibold bg-zinc-900 hover:bg-zinc-855 border border-zinc-800 hover:border-zinc-700 rounded-lg py-1.5 px-3 flex gap-1.5 items-center text-zinc-300 transition-all cursor-pointer"
              >
                <span className="h-2 w-2 rounded-full bg-red-400" /> TikTok Video
              </button>
              <button
                onClick={() => loadSample("https://www.youtube.com/watch?v=dQw4w9WgXcQ")}
                className="text-[11px] font-semibold bg-zinc-900 hover:bg-zinc-855 border border-zinc-800 hover:border-zinc-700 rounded-lg py-1.5 px-3 flex gap-1.5 items-center text-zinc-300 transition-all cursor-pointer"
              >
                <span className="h-2 w-2 rounded-full bg-red-600" /> YouTube Review
              </button>
              <button
                onClick={() => loadSample("https://www.facebook.com/acme/posts/10294819582910")}
                className="text-[11px] font-semibold bg-zinc-900 hover:bg-zinc-855 border border-zinc-800 hover:border-zinc-700 rounded-lg py-1.5 px-3 flex gap-1.5 items-center text-zinc-300 transition-all cursor-pointer"
              >
                <span className="h-2 w-2 rounded-full bg-blue-500" /> Facebook Post
              </button>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Mockup Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 w-full max-w-5xl rounded-xl border border-white/10 bg-zinc-900/40 p-2 shadow-2xl backdrop-blur-md relative group"
        >
          <div className="absolute inset-0 bg-indigo-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="aspect-[16/9] w-full rounded-lg bg-zinc-950 overflow-hidden border border-white/5 relative flex flex-col items-center justify-center p-8">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-transparent to-transparent pointer-events-none" />
            
            {/* Simulated UI layout */}
            <div className="w-full h-full flex flex-col text-left text-xs opacity-80">
              {/* Fake topbar */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  <div className="h-4 w-24 bg-zinc-800 rounded ml-2" />
                </div>
                <div className="h-4 w-12 bg-zinc-800 rounded" />
              </div>
              
              {/* Fake grid */}
              <div className="grid grid-cols-3 gap-4 flex-1">
                <div className="col-span-2 border border-white/5 rounded-lg p-4 bg-zinc-900/30 flex flex-col justify-between">
                  <div>
                    <div className="h-3 w-1/3 bg-zinc-800 rounded mb-2" />
                    <div className="h-2 w-1/2 bg-zinc-800/50 rounded" />
                  </div>
                  {/* Faux Chart */}
                  <div className="h-32 w-full flex items-end gap-1.5 pt-4">
                    {[40, 20, 60, 45, 80, 55, 90, 70, 110, 85].map((val, idx) => (
                      <div 
                        key={idx} 
                        className="bg-indigo-600/70 hover:bg-indigo-500 w-full rounded-t transition-all" 
                        style={{ height: `${val}%` }} 
                      />
                    ))}
                  </div>
                </div>
                <div className="border border-white/5 rounded-lg p-4 bg-zinc-900/30 flex flex-col justify-between">
                  <div className="h-3 w-1/2 bg-zinc-800 rounded mb-4" />
                  {/* Faux Pie/Distribution */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="h-20 w-20 rounded-full border-8 border-indigo-600/40 border-t-indigo-500 border-l-emerald-500 flex items-center justify-center">
                      <span className="text-[10px] font-semibold text-zinc-400">76% Pos</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] opacity-100 group-hover:bg-black/20 transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer">
                <Play className="h-6 w-6 fill-white ml-1" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-24 sm:px-6 lg:px-8 relative z-10 border-t border-zinc-900">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">
            Engineered for Modern Social Analysis
          </h2>
          <p className="mt-4 text-zinc-400">
            SocialPulse AI is built with the toolkits required to source, sanitize, and visualize public reactions to your brand.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Feature 1 */}
          <motion.div variants={itemVariants}>
            <Card className="p-6 h-full bg-zinc-950/40 border-zinc-900 hover:border-zinc-800 hover-glow transition-all flex flex-col justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 mb-6">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Multi-platform Aggregation</h3>
                <p className="text-sm text-zinc-400">
                  Collect and unify social feeds and commentary from Instagram, TikTok, Facebook, and YouTube into one control center.
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Feature 2 */}
          <motion.div variants={itemVariants}>
            <Card className="p-6 h-full bg-zinc-950/40 border-zinc-900 hover:border-zinc-800 hover-glow transition-all flex flex-col justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 mb-6">
                <Cpu className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">AI Sentiment Analysis</h3>
                <p className="text-sm text-zinc-400">
                  Instantly categorise customer statements into Positive, Neutral, or Negative sentiments with an advanced parsing engine.
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Feature 3 */}
          <motion.div variants={itemVariants}>
            <Card className="p-6 h-full bg-zinc-950/40 border-zinc-900 hover:border-zinc-800 hover-glow transition-all flex flex-col justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 mb-6">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Export Pro Reports</h3>
                <p className="text-sm text-zinc-400">
                  Download raw CSV lists, multi-sheet Excel files, or beautifully designed PDF executive summaries containing AI insights.
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Feature 4 */}
          <motion.div variants={itemVariants}>
            <Card className="p-6 h-full bg-zinc-950/40 border-zinc-900 hover:border-zinc-800 hover-glow transition-all flex flex-col justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 mb-6">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Real-time Analytics</h3>
                <p className="text-sm text-zinc-400">
                  Track engagement metrics, keyword counts, and comparative platform statistics inside visual responsive charts.
                </p>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="container mx-auto px-4 py-24 sm:px-6 lg:px-8 relative z-10 border-t border-zinc-900 bg-zinc-950/20">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl font-bold sm:text-4xl bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">
            How It Works
          </h2>
          <p className="mt-4 text-zinc-400">
            Turn social signals into actionable growth intelligence in three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative max-w-5xl mx-auto">
          {/* Visual Link Line */}
          <div className="hidden md:block absolute top-10 left-1/6 right-1/6 h-[2px] bg-gradient-to-r from-indigo-500/50 via-violet-500/50 to-indigo-500/10 z-0" />
          
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="h-20 w-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-xl relative group-hover:border-indigo-500/40 transition-colors">
              <div className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow">1</div>
              <Globe className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">1. Connect Platform</h3>
            <p className="text-sm text-zinc-400 max-w-xs">
              Link your social handles (Instagram, Facebook, TikTok, YouTube) or specify target keywords to track.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="h-20 w-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-xl relative">
              <div className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow">2</div>
              <Cpu className="h-8 w-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">2. Analyze & Filter</h3>
            <p className="text-sm text-zinc-400 max-w-xs">
              Our AI maps customer sentiments and aggregates engagements. Filter data by date range or platforms instantly.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="h-20 w-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-xl relative">
              <div className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow">3</div>
              <Download className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">3. Export Insights</h3>
            <p className="text-sm text-zinc-400 max-w-xs">
              Save filtered data or generate styled reports, allowing team members and stakeholders to make data-backed decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-24 sm:px-6 lg:px-8 relative z-10 border-t border-zinc-900">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold sm:text-4xl bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">
            Simple, Scale-Ready Pricing
          </h2>
          <p className="mt-4 text-zinc-400">
            Select a plan that suits your monitoring scale. Switch or cancel at any time.
          </p>

          {/* Pricing Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full bg-zinc-950 p-1 border border-zinc-900">
            <button 
              onClick={() => setIsAnnual(false)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${!isAnnual ? "bg-zinc-800 text-white" : "text-zinc-400"}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setIsAnnual(true)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${isAnnual ? "bg-zinc-800 text-white" : "text-zinc-400"}`}
            >
              Annual (Save 20%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
          {/* Plan 1: Free */}
          <Card className="p-8 bg-zinc-950/40 border-zinc-900 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Free Plan</h3>
              <p className="text-xs text-zinc-400 mb-6">Perfect for sandbox testing and personal brand exploration.</p>
              
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-extrabold text-white">$0</span>
                <span className="text-zinc-500 text-sm ml-2">/ month</span>
              </div>

              <ul className="space-y-4 border-t border-zinc-900 pt-6 text-sm text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>1 Workspace</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Up to 100 posts/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Basic CSV Export</span>
                </li>
                <li className="flex items-center gap-2 text-zinc-500 line-through">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>AI Sentiment Classifier</span>
                </li>
              </ul>
            </div>

            <Link href="/app/overview" className="mt-8">
              <Button variant="outline" className="w-full text-zinc-300 border-zinc-800 hover:border-zinc-700">
                Use Free Dashboard
              </Button>
            </Link>
          </Card>

          {/* Plan 2: Pro (Recommended) */}
          <Card className="p-8 bg-zinc-950 border-indigo-500/50 hover-glow transition-all relative flex flex-col justify-between">
            <div className="absolute top-0 right-8 -translate-y-1/2 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
              Most Popular
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Pro Plan</h3>
              <p className="text-xs text-zinc-400 mb-6">For professional agencies and scaling product teams.</p>
              
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-extrabold text-white">
                  ${isAnnual ? "39" : "49"}
                </span>
                <span className="text-zinc-500 text-sm ml-2">/ month</span>
              </div>

              <ul className="space-y-4 border-t border-zinc-900 pt-6 text-sm text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span className="font-semibold text-white">5 Workspaces</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Up to 10,000 posts/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Full Excel & PDF Export</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span className="text-white">AI Sentiment Analyzer (2.0)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>3 Team Members Seat</span>
                </li>
              </ul>
            </div>

            <Link href="/app/overview" className="mt-8">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/10">
                Access Pro Platform
              </Button>
            </Link>
          </Card>

          {/* Plan 3: Enterprise */}
          <Card className="p-8 bg-zinc-950/40 border-zinc-900 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Enterprise</h3>
              <p className="text-xs text-zinc-400 mb-6">Custom scopes for multinational companies and large agencies.</p>
              
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-extrabold text-white">
                  ${isAnnual ? "159" : "199"}
                </span>
                <span className="text-zinc-500 text-sm ml-2">/ month</span>
              </div>

              <ul className="space-y-4 border-t border-zinc-900 pt-6 text-sm text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span className="font-semibold text-white">Unlimited Workspaces</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Unlimited Posts Aggregation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Custom API Access UI</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Dedicated Account Manager</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Custom PDF White-labeling</span>
                </li>
              </ul>
            </div>

            <Link href="/app/overview" className="mt-8">
              <Button variant="outline" className="w-full text-zinc-300 border-zinc-800 hover:border-zinc-700">
                Try Enterprise Mode
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="max-w-4xl mx-auto rounded-3xl border border-white/5 bg-gradient-to-b from-zinc-950 to-zinc-900 p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-indigo-600/10 blur-[80px] pointer-events-none rounded-full" />
          
          <h2 className="text-3xl font-bold sm:text-4xl text-white mb-4">
            Unleash the Power of Social Intelligence Today
          </h2>
          <p className="text-zinc-400 max-w-lg mx-auto mb-8">
            Connect your channels, scan discussions in minutes, and extract strategic reports effortlessly.
          </p>
          
          <Link href="/app/overview">
            <Button size="lg" className="bg-white text-black hover:bg-zinc-200 font-semibold px-8 py-3 flex gap-1.5 items-center justify-center mx-auto">
              Launch Platform Now <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black/40 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-zinc-500">
          <div className="flex items-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-white font-bold text-xs">S</div>
            <span className="font-semibold text-zinc-400">SocialPulse AI</span>
          </div>
          <p>© 2026 SocialPulse AI Inc. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-zinc-300">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-300">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* Link Analyzing Loader Dialog */}
      <Dialog isOpen={isAnalyzing} onClose={() => {}}>
        <DialogContent onClose={() => {}} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" /> AI Link Analyzer
            </DialogTitle>
            <DialogDescription>
              Processing direct URL and extracting public performance metrics.
            </DialogDescription>
          </DialogHeader>

          <div className="py-8 flex flex-col items-center justify-center space-y-6 text-center">
            <div className="relative h-16 w-16 flex items-center justify-center bg-indigo-500/5 rounded-2xl border border-indigo-500/20 active-pulse">
              <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
            </div>
            
            <div className="space-y-2 w-full px-4">
              <p className="text-sm font-bold text-white">Legal Sourcing In-Progress</p>
              <div className="text-xs text-indigo-300 font-semibold h-5">
                {analyzeSteps[analyzeStep]}
              </div>
            </div>

            <div className="flex gap-1.5">
              {analyzeSteps.map((_, i) => (
                <span 
                  key={i} 
                  className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                    i <= analyzeStep ? "bg-indigo-500 scale-105" : "bg-zinc-800"
                  }`} 
                />
              ))}
            </div>

            <div className="flex gap-2 items-start border border-yellow-500/10 bg-yellow-500/5 rounded-xl p-3 text-left">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-400/80 leading-normal">
                <strong>Legal & API Compliant:</strong> This process fetches publicly accessible metadata and maps comments structure based on official developer API specifications. No user credentials or scraping bypass mechanisms are used.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
