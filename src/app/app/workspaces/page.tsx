"use client";

import React, { useState } from "react";
import { 
  FolderLock, 
  Calendar, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Check 
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSaaSStore } from "@/store/useSaaSStore";

export default function WorkspacesPage() {
  const { 
    workspaces, 
    activeWorkspaceId, 
    switchWorkspace, 
    createWorkspace, 
    deleteWorkspace, 
    posts, 
    addNotification 
  } = useSaaSStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    
    createWorkspace(workspaceName.trim());
    addNotification(`Workspace "${workspaceName.trim()}" created successfully.`);
    setWorkspaceName("");
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (workspaces.length <= 1) {
      alert("You must keep at least one active workspace.");
      return;
    }
    if (confirm(`Are you sure you want to delete workspace "${name}"? This action is irreversible.`)) {
      deleteWorkspace(id);
      addNotification(`Workspace "${name}" has been deleted.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Workspaces <span className="text-zinc-500 font-normal">/</span> Tenants
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage data segregation, channels, and member permissions across individual brand workspaces.
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 font-semibold"
        >
          <Plus className="h-4 w-4" /> New Workspace
        </Button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workspaces.map((ws, index) => {
          const isActive = ws.id === activeWorkspaceId;
          const wsPosts = posts.filter(p => p.workspace_id === ws.id);
          const postCount = wsPosts.length;
          
          // Get sentiment ratios
          const posCount = wsPosts.filter(p => p.sentiment === "positive").length;
          const posRatio = postCount ? Math.round((posCount / postCount) * 100) : 0;

          return (
            <motion.div
              key={ws.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => {
                switchWorkspace(ws.id);
                addNotification(`Switched active workspace to: ${ws.name}`);
              }}
              className="cursor-pointer"
            >
              <Card 
                className={`h-full bg-zinc-950/40 hover-glow transition-all flex flex-col justify-between ${
                  isActive ? "border-indigo-500 bg-[#09090b]/90 ring-1 ring-indigo-500/20" : "border-zinc-900"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-indigo-400">
                      <FolderLock className="h-5 w-5" />
                    </div>
                    {isActive ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                        <Check className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <button
                        onClick={(e) => handleDelete(ws.id, ws.name, e)}
                        className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
                        title="Delete Workspace"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <CardTitle className="text-base mt-4 font-bold text-white truncate">
                    {ws.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    ID: {ws.id}
                  </CardDescription>
                </CardHeader>

                <CardContent className="py-2 space-y-3">
                  <div className="flex justify-between text-xs border-b border-zinc-900/60 pb-2">
                    <span className="text-zinc-500 font-medium">Aggregated Posts</span>
                    <span className="text-zinc-200 font-semibold">{postCount} items</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-zinc-900/60 pb-2">
                    <span className="text-zinc-500 font-medium">Pos Sentiment Ratio</span>
                    <span className="text-emerald-400 font-semibold">{posRatio}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Created on
                    </span>
                    <span>{new Date(ws.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 pb-4">
                  <Button 
                    variant={isActive ? "primary" : "outline"} 
                    className="w-full text-xs gap-1.5 font-semibold"
                    disabled={isActive}
                  >
                    {isActive ? "Currently Monitoring" : "Switch to Workspace"}
                    {!isActive && <ExternalLink className="h-3.5 w-3.5" />}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Creation Modal */}
      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <DialogContent onClose={() => setIsModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>
              Setup a new brand or agency workspace to track isolated datasets.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">Workspace Name</label>
              <Input
                type="text"
                required
                placeholder="e.g. Nike Global, Brand B"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-zinc-850 hover:bg-zinc-900"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Create Workspace
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
