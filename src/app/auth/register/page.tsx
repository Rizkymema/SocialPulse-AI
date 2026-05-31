"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSaaSStore } from "@/store/useSaaSStore";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useSaaSStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (!acceptTerms) {
      setError("You must accept the Terms and Conditions");
      return;
    }

    setIsLoading(true);

    // Simulate API registration request
    setTimeout(() => {
      register(name, email);
      setIsLoading(false);
      router.push("/");
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
          <p className="text-xs text-muted-foreground">Buat akun untuk memakai scraper media sosial</p>
        </div>

        <Card glass className="border-zinc-800 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Buat Akun</CardTitle>
            <CardDescription>Masuk ke alur scraping langsung dari beranda</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg p-3 mb-4 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                  <User className="h-3 w-3" /> Full Name
                </label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>

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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                  <Lock className="h-3 w-3" /> Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  disabled={isLoading}
                  className="mt-1 h-3.5 w-3.5 rounded border-zinc-800 bg-zinc-950 text-indigo-600 focus:ring-indigo-600"
                />
                <label htmlFor="terms" className="text-xs text-zinc-400 leading-normal select-none">
                  I agree to the{" "}
                  <a href="#" className="text-indigo-400 hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-indigo-400 hover:underline">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <Button type="submit" className="w-full mt-2 font-semibold bg-indigo-600 hover:bg-indigo-700" isLoading={isLoading}>
                Start Free Trial
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-indigo-400 hover:underline">
                Sign In Instead
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
