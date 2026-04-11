"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProfileView } from "@/components/UserProfileModal";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Edit3, ArrowLeft, Settings, ShieldCheck, Camera } from "lucide-react";
import { useState } from "react";
import OnboardingForm from "@/components/OnboardingForm";

export default function ProfilePage() {
    const { user: clerkUser } = useUser();
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);

    const currentUser = useQuery(
        api.users.getCurrentUser,
        clerkUser?.id ? { currentClerkId: clerkUser.id } : "skip"
    );

    if (!currentUser) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    if (isEditing) {
        return (
            <div className="flex-1 bg-background h-screen overflow-y-auto custom-scrollbar dark">
                <div className="max-w-2xl mx-auto py-12 px-6">
                    <Button
                        variant="ghost"
                        onClick={() => setIsEditing(false)}
                        className="mb-8 hover:bg-white/5 rounded-2xl gap-2 font-black text-gray-400 uppercase tracking-widest text-[10px]"
                    >
                        <ArrowLeft className="w-4 h-4" /> Cancel Editing
                    </Button>
                    <OnboardingForm isEditing={true} onComplete={() => setIsEditing(false)} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-screen bg-background relative overflow-hidden dark">
            {/* Immersive Profile Content */}
            <ProfileView user={currentUser} currentUser={currentUser} isStandalone={true} />

            {/* Top Navigation Overlay */}
            <div className="absolute top-4 md:top-8 left-0 right-0 z-30">
                <div className="max-w-5xl mx-auto px-4 md:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            onClick={() => router.push("/")}
                            className="p-3 md:p-4 glass-darker rounded-2xl md:rounded-[1.5rem] hover:scale-105 transition-all text-white border-white/5 shadow-2xl"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="glass-darker px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-[1.5rem] flex items-center gap-2 md:gap-3 border-white/5 shadow-2xl">
                            <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                            <span className="text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Verified</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="glass-darker p-3 md:p-4 rounded-2xl md:rounded-[1.5rem] hover:scale-105 transition-all text-white border-white/5 shadow-2xl"
                        >
                            <Edit3 className="w-5 h-5" />
                        </button>
                        <button
                            className="glass-darker p-3 md:p-4 rounded-2xl md:rounded-[1.5rem] hover:scale-105 transition-all text-white border-white/5 shadow-2xl"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Profile Points Indicator (Vibe Mingle style) */}
            <div className="absolute top-28 left-0 right-0 z-30 pointer-events-none">
                <div className="max-w-5xl mx-auto px-10">
                    <div className="glass px-4 py-2 rounded-full inline-flex items-center gap-2 border-white/5 shadow-2xl pointer-events-auto">
                        <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                            <span className="text-[10px] font-black text-black">P</span>
                        </div>
                        <span className="text-white text-[10px] font-black italic tracking-tight">0.959 Points</span>
                    </div>
                </div>
            </div>

            {/* Mobile Nav Spacer */}
            <div className="h-32 md:hidden" />
        </div>
    );
}
