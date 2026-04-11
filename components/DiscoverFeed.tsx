"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo, useEffect } from "react";
import { Search, Sparkles, MapPin, Plus, LayoutGrid, Layers } from "lucide-react";
import { Button } from "./ui/button";
import { MatchDeck } from "./MatchDeck";
import { UserProfileModal } from "./UserProfileModal";
import { useUser } from "@clerk/nextjs";
import { Badge } from "./ui/badge";
import clsx from "clsx";

import { calculateVibeScore } from "@/lib/vibe";

export function DiscoverFeed() {
    const { user } = useUser();
    const currentClerkId = user?.id;
    const users = useQuery(api.users.getAllUsers, currentClerkId ? { currentClerkId } : "skip");
    const currentUser = useQuery(api.users.getCurrentUser, currentClerkId ? { currentClerkId } : "skip");
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "swipe">("grid");

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(u =>
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.bio?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [users, searchQuery]);

    if (users === undefined) return (
        <div className="flex-1 flex items-center justify-center py-40">
            <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-transparent dark">
            {/* Header & Controls Section */}
            <div className="sticky top-0 z-40 bg-[#080808]/80 backdrop-blur-3xl border-b border-white/[0.04] px-4 py-6 md:px-8 md:py-8 space-y-6">
                <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 glass-silver rounded-xl flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter">Explore <span className="text-zinc-500">Vibes</span></h1>
                        </div>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] italic leading-none px-1">Scanning Neural Frequencies</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group flex-1 md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                placeholder="Identify frequency..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-11 bg-white/5 border border-white/[0.06] rounded-2xl pl-11 pr-4 text-sm text-white focus:bg-white/10 focus:border-white/20 transition-all outline-none placeholder:text-zinc-700"
                            />
                        </div>

                        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/[0.04] shrink-0">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={clsx(
                                    "p-2.5 rounded-xl transition-all",
                                    viewMode === "grid" ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"
                                )}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("swipe")}
                                className={clsx(
                                    "p-2.5 rounded-xl transition-all",
                                    viewMode === "swipe" ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"
                                )}
                            >
                                <Layers className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {viewMode === "grid" ? (
                    <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 pb-40">
                        {filteredUsers.map((u) => (
                            <VibeCard
                                key={u._id}
                                user={u}
                                currentUser={currentUser}
                                onClick={() => setSelectedUser(u)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col">
                        <MatchDeck />
                    </div>
                )}
            </div>

            {selectedUser && (
                <UserProfileModal
                    user={selectedUser}
                    currentUser={currentUser}
                    isOpen={!!selectedUser}
                    onClose={() => setSelectedUser(null)}
                />
            )}
        </div>
    );
}

function VibeCard({ user: u, currentUser, onClick }: { user: any, currentUser: any, onClick: () => void }) {
    const score = calculateVibeScore(currentUser?.interests || [], [...(u.interests || []), ...(u.fantasy || []), ...(u.desire || [])]);
    
    return (
        <div
            onClick={onClick}
            className="group relative aspect-[4/5] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-zinc-900 cursor-pointer border border-white/5 transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_40px_80px_rgba(0,0,0,0.8)]"
        >
            {/* Base Image */}
            <img
                src={u.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800"}
                alt={u.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />

            {/* Top Protection Gradient */}
            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/60 via-black/20 to-transparent opacity-80" />
            
            {/* Bottom Protection Gradient */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#080808] via-[#080808]/40 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />

            {/* Top Indicators */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                {u.isOnline ? (
                    <div className="glass px-2.5 py-1 rounded-full flex items-center gap-1.5 border-white/10 shadow-2xl">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                        <span className="text-[8px] font-black text-white uppercase tracking-widest italic">Live</span>
                    </div>
                ) : (
                    <div className="glass-darker px-2.5 py-1 rounded-full flex items-center gap-1.5 border-white/5 opacity-40">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest italic">Idle</span>
                    </div>
                )}

                <div className="glass px-2 py-1 rounded-full flex items-center gap-1.5 border-white/10 shadow-2xl backdrop-blur-2xl">
                    <span className="text-[9px] font-black text-white italic tracking-tighter">{score}%</span>
                </div>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-5 left-5 right-5 space-y-2 z-10">
                <div className="space-y-0.5">
                    <h3 className="text-lg md:text-xl font-black text-white italic uppercase tracking-tighter leading-none group-hover:text-zinc-300 transition-colors">
                        {u.name.split(' ')[0]}
                    </h3>
                    <div className="flex items-center gap-1.5 text-zinc-500 font-black text-[8px] uppercase tracking-[0.2em] italic">
                        <MapPin className="w-2.5 h-2.5" /> Area 51
                    </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                    {Array.from(new Set((u.interests || []) as string[])).slice(0, 2).map((t: string) => (
                        <span key={t} className="px-2.5 py-1 glass rounded-full text-[7px] font-black text-white/60 uppercase tracking-widest border-white/5 whitespace-nowrap">
                            {t}
                        </span>
                    ))}
                </div>
            </div>

            {/* Premium Shine Layer */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-1000" />
        </div>
    );
}
