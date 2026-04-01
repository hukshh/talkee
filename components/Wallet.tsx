"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { Coins, ShieldCheck, Zap, Star } from "lucide-react";
import { toast } from "sonner";

export function Wallet() {
    const { user } = useUser();
    const currentClerkId = user?.id;
    const currentUser = useQuery(api.users.getCurrentUser, currentClerkId ? { currentClerkId } : "skip");
    const addCurrency = useMutation(api.users.addVirtualCurrency);
    const upgradeTier = useMutation(api.users.upgradeSubscriptionTier);
    const [loading, setLoading] = useState(false);

    if (!currentUser) return null;

    const currentCurrency = currentUser.virtualCurrency || 0;
    const currentTier = currentUser.subscriptionTier || "free";

    const handleBuyCurrency = async (amount: number) => {
        if (!currentClerkId) return;
        setLoading(true);
        try {
            await addCurrency({ currentClerkId, amount });
            toast.success(`Successfully added ${amount} coins!`);
        } catch (error) {
            toast.error("Failed to add currency.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (tier: "pro" | "ultra") => {
        if (!currentClerkId) return;
        setLoading(true);
        try {
            await upgradeTier({ currentClerkId, targetTier: tier });
            toast.success(`Successfully upgraded to ${tier.toUpperCase()}!`);
        } catch (error: any) {
            toast.error(error.message || "Failed to upgrade.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto h-full overflow-y-auto bg-gray-50/50">
            <header className="mb-8 flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                        My Wallet <Coins className="w-8 h-8 text-yellow-500" />
                    </h1>
                    <p className="text-gray-500 mt-1">Manage your virtual currency and subscriptions.</p>
                </div>
                <div className="bg-yellow-50 px-6 py-3 rounded-2xl border border-yellow-100 flex items-center gap-3">
                    <span className="text-2xl font-bold text-yellow-700">{currentCurrency}</span>
                    <span className="text-yellow-600 font-medium">Coins</span>
                </div>
            </header>

            <section className="mb-12">
                <h2 className="text-xl font-bold text-gray-800 mb-6 px-2">Top Up Coins</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { coins: 100, price: "$0.99", icon: <Coins className="w-6 h-6" /> },
                        { coins: 550, price: "$4.99", icon: <Zap className="w-6 h-6 text-orange-500" /> },
                        { coins: 1200, price: "$9.99", icon: <Star className="w-6 h-6 text-blue-500" /> },
                    ].map((pack) => (
                        <div key={pack.coins} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center">
                            <div className="bg-gray-50 p-4 rounded-full mb-4">{pack.icon}</div>
                            <span className="text-2xl font-bold text-gray-900">{pack.coins} Coins</span>
                            <span className="text-gray-500 mb-6">{pack.price}</span>
                            <Button 
                                onClick={() => handleBuyCurrency(pack.coins)} 
                                disabled={loading}
                                className="w-full rounded-2xl bg-gray-900 hover:bg-gray-800"
                            >
                                Buy Pack
                            </Button>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-xl font-bold text-gray-800 mb-6 px-2">Subscription Tiers</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Free Tier */}
                    <div className={`bg-white p-8 rounded-3xl border-2 flex flex-col ${currentTier === "free" ? "border-blue-500 shadow-lg shadow-blue-50" : "border-gray-100 opacity-80"}`}>
                        <div className="mb-4">
                            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Free</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Basic</h3>
                        <ul className="text-gray-600 space-y-3 mb-8 flex-1">
                            <li className="flex items-center gap-2 text-sm"><Zap className="w-4 h-4 text-gray-400" /> 3 calls / day</li>
                            <li className="flex items-center gap-2 text-sm"><Zap className="w-4 h-4 text-gray-400" /> 1m 30s call limit</li>
                            <li className="flex items-center gap-2 text-sm"><Zap className="w-4 h-4 text-gray-400" /> Limited swipes</li>
                        </ul>
                        {currentTier === "free" ? (
                            <Button disabled className="w-full rounded-2xl bg-blue-500">Current Plan</Button>
                        ) : null}
                    </div>

                    {/* Pro Tier */}
                    <div className={`bg-white p-8 rounded-3xl border-2 flex flex-col relative ${currentTier === "pro" ? "border-blue-500 shadow-lg shadow-blue-50" : "border-gray-100 hover:shadow-md transition-shadow"}`}>
                        <div className="mb-4">
                            <span className="bg-blue-100 text-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Pro</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Power User</h3>
                        <div className="text-gray-500 text-sm mb-4 font-bold">500 Coins</div>
                        <ul className="text-gray-600 space-y-3 mb-8 flex-1">
                            <li className="flex items-center gap-2 text-sm"><ShieldCheck className="w-4 h-4 text-blue-500" /> 10 calls / day</li>
                            <li className="flex items-center gap-2 text-sm"><ShieldCheck className="w-4 h-4 text-blue-500" /> 5m call limit</li>
                            <li className="flex items-center gap-2 text-sm"><ShieldCheck className="w-4 h-4 text-blue-500" /> Priority Feed</li>
                            <li className="flex items-center gap-2 text-sm"><ShieldCheck className="w-4 h-4 text-blue-500" /> No ads</li>
                        </ul>
                        {currentTier === "pro" ? (
                            <Button disabled className="w-full rounded-2xl bg-blue-500">Current Plan</Button>
                        ) : (
                            <Button 
                                onClick={() => handleUpgrade("pro")} 
                                disabled={loading || currentTier === "ultra"} 
                                className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold"
                            >
                                Upgrade Now
                            </Button>
                        )}
                    </div>

                    {/* Ultra Tier */}
                    <div className={`bg-slate-900 p-8 rounded-3xl border-2 flex flex-col relative text-white ${currentTier === "ultra" ? "border-amber-500 shadow-xl shadow-amber-900/20" : "border-slate-800"}`}>
                        <div className="mb-4">
                            <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Ultra</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Unlimited</h3>
                        <div className="text-amber-400 text-sm mb-4 font-bold">1000 Coins</div>
                        <ul className="text-slate-300 space-y-3 mb-8 flex-1">
                            <li className="flex items-center gap-2 text-sm">< Zap className="w-4 h-4 text-amber-500" /> Unlimited calls / day</li>
                            <li className="flex items-center gap-2 text-sm">< Zap className="w-4 h-4 text-amber-500" /> No call duration limits</li>
                            <li className="flex items-center gap-2 text-sm">< Zap className="w-4 h-4 text-amber-500" /> Unlimited Swipes</li>
                            <li className="flex items-center gap-2 text-sm">< Zap className="w-4 h-4 text-amber-500" /> Ultra Badge & Effects</li>
                        </ul>
                        {currentTier === "ultra" ? (
                            <Button disabled className="w-full rounded-2xl bg-amber-500">Current Plan</Button>
                        ) : (
                            <Button 
                                onClick={() => handleUpgrade("ultra")} 
                                disabled={loading} 
                                className="w-full rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                            >
                                Go Ultra
                            </Button>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
