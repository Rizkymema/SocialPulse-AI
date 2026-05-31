"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    // Simulate recovery email submission
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1200);
  };

  return (
    <div className="relative min-h-screen bg-[#030303] text-[#f4f4f5] flex items-center justify-center p-4 grid-bg">
      <div className="absolute top-[10%] left-[10%] w-[35%] h-[35%] glow-indigo pointer-events-none rounded-full" />
      <div className="absolute bottom-[10%] right-[10%] w-[35%] h-[35%] glow-violet pointer-events-none rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* App Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center space-x-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold">
              SocialPulse <span className="text-indigo-400">AI</span>
            </span>
          </Link>
          <p className="text-xs text-muted-foreground">Social Media Intelligence Platform</p>
        </div>

        <Card glass className="border-zinc-800 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>
              {!isSubmitted
                ? "Enter your email and we'll send you a password recovery link"
                : "Check your inbox for further instructions"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-white">Reset Link Sent Successfully</p>
                  <p className="text-xs text-zinc-400">
                    We have dispatched a recovery link to <span className="text-white font-medium">{email}</span>. 
                    Please check your spam folder if you do not receive it in 2 minutes.
                  </p>
                </div>
                <Link href="/auth/login" className="block w-full">
                  <Button variant="outline" className="w-full text-zinc-300 border-zinc-800 hover:bg-zinc-900/50">
                    Return to Login
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg p-3 mb-4 text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                      <Mail className="h-3 w-3" /> Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>

                  <Button type="submit" className="w-full mt-2 font-semibold bg-indigo-600 hover:bg-indigo-700" isLoading={isLoading}>
                    Send Reset Link
                  </Button>
                </form>

                <div className="mt-6 flex justify-center text-xs">
                  <Link href="/auth/login" className="text-muted-foreground hover:text-white flex items-center gap-1 transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
