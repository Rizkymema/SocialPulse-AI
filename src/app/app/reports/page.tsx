"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Download, 
  Plus, 
  Trash2, 
  Loader2, 
  Sparkles,
  FileSpreadsheet,
  FileDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useSaaSStore, ReportFile } from "@/store/useSaaSStore";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/exportEngine";

export default function ReportsPage() {
  const { 
    workspaces, 
    activeWorkspaceId, 
    posts, 
    reports, 
    addReport, 
    deleteReport, 
    incrementDownloads,
    addNotification 
  } = useSaaSStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [reportFormat, setReportFormat] = useState<"PDF" | "Excel" | "CSV">("PDF");
  const [selectedWsId, setSelectedWsId] = useState(activeWorkspaceId);
  const [reportTitle, setReportTitle] = useState("");

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const steps = [
    "Contacting social media API streams...",
    "Scanning content comments with AI Sentiment model...",
    "Calculating keyword weight matrix values...",
    "Structuring layouts and compiling final file...",
  ];

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim()) return;

    setIsGenerating(true);
    setGenerationStep(0);

    // Simulated progress steps
    const interval = setInterval(() => {
      setGenerationStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          
          const targetWs = workspaces.find(w => w.id === selectedWsId) || activeWorkspace;
          const wsPosts = posts.filter(p => p.workspace_id === selectedWsId);
          
          // AI simulated text summary
          const positiveCount = wsPosts.filter(p => p.sentiment === "positive").length;
          const negativeCount = wsPosts.filter(p => p.sentiment === "negative").length;
          const totalCount = wsPosts.length;
          const posRatio = totalCount ? Math.round((positiveCount / totalCount) * 100) : 0;
          const negRatio = totalCount ? Math.round((negativeCount / totalCount) * 100) : 0;
          
          let aiText = `Workspace ${targetWs.name} analyzed ${totalCount} comments. Positive feedback dominates at ${posRatio}%, indicating healthy brand awareness. `;
          if (negRatio > 25) {
            aiText += `Warning: Negative sentiment matches ${negRatio}%. Major issues identified in logistics, support responses, and service delivery delays. Immediate intervention recommended.`;
          } else {
            aiText += `Brand reputation remains highly stable. Engagement spikes represent strong viral traction across video-based channels (TikTok and Instagram).`;
          }

          addReport({
            name: reportTitle.trim(),
            type: reportFormat,
            summary: aiText,
            workspaceName: targetWs.name,
            status: "completed"
          });

          addNotification(`AI generated ${reportFormat} report: "${reportTitle.trim()}"`);
          setIsGenerating(false);
          setIsOpen(false);
          setReportTitle("");
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handleDownload = (report: ReportFile) => {
    const targetWs = workspaces.find(w => w.name === report.workspaceName) || activeWorkspace;
    const wsPosts = posts.filter(p => p.workspace_id === targetWs.id);

    if (wsPosts.length === 0) {
      alert("No data available to download for this workspace.");
      return;
    }

    const cleanTitle = report.name.toLowerCase().replace(/\s+/g, "_");

    if (report.type === "CSV") {
      exportToCSV(wsPosts, `${cleanTitle}.csv`);
    } else if (report.type === "Excel") {
      exportToExcel(wsPosts, report.workspaceName, `${cleanTitle}.xlsx`);
    } else if (report.type === "PDF") {
      exportToPDF(wsPosts, report.workspaceName, report.summary, `${cleanTitle}.pdf`);
    }

    incrementDownloads(report.id);
    addNotification(`Downloaded report file: ${report.name}`);
  };

  const getFormatIcon = (type: "PDF" | "Excel" | "CSV") => {
    switch (type) {
      case "PDF": return <FileText className="h-4 w-4 text-rose-500" />;
      case "Excel": return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />;
      case "CSV": return <FileDown className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            AI Reports Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Compile performance documentation, view history logs, and download print archives.
          </p>
        </div>
        <Button 
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 font-semibold"
        >
          <Plus className="h-4 w-4" /> Generate Report
        </Button>
      </div>

      {/* Reports Table List */}
      <Card className="bg-[#09090b]/80 border-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-900 bg-zinc-950/60 text-zinc-500 font-semibold text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Report Details</th>
                <th className="px-6 py-4">Workspace</th>
                <th className="px-6 py-4">Format</th>
                <th className="px-6 py-4">Date Compiled</th>
                <th className="px-6 py-4 text-right">Downloads</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-zinc-900/30 transition-colors text-zinc-300">
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="font-bold text-white leading-none">{report.name}</p>
                      <p className="text-[10px] text-zinc-500 line-clamp-1 max-w-sm">{report.summary}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 font-medium">{report.workspaceName}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-zinc-900 border border-zinc-800">
                      {getFormatIcon(report.type)}
                      <span>{report.type}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 text-xs">
                    {new Date(report.date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-zinc-200">
                    {report.downloads}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center items-center gap-2">
                      <button
                        onClick={() => handleDownload(report)}
                        className="p-1.5 rounded hover:bg-indigo-500/10 text-zinc-500 hover:text-indigo-400 transition-all"
                        title="Download File"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this report?")) {
                            deleteReport(report.id);
                            addNotification(`Deleted report log: ${report.name}`);
                          }
                        }}
                        className="p-1.5 rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-all"
                        title="Delete Report"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 text-xs font-medium">
                    No historical reports compiled yet. Click &quot;Generate Report&quot; to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Interactive Builder Modal */}
      <Dialog isOpen={isOpen} onClose={() => { if (!isGenerating) setIsOpen(false); }}>
        <DialogContent onClose={() => { if (!isGenerating) setIsOpen(false); }} className="max-w-md">
          <DialogHeader>
            <DialogTitle>AI Report Generator</DialogTitle>
            <DialogDescription>
              {!isGenerating 
                ? "Configure scopes to compile cognitive brand metrics."
                : "Aggregating indices... Standby for compile."}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {!isGenerating ? (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleGenerate}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Report Title</label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Acme Q3 Brand Performance"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400">Target Workspace</label>
                    <Select
                      value={selectedWsId}
                      onChange={(e) => setSelectedWsId(e.target.value)}
                    >
                      {workspaces.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400">File Format</label>
                    <Select
                      value={reportFormat}
                      onChange={(e) => setReportFormat(e.target.value as "PDF" | "Excel" | "CSV")}
                    >
                      <option value="PDF">PDF Executive</option>
                      <option value="Excel">Excel Multi-Sheet</option>
                      <option value="CSV">Raw CSV Log</option>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="border-zinc-850 hover:bg-zinc-900"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 gap-1.5 items-center font-semibold">
                    <Sparkles className="h-4 w-4" /> Run AI Builder
                  </Button>
                </DialogFooter>
              </motion.form>
            ) : (
              <motion.div
                key="loader"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 flex flex-col items-center justify-center space-y-6 text-center"
              >
                <div className="relative h-16 w-16 flex items-center justify-center bg-indigo-500/5 rounded-2xl border border-indigo-500/20">
                  <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold text-white">AI Compiling Action</p>
                  
                  {/* Step indicators */}
                  <div className="text-xs text-indigo-300 font-semibold h-4">
                    {steps[generationStep]}
                  </div>
                </div>
                
                {/* Visual Step Dots */}
                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <span 
                      key={i} 
                      className={`h-2 w-2 rounded-full transition-all duration-300 ${
                        i <= generationStep ? "bg-indigo-500 scale-110" : "bg-zinc-800"
                      }`} 
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}
