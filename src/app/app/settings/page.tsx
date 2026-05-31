"use client";

import React, { useState } from "react";
import { 
  User as UserIcon, 
  CreditCard, 
  Key, 
  Sliders, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Save 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSaaSStore } from "@/store/useSaaSStore";

export default function SettingsPage() {
  const { 
    user, 
    apiKeys, 
    theme, 
    updateProfile, 
    upgradePlan, 
    updateApiKeys, 
    toggleTheme, 
    addNotification 
  } = useSaaSStore();

  const [activeTab, setActiveTab] = useState("account");

  // Profile Form States
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState<"admin" | "member" | "viewer">(user?.role ?? "admin");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // API Key States
  const [devKey, setDevKey] = useState(apiKeys.devKey);
  const [prodKey, setProdKey] = useState(apiKeys.prodKey);
  const [showDevKey, setShowDevKey] = useState(false);
  const [showProdKey, setShowProdKey] = useState(false);

  // Billing States
  const [cardNumber, setCardNumber] = useState("•••• •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCVC, setCardCVC] = useState("•••");
  const [isUpdatingCard, setIsUpdatingCard] = useState(false);

  // Handlers
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setTimeout(() => {
      updateProfile(name, email, role);
      setIsSavingProfile(false);
      addNotification("Account profile updated successfully.");
    }, 800);
  };

  const handleRegenApiKeys = (type: "dev" | "prod") => {
    const randomHex = () => Math.random().toString(36).substring(2, 10);
    const newKey = `sp_${type}_${randomHex()}${randomHex()}${randomHex()}`;
    
    if (type === "dev") {
      setDevKey(newKey);
      updateApiKeys(newKey, prodKey);
    } else {
      setProdKey(newKey);
      updateApiKeys(devKey, newKey);
    }
    
    addNotification(`Regenerated ${type === "dev" ? "Development" : "Production"} API Key.`);
  };

  const handleUpdateCard = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingCard(true);
    setTimeout(() => {
      setIsUpdatingCard(false);
      addNotification("Payment card details updated successfully.");
      alert("Billing details synchronized with Stripe.");
    }, 1000);
  };

  const handlePlanChange = (tier: "Free" | "Pro" | "Enterprise") => {
    if (user?.plan === tier) return;
    if (confirm(`Do you want to switch your plan from ${user?.plan} to ${tier}?`)) {
      upgradePlan(tier);
      addNotification(`Upgraded plan tier to: ${tier}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Workspace Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure profile accounts, manage security keys, and oversee billing subscriptions.
        </p>
      </div>

      {/* Styled Tabs */}
      <Tabs defaultValue="account" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-950/60 p-1 border border-zinc-900 mb-6 flex overflow-x-auto w-full md:w-auto h-auto max-w-fit">
          <TabsTrigger value="account" className="text-xs flex gap-1.5 items-center py-2 px-4">
            <UserIcon className="h-3.5 w-3.5" /> Profile Account
          </TabsTrigger>
          <TabsTrigger value="billing" className="text-xs flex gap-1.5 items-center py-2 px-4">
            <CreditCard className="h-3.5 w-3.5" /> Billing & Subscription
          </TabsTrigger>
          <TabsTrigger value="api" className="text-xs flex gap-1.5 items-center py-2 px-4">
            <Key className="h-3.5 w-3.5" /> API Integration Keys
          </TabsTrigger>
          <TabsTrigger value="preferences" className="text-xs flex gap-1.5 items-center py-2 px-4">
            <Sliders className="h-3.5 w-3.5" /> Workspace Preferences
          </TabsTrigger>
        </TabsList>

        {/* --- TAB 1: ACCOUNT --- */}
        <TabsContent value="account">
          <Card className="bg-[#09090b]/80 border-zinc-900 max-w-2xl">
            <CardHeader>
              <CardTitle className="text-md">Profile Information</CardTitle>
              <CardDescription className="text-xs">Update your account credentials and system roles.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveProfile}>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Full Name</label>
                  <Input 
                    type="text" 
                    required 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Email Address</label>
                  <Input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">System Role</label>
                  <Select value={role} onChange={(e) => setRole(e.target.value as "admin" | "member" | "viewer")}>
                    <option value="admin">Admin / Owner</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 ml-auto font-semibold gap-1.5" isLoading={isSavingProfile}>
                  <Save className="h-4 w-4" /> Save Profiles
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* --- TAB 2: BILLING --- */}
        <TabsContent value="billing">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Tiers Grid */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-[#09090b]/80 border-zinc-900">
                <CardHeader>
                  <CardTitle className="text-md">Active Subscription</CardTitle>
                  <CardDescription className="text-xs">You are currently subscribed to the {user?.plan} plan.</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Three tiers */}
                  {([
                    { tier: "Free", desc: "Sandbox environment.", price: "$0" },
                    { tier: "Pro", desc: "Perfect for active agencies.", price: "$49" },
                    { tier: "Enterprise", desc: "Monitored scale integrations.", price: "$199" },
                  ] as const).map((p) => {
                    const isCurrent = user?.plan === p.tier;
                    return (
                      <div 
                        key={p.tier}
                        className={`flex items-center justify-between p-4 rounded-lg border text-sm transition-all ${
                          isCurrent 
                            ? "bg-indigo-500/5 border-indigo-500/30" 
                            : "bg-zinc-950/40 border-zinc-900 hover:border-zinc-800"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{p.tier} Tier</span>
                            {isCurrent && (
                              <span className="text-[9px] bg-indigo-500/10 px-2 py-0.5 border border-indigo-500/20 text-indigo-400 font-semibold rounded-full">
                                Current Plan
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500">{p.desc}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-extrabold text-white text-md">{p.price} <span className="text-xs text-zinc-500 font-normal">/mo</span></span>
                          <Button 
                            type="button"
                            size="sm"
                            variant={isCurrent ? "primary" : "outline"}
                            disabled={isCurrent}
                            onClick={() => handlePlanChange(p.tier)}
                            className="text-xs h-8 font-semibold"
                          >
                            {isCurrent ? "Active" : "Switch Plan"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Credit Card Card */}
            <Card className="bg-[#09090b]/80 border-zinc-900">
              <CardHeader>
                <CardTitle className="text-md">Payment Details</CardTitle>
                <CardDescription className="text-xs">Synchronized via Stripe billing portal.</CardDescription>
              </CardHeader>
              <form onSubmit={handleUpdateCard}>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400">Card Number</label>
                    <Input 
                      type="text" 
                      required 
                      value={cardNumber} 
                      onChange={(e) => setCardNumber(e.target.value)} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400">Expiry Date</label>
                      <Input 
                        type="text" 
                        required 
                        placeholder="MM/YY"
                        value={cardExpiry} 
                        onChange={(e) => setCardExpiry(e.target.value)} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400">CVC Code</label>
                      <Input 
                        type="text" 
                        required 
                        value={cardCVC} 
                        onChange={(e) => setCardCVC(e.target.value)} 
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button type="submit" className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white" isLoading={isUpdatingCard}>
                    Save Card Details
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </TabsContent>

        {/* --- TAB 3: API KEYS --- */}
        <TabsContent value="api">
          <Card className="bg-[#09090b]/80 border-zinc-900 max-w-2xl">
            <CardHeader>
              <CardTitle className="text-md">API Access Keys</CardTitle>
              <CardDescription className="text-xs">Authenticate dashboard scripts or feed aggregations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dev Key */}
              <div className="space-y-2 border-b border-zinc-900/60 pb-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-zinc-300">Development Key</span>
                  <button 
                    onClick={() => handleRegenApiKeys("dev")}
                    className="text-indigo-400 hover:underline flex gap-1 items-center"
                  >
                    <RefreshCw className="h-3 w-3" /> Regenerate
                  </button>
                </div>
                <div className="relative">
                  <Input 
                    type={showDevKey ? "text" : "password"} 
                    value={devKey} 
                    readOnly
                    className="pr-10 bg-zinc-950 font-mono text-xs select-all text-indigo-300 border-zinc-900"
                  />
                  <button 
                    onClick={() => setShowDevKey(!showDevKey)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300"
                  >
                    {showDevKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Prod Key */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-zinc-300">Production Key</span>
                  <button 
                    onClick={() => handleRegenApiKeys("prod")}
                    className="text-indigo-400 hover:underline flex gap-1 items-center"
                  >
                    <RefreshCw className="h-3 w-3" /> Regenerate
                  </button>
                </div>
                <div className="relative">
                  <Input 
                    type={showProdKey ? "text" : "password"} 
                    value={prodKey} 
                    readOnly
                    className="pr-10 bg-zinc-950 font-mono text-xs select-all text-indigo-300 border-zinc-900"
                  />
                  <button 
                    onClick={() => setShowProdKey(!showProdKey)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300"
                  >
                    {showProdKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 4: PREFERENCES --- */}
        <TabsContent value="preferences">
          <Card className="bg-[#09090b]/80 border-zinc-900 max-w-2xl">
            <CardHeader>
              <CardTitle className="text-md">Appearance & Theme</CardTitle>
              <CardDescription className="text-xs">Customize the color system of the workspace app shell.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-950/40 border border-zinc-900 text-sm">
                <div className="space-y-0.5">
                  <span className="font-bold text-white">Default Theme Configuration</span>
                  <p className="text-xs text-zinc-500">Currently utilizing Dark Mode aesthetics.</p>
                </div>
                <Button 
                  onClick={() => {
                    toggleTheme();
                    alert(`Selected theme: ${theme === "dark" ? "Light" : "Dark"}. This SaaS is optimized for default dark mode layout.`);
                  }}
                  variant="outline"
                  className="text-xs border-zinc-800 font-semibold"
                >
                  Theme: {theme.toUpperCase()}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
