"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function Preloader({ children }: { children: React.ReactNode }) {
    const [isMounted, setIsMounted] = useState(false);
    const { isLoaded: isClerkLoaded, isSignedIn } = useUser();
    const currentUser = useQuery(api.users.getCurrentUser, (isClerkLoaded && isSignedIn) ? { currentClerkId: "me" } : "skip"); // Just a poke to see if convex is ready

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Show preloader until everything is ready
    // We only show the full screen preloader if not mounted to prevent hydration mismatches
    if (!isMounted) {
        return (
            <div className="fixed inset-0 z-[1000] bg-[#050505] flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                    <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                        <Sparkles className="w-12 h-12 text-zinc-900" />
                    </div>
                </div>
            </div>
        );
    }

    const isLoading = !isClerkLoaded;

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[1000] bg-[#050505] flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                    <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.1)] animate-pulse">
                        <Sparkles className="w-12 h-12 text-white shadow-2xl" />
                    </div>
                    <div className="absolute inset-0 bg-white/5 rounded-[2rem] blur-2xl animate-ping opacity-20" />
                </div>
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-black text-white italic uppercase tracking-[0.2em] animate-pulse">Vibe Mingle</h1>
                    <div className="w-32 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
                        <div className="w-full h-full bg-white animate-progress-fast" />
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
