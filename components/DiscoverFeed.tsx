"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Heart, X } from "lucide-react";
import { Button } from "./ui/button";

export function DiscoverFeed() {
    const { user } = useUser();
    const currentClerkId = user?.id;

    const rawMatches = useQuery(api.matches.getPotentialMatches, currentClerkId ? { currentClerkId } : "skip");
    const swipeMutation = useMutation(api.matches.swipe);

    // Maintain a local queue to allow instant UI updates
    const [queue, setQueue] = useState<any[]>([]);
    const [animatingOut, setAnimatingOut] = useState<"like" | "pass" | null>(null);

    useEffect(() => {
        // Only set queue if it's currently empty, so we don't override mid-session
        if (rawMatches && queue.length === 0 && !animatingOut) {
            setQueue(rawMatches);
        }
    }, [rawMatches, queue.length, animatingOut]);

    if (!user || rawMatches === undefined) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 rounded-full border-4 border-t-blue-600 animate-spin" />
            </div>
        );
    }

    const handleSwipe = async (userId: string, action: "like" | "pass") => {
        if (animatingOut || queue.length === 0) return;

        setAnimatingOut(action);

        // Perform backend mutation without blocking UI
        swipeMutation({ currentClerkId: currentClerkId!, swipedId: userId as any, action }).catch(console.error);

        // Wait for exit animation
        setTimeout(() => {
            setQueue(prev => prev.slice(1));
            setAnimatingOut(null);
        }, 400); // match Tailwind transition duration
    };

    if (queue.length === 0) {
        return (
            <div className="flex-1 flex flex-col pt-32 h-full bg-gray-50 items-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                    <Heart className="w-10 h-10 text-gray-300" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">You're all caught up!</h2>
                <p className="text-gray-500 mt-2">Check back later for more potential matches.</p>
            </div>
        );
    }

    // We only render the top two cards for performance and visual stack effect
    const cardStack = queue.slice(0, 2).reverse();

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50 items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-8 left-8">
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-purple-600 tracking-tighter">
                    Discover
                </h1>
                <p className="text-gray-500 font-medium">Find your next connection</p>
            </div>

            <div className="relative w-full max-w-sm aspect-[3/4] mt-8">
                {cardStack.map((profile, i) => {
                    const isTopCard = i === cardStack.length - 1;

                    let animationClass = "scale-95 translate-y-4 opacity-0"; // Bottom card default
                    if (isTopCard) {
                        if (animatingOut === "like") animationClass = "translate-x-[150%] rotate-12 opacity-0 transition-all duration-500 ease-in-out";
                        else if (animatingOut === "pass") animationClass = "-translate-x-[150%] -rotate-12 opacity-0 transition-all duration-500 ease-in-out";
                        else animationClass = "scale-100 translate-x-0 translate-y-0 opacity-100 transition-all duration-300";
                    } else if (animatingOut) {
                        // Background card shifts up when top card animates out
                        animationClass = "scale-100 translate-x-0 translate-y-0 opacity-100 transition-all duration-500 delay-75 ease-out";
                    } else {
                        animationClass = "scale-[0.98] translate-y-2 opacity-90 transition-all duration-300";
                    }

                    return (
                        <div
                            key={profile._id}
                            className={`absolute inset-0 bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col ${animationClass}`}
                            style={{ transformOrigin: "bottom center" }}
                        >
                            <div className="flex-1 relative bg-gray-100">
                                {profile.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200" />
                                )}

                                {/* Gradient overlay for text legibility */}
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                                <div className="absolute bottom-6 left-6 right-6 text-white drop-shadow-md">
                                    <h2 className="text-4xl font-black tracking-tight">{profile.name}</h2>
                                    <div className="flex items-center gap-2 mt-2 ml-1">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                                        <span className="text-sm font-semibold tracking-wide text-gray-200 uppercase">Active Now</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-8 mt-10 z-10 w-full max-w-sm justify-center px-4">
                <Button
                    onClick={() => handleSwipe(queue[0]._id, "pass")}
                    disabled={!!animatingOut || queue.length === 0}
                    className="w-16 h-16 rounded-full bg-white text-rose-500 shadow-[0_8px_20px_rgba(225,29,72,0.15)] hover:bg-rose-50 border-none transition-transform active:scale-90 disabled:opacity-50"
                >
                    <X className="w-8 h-8" strokeWidth={3} />
                </Button>
                <Button
                    onClick={() => handleSwipe(queue[0]._id, "like")}
                    disabled={!!animatingOut || queue.length === 0}
                    className="w-16 h-16 rounded-full bg-white text-emerald-500 shadow-[0_8px_20px_rgba(16,185,129,0.15)] hover:bg-emerald-50 border-none transition-transform active:scale-90 disabled:opacity-50"
                >
                    <Heart className="w-8 h-8 fill-emerald-500" />
                </Button>
            </div>
        </div>
    );
}
