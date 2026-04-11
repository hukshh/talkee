"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Heart, X, Sparkles, MapPin, Zap, Info } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import clsx from "clsx";
import { calculateVibeScore } from "@/lib/vibe";

export function MatchDeck() {
    const { user } = useUser();
    const currentClerkId = user?.id;

    const potentialMatches = useQuery(
        api.matches.getPotentialMatches,
        currentClerkId ? { currentClerkId } : "skip"
    );
    const currentUser = useQuery(api.users.getCurrentUser, currentClerkId ? { currentClerkId: user?.id || "" } : "skip");

    const swipeMutation = useMutation(api.matches.swipe);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleSwipe = async (action: "like" | "pass", swipedUserId: any) => {
        if (!currentClerkId) return;

        try {
            await swipeMutation({
                currentClerkId,
                swipedId: swipedUserId,
                action,
            });
            setCurrentIndex((prev) => prev + 1);
            if (action === "like") {
                toast.success("Interest Signal Sent! ✨", { duration: 2000 });
            }
        } catch (err) {
            toast.error("Failed to sync vibe.");
        }
    };

    if (potentialMatches === undefined) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-white/10 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    const currentMatches = potentialMatches.slice(currentIndex);

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden h-full max-w-lg mx-auto">
            <AnimatePresence>
                {currentMatches.length > 0 ? (
                    currentMatches.slice(0, 2).reverse().map((u, i) => (
                        <SwipeCard
                            key={u._id}
                            user={u}
                            currentUser={currentUser}
                            onSwipe={(action) => handleSwipe(action, u._id)}
                            isTop={i === (currentMatches.length === 1 ? 0 : 1)}
                        />
                    ))
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-6"
                    >
                        <div className="w-24 h-24 glass-silver rounded-[2.5rem] flex items-center justify-center mx-auto border-white/20 shadow-2xl">
                            <Sparkles className="w-10 h-10 text-white" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">Grid Depleted</h3>
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] italic leading-relaxed">scanning for new frequencies...</p>
                        </div>
                        <Button
                            variant="ghost"
                            className="glass text-white border-white/10 rounded-full px-8 h-14 font-black uppercase tracking-widest italic"
                            onClick={() => setCurrentIndex(0)}
                        >
                            Reset Grid
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {currentMatches.length > 0 && (
                <div className="absolute bottom-10 flex items-center gap-8 z-[100]">
                    <button
                        onClick={() => handleSwipe("pass", currentMatches[0]._id)}
                        className="w-20 h-20 rounded-[2.5rem] glass-darker border-2 border-white/5 flex items-center justify-center text-zinc-600 hover:text-white hover:border-white/20 transition-all active:scale-90 shadow-2xl group"
                    >
                        <X className="w-10 h-10 group-hover:rotate-12 transition-transform" />
                    </button>
                    <button
                        onClick={() => handleSwipe("like", currentMatches[0]._id)}
                        className="w-24 h-24 rounded-[3rem] bg-white text-black flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:scale-110 active:scale-90 transition-all group"
                    >
                        <Heart className="w-12 h-12 group-hover:scale-110 transition-transform fill-none group-hover:fill-current" />
                    </button>
                </div>
            )}
        </div>
    );
}

function SwipeCard({ user, currentUser, onSwipe, isTop }: { user: any; currentUser: any; onSwipe: (action: "like" | "pass") => void; isTop: boolean }) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
    const heartOpacity = useTransform(x, [50, 150], [0, 1]);
    const passOpacity = useTransform(x, [-50, -150], [0, 1]);

    const handleDragEnd = (_: any, info: any) => {
        if (info.offset.x > 100) {
            onSwipe("like");
        } else if (info.offset.x < -100) {
            onSwipe("pass");
        }
    };

    return (
        <motion.div
            style={{ x, rotate, opacity, zIndex: isTop ? 50 : 40 }}
            drag={isTop ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            whileDrag={{ scale: 1.05 }}
            className="absolute inset-0 flex items-center justify-center touch-none"
        >
            <div className="relative w-full max-w-[380px] aspect-[3/4] rounded-[3.5rem] overflow-hidden glass-grey border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.8)] group">
                <img
                    src={user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800"}
                    className="w-full h-full object-cover select-none pointer-events-none"
                    alt={user.name}
                />

                {/* Swipe Indicators */}
                <motion.div
                    style={{ opacity: heartOpacity }}
                    className="absolute top-12 left-12 border-4 border-emerald-500 text-emerald-500 px-6 py-2 rounded-2xl rotate-[-15deg] font-black text-4xl uppercase tracking-tighter italic"
                >
                    LIKE
                </motion.div>
                <motion.div
                    style={{ opacity: passOpacity }}
                    className="absolute top-12 right-12 border-4 border-red-500 text-red-500 px-6 py-2 rounded-2xl rotate-[15deg] font-black text-4xl uppercase tracking-tighter italic"
                >
                    NOPE
                </motion.div>

                {/* Vibe Score */}
                <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20">
                    <div className="glass px-5 py-2 rounded-full border border-white/20 shadow-2xl flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-sm font-black text-white italic uppercase tracking-widest">
                            {calculateVibeScore(currentUser?.interests || [], user.interests || [])}% Match
                        </span>
                    </div>
                </div>

                {/* Info Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-black via-black/60 to-transparent pt-32">
                    <div className="space-y-4">
                        <div className="flex items-end justify-between">
                            <div className="space-y-1">
                                <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
                                    {user.name.split(' ')[0]}
                                </h3>
                                <div className="flex items-center gap-2 text-zinc-500 font-black text-[10px] uppercase tracking-[0.2em] italic">
                                    <MapPin className="w-3 h-3" /> Area 51, Hidden
                                </div>
                            </div>
                            <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-white border-white/10">
                                <Info className="w-6 h-6 opacity-30" />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {Array.from(new Set((user.interests || user.fantasy || []) as string[])).slice(0, 3).map((tag: string) => (
                                <span key={tag} className="px-4 py-1.5 glass rounded-full text-[9px] font-black text-white italic uppercase tracking-widest border-white/5">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Premium Shine */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/5 opacity-30 pointer-events-none" />
            </div>
        </motion.div>
    );
}
