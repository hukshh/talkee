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

export function DiscoverFeed() {
    const { user } = useUser();
    const currentClerkId = user?.id;
    const users = useQuery(api.users.getAllUsers, currentClerkId ? { currentClerkId } : "skip");
    const currentUser = useQuery(api.users.getCurrentUser, currentClerkId ? { currentClerkId } : "skip");
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [points, setPoints] = useState<{ x: number, y: number }[]>([]);

    useEffect(() => {
        const newPoints = Array.from({ length: 6 }).map(() => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
        }));
        setPoints(newPoints);
    }, []);

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(u =>
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.bio?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [users, searchQuery]);
    const [viewMode, setViewMode] = useState<"grid" | "swipe">("grid");
    if (users === undefined) return (
        <div className="flex-1 flex items-center justify-center py-40">
            <div className="w-16 h-16 border-4 border-white/10 border-t-white rounded-full animate-spin shadow-2xl" />
        </div>
    );

    return (
        <div className="flex-1 p-4 md:p-6 space-y-6 relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                {points.map((p, i) => (
                    <div
                        key={i}
                        className="absolute w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] animate-pulse"
                        style={{
                            top: `${p.y}%`,
                            left: `${p.x}%`,
                            animationDelay: `${i * 2}s`
                        }}
                    />
                ))}
            </div>

            {/* Header / Social Search */}
            <div className="max-w-6xl mx-auto space-y-6 mt-2 md:mt-8 px-1">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 glass-grey rounded-xl flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter">
                                Discover <span className="text-zinc-500">Vibes</span>
                            </h1>
                        </div>
                        <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest px-1">Scanning for compatible frequencies</p>
                    </div>

                    <div className="flex bg-[#0c0c0c]/60 p-1.5 rounded-2xl border border-white/[0.04]">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={clsx(
                                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all",
                                viewMode === "grid" ? "bg-white text-black shadow-xl" : "text-zinc-600 hover:text-white"
                            )}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" /> Grid
                        </button>
                        <button
                            onClick={() => setViewMode("swipe")}
                            className={clsx(
                                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all",
                                viewMode === "swipe" ? "bg-white text-black shadow-xl" : "text-zinc-600 hover:text-white"
                            )}
                        >
                            <Layers className="w-3.5 h-3.5" /> Match
                        </button>
                    </div>
                </div>

                <div className="relative group max-w-2xl">
                    <div className="absolute -inset-1 bg-gradient-to-r from-white/0 via-white/5 to-white/0 rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition duration-1000" />
                    <div className="glass-grey flex items-center gap-3 p-2 pl-5 rounded-2xl shadow-lg">
                        <Search className="w-5 h-5 text-zinc-600" />
                        <input
                            type="text"
                            placeholder="Identify name, vibe, or frequency..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none text-white focus:ring-0 flex-1 h-10 font-medium text-sm placeholder:text-zinc-600"
                        />
                        <Button className="h-10 px-6 glass-darker text-white rounded-xl border-white/[0.05] hover:bg-white hover:text-black font-bold uppercase tracking-wider text-xs transition-all">
                            Scan
                        </Button>
                    </div>
                </div>
            </div>

            {/* Discover Grid / Match Deck */}
            {viewMode === "grid" ? (
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-1 pb-32">
                    {filteredUsers.map((u, i) => (
                        <div
                            key={u._id}
                            onClick={() => setSelectedUser(u)}
                            className={clsx(
                                "group cursor-pointer relative overflow-hidden rounded-2xl glass-grey border-white/[0.06] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                                i % 5 === 0 ? "md:col-span-2" : ""
                            )}
                        >
                            <div className="relative h-80 w-full">
                                <img
                                    src={u.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800"}
                                    alt={u.name}
                                    className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80" />

                                {/* Top Badges */}
                                <div className="absolute top-6 left-6 flex gap-2">
                                    {u.isOnline ? (
                                        <div className="glass px-3 py-1.5 rounded-full flex items-center gap-1.5 border-white/10">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                                            <span className="text-[9px] font-black text-white uppercase tracking-widest italic">Live</span>
                                        </div>
                                    ) : (
                                        <div className="glass-darker px-3 py-1.5 rounded-full flex items-center gap-1.5 border-white/5 opacity-60">
                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Offline</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="absolute bottom-8 left-8 right-8 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-bold text-white tracking-tight">{u.name}</h3>
                                            <div className="flex items-center gap-1.5 text-zinc-500 font-medium text-[10px] uppercase tracking-wider">
                                                <MapPin className="w-3 h-3" /> Area 51, Hidden
                                            </div>
                                        </div>
                                        <div className="h-10 w-10 glass rounded-xl flex items-center justify-center border-white/[0.08] transition-all group-hover:scale-105 group-hover:bg-white group-hover:text-black">
                                            <Plus className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {(u.interests || u.fantasy || []).slice(0, 2).map((t: string) => (
                                            <Badge key={t} variant="secondary" className="bg-white/[0.05] text-zinc-300 border-white/[0.05] text-[8px] font-medium uppercase tracking-wider py-1 px-2.5 rounded-full backdrop-blur-md">
                                                {t}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-1 min-h-[600px] flex flex-col">
                    <MatchDeck />
                </div>
            )}

            {selectedUser && (
                <UserProfileModal
                    user={selectedUser}
                    currentUser={currentUser}
                    isOpen={!!selectedUser}
                    onClose={() => setSelectedUser(null)}
                />
            )
            }
        </div>
    );
}
