"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { Coins, ShieldCheck, Zap, Star, Crown, Loader2, Sparkles, TrendingUp, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "./ui/skeleton";
import clsx from "clsx";

declare global {
    interface Window {
        Razorpay: any;
    }
}

const COIN_PACKS = [
    { coins: 100, price: 50, label: "₹50", icon: <Coins className="w-6 h-6" /> },
    { coins: 550, price: 150, label: "₹150", icon: <Zap className="w-6 h-6 text-zinc-300" />, badge: "Popular" },
    { coins: 1200, price: 450, label: "₹450", icon: <Star className="w-6 h-6 text-white" />, badge: "Best Value" },
];

export function Wallet() {
    const { user } = useUser();
    const currentClerkId = user?.id;
    const currentUser = useQuery(api.users.getCurrentUser, currentClerkId ? { currentClerkId } : "skip");
    const addCurrency = useMutation(api.users.addVirtualCurrency);
    const upgradeTier = useMutation(api.users.upgradeSubscriptionTier);
    const [loading, setLoading] = useState<string | null>(null);

    if (!currentUser) {
        return (
            <div className="h-full w-full p-4 md:p-10 space-y-12 animate-pulse">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-64 bg-white/5 rounded-2xl" />
                            <Skeleton className="h-4 w-40 bg-white/5 rounded-full" />
                        </div>
                        <Skeleton className="h-24 w-64 bg-white/5 rounded-[2.5rem]" />
                    </div>
                </div>
                <div className="max-w-5xl mx-auto px-2">
                    <Skeleton className="h-32 w-full bg-white/5 rounded-[2.5rem]" />
                </div>
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-64 w-full bg-white/5 rounded-[3rem]" />
                    ))}
                </div>
            </div>
        );
    }

    const currentCurrency = currentUser.virtualCurrency || 0;
    const currentTier = currentUser.subscriptionTier || "free";

    const loadRazorpayScript = (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (window.Razorpay) return resolve(true);
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleBuyCoins = async (pack: typeof COIN_PACKS[0]) => {
        setLoading(`coins-${pack.coins}`);
        try {
            const loaded = await loadRazorpayScript();
            if (!loaded) throw new Error("Razorpay SDK failed to load");

            const res = await fetch("/api/razorpay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: pack.price, receipt: `coins_${pack.coins}_${Date.now()}` }),
            });
            const order = await res.json();
            if (order.error) throw new Error(order.error);

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: pack.price * 100,
                currency: "INR",
                name: "Vibe Mingle",
                description: `${pack.coins} Coins Pack`,
                order_id: order.id,
                handler: async (response: any) => {
                    const verifyRes = await fetch("/api/razorpay/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(response),
                    });
                    const verifyData = await verifyRes.json();

                    if (verifyData.verified) {
                        await addCurrency({ currentClerkId: currentClerkId!, amount: pack.coins });
                        toast.success(`🎉 ${pack.coins} coins added to your vibe!`);
                    } else {
                        toast.error("Vibe check failed.");
                    }
                },
                prefill: {
                    name: user?.fullName || "",
                    email: user?.emailAddresses?.[0]?.emailAddress || "",
                },
                theme: { color: "#000000" },
                modal: {
                    ondismiss: () => setLoading(null),
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error: any) {
            toast.error(error.message || "Transfer failed.");
        } finally {
            setLoading(null);
        }
    };

    const handleUpgrade = async (tier: "pro" | "ultra") => {
        if (!currentClerkId) return;
        setLoading(`tier-${tier}`);
        try {
            await upgradeTier({ currentClerkId, targetTier: tier });
            toast.success(`✨ Profile boosted to ${tier.toUpperCase()}!`);
        } catch (error: any) {
            toast.error(error.message || "Failed to boost.");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="h-full w-full p-4 md:p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Balance Card */}
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 glass-silver rounded-xl flex items-center justify-center">
                                <CreditCard className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter vibe-gradient">
                                My <span className="text-zinc-500 opacity-60">Wallet</span>
                            </h1>
                        </div>
                        <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest px-1">Fuel your social energy</p>
                    </div>

                    <div className="glass-silver px-8 py-5 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.3)] flex items-center gap-6 group transition-all duration-700 hover:scale-[1.02] border-white/5">
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-none mb-1">Energy Balance</p>
                            <p className="text-4xl font-black text-white tracking-tighter leading-none">{currentCurrency}</p>
                        </div>
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] group-hover:rotate-[360deg] transition-all duration-1000">
                            <Coins className="w-8 h-8 text-black" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Economy Info */}
            <div className="max-w-5xl mx-auto px-2">
                <div className="glass-grey p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 shadow-lg">
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-white" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Economy Rules</h3>
                        </div>
                        <p className="text-zinc-500 text-xs font-normal leading-relaxed">
                            Keep your energy high by holding coins. Each interaction strengthens your profile visibility and connectivity.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-end">
                        <div className="glass px-4 py-3 rounded-2xl flex items-center gap-2 border-white/5">
                            <span className="text-[10px] font-black text-white italic uppercase tracking-widest">Calls: 20c/min</span>
                        </div>
                        <div className="glass px-4 py-3 rounded-2xl flex items-center gap-2 border-white/5">
                            <span className="text-[10px] font-black text-white italic uppercase tracking-widest">Free: 3 calls/day</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Coin Packs */}
            <div className="max-w-5xl mx-auto space-y-6 px-2">
                <h2 className="text-xl font-black text-white italic uppercase tracking-widest px-2 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> Energy Packs
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {COIN_PACKS.map((pack) => (
                        <div key={pack.coins} className="glass-grey p-8 rounded-[3rem] border border-white/0 hover:border-white/10 hover:bg-white/5 transition-all duration-500 group shadow-2xl relative overflow-hidden flex flex-col items-center">
                            {pack.badge && (
                                <div className="absolute top-6 right-6 glass px-3 py-1 rounded-full text-[8px] font-black text-white uppercase tracking-widest italic border-white/20">
                                    {pack.badge}
                                </div>
                            )}
                            <div className="w-16 h-16 glass rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all border-white/5 shadow-2xl">
                                {pack.icon}
                            </div>
                            <span className="text-3xl font-black text-white italic tracking-tighter uppercase mb-1">{pack.coins} Coins</span>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-8">{pack.label} Pack</span>

                            <Button
                                onClick={() => handleBuyCoins(pack)}
                                disabled={loading === `coins-${pack.coins}`}
                                className="w-full h-16 rounded-2xl bg-white text-black hover:bg-zinc-100 hover:scale-105 active:scale-95 font-black uppercase tracking-widest italic text-xs transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)]"
                            >
                                {loading === `coins-${pack.coins}` ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    "Acquire Pack"
                                )}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Subscriptions */}
            <div className="max-w-5xl mx-auto space-y-6 px-2 pb-32">
                <h2 className="text-xl font-black text-white italic uppercase tracking-widest px-2 flex items-center gap-2">
                    <Crown className="w-5 h-5" /> Profile Status
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Free Tier */}
                    <div className={clsx(
                        "glass-grey p-10 rounded-[3rem] border border-white/0 shadow-2xl flex flex-col",
                        currentTier === "free" && "border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.05)]"
                    )}>
                        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.4em] italic mb-2">Tier: Basic</h3>
                        <p className="text-3xl font-black text-white italic tracking-tighter uppercase mb-8">Essential</p>
                        <ul className="space-y-4 mb-10 flex-1">
                            <li className="flex items-center gap-3 text-[11px] font-black text-zinc-400 uppercase tracking-widest italic">
                                <Zap className="w-4 h-4 text-zinc-600" /> 3 Calls/Day
                            </li>
                            <li className="flex items-center gap-3 text-[11px] font-black text-zinc-400 uppercase tracking-widest italic">
                                <Zap className="w-4 h-4 text-zinc-600" /> Basic Search
                            </li>
                        </ul>
                        {currentTier === "free" ? (
                            <Button disabled className="h-16 rounded-2xl glass-darker text-zinc-500 font-black uppercase tracking-widest text-[10px] italic border-white/5">Active Status</Button>
                        ) : (
                            <Button disabled className="h-16 rounded-2xl glass-darker text-zinc-700 font-black uppercase tracking-widest text-[10px] italic border-white/5">Classic</Button>
                        )}
                    </div>

                    {/* Pro Tier */}
                    <div className={clsx(
                        "glass-grey p-10 rounded-[3rem] border border-white/0 shadow-2xl flex flex-col relative",
                        currentTier === "pro" && "border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)]"
                    )}>
                        <h3 className="text-xs font-black text-zinc-300 uppercase tracking-[0.4em] italic mb-2">Tier: Pro</h3>
                        <p className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Superior</p>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic mb-8">500 Energy Required</p>
                        <ul className="space-y-4 mb-10 flex-1">
                            <li className="flex items-center gap-3 text-[11px] font-black text-zinc-300 uppercase tracking-widest italic">
                                <ShieldCheck className="w-4 h-4 text-blue-500 shadow-blue-500/50" /> 5 Calls/Day
                            </li>
                            <li className="flex items-center gap-3 text-[11px] font-black text-zinc-300 uppercase tracking-widest italic">
                                <ShieldCheck className="w-4 h-4 text-blue-500" /> Priority Feed
                            </li>
                            <li className="flex items-center gap-3 text-[11px] font-black text-zinc-300 uppercase tracking-widest italic">
                                <ShieldCheck className="w-4 h-4 text-blue-500" /> No Vibe Interference
                            </li>
                        </ul>
                        {currentTier === "pro" ? (
                            <Button disabled className="h-16 rounded-2xl glass-darker text-white font-black uppercase tracking-widest text-[10px] italic shadow-2xl border-white/10">Active Status</Button>
                        ) : (
                            <Button
                                onClick={() => handleUpgrade("pro")}
                                disabled={loading === "tier-pro" || currentTier === "ultra"}
                                className="h-16 rounded-2xl glass border border-white/20 text-white font-black uppercase tracking-widest text-[10px] italic hover:bg-white hover:text-black transition-all shadow-2xl"
                            >
                                {loading === "tier-pro" ? <Loader2 className="w-5 h-5 animate-spin" /> : "Boost Profile"}
                            </Button>
                        )}
                    </div>

                    {/* Ultra Tier */}
                    <div className={clsx(
                        "glass-darker p-10 rounded-[3rem] border-white/20 shadow-[0_0_100px_rgba(255,255,255,0.05)] flex flex-col relative",
                        currentTier === "ultra" && "border-white/40 shadow-[0_0_100px_rgba(255,255,255,0.1)]"
                    )}>
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.4em] italic mb-2">Tier: Ultra</h3>
                        <p className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Legendary</p>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic mb-8">1000 Energy Required</p>
                        <ul className="space-y-4 mb-10 flex-1">
                            <li className="flex items-center gap-3 text-[11px] font-black text-white uppercase tracking-widest italic">
                                <Crown className="w-4 h-4 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" /> Unlimited Calls
                            </li>
                            <li className="flex items-center gap-3 text-[11px] font-black text-white uppercase tracking-widest italic">
                                <Crown className="w-4 h-4 text-white" /> Zero Cost Vibes
                            </li>
                            <li className="flex items-center gap-3 text-[11px] font-black text-white uppercase tracking-widest italic">
                                <Crown className="w-4 h-4 text-white" /> Global Visibility
                            </li>
                        </ul>
                        {currentTier === "ultra" ? (
                            <Button disabled className="h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] italic shadow-2xl">Current Status</Button>
                        ) : (
                            <Button
                                onClick={() => handleUpgrade("ultra")}
                                disabled={loading === "tier-ultra"}
                                className="h-16 rounded-2xl bg-white text-black hover:scale-105 transition-all font-black uppercase tracking-widest text-[10px] italic shadow-[0_0_40px_rgba(255,255,255,0.25)]"
                            >
                                {loading === "tier-ultra" ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reach Legend"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
