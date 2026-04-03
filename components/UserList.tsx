"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, MapPin, Zap } from "lucide-react";
import clsx from "clsx";

function UserStatus({ userId }: { userId: string }) {
    const presence = useQuery(api.presence.getPresence, { userId: userId as any });
    const isOnline = presence?.isOnline;

    return (
        <div className={clsx(
            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-[#0c0c0c] shadow-2xl transition-all duration-500",
            isOnline ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-zinc-700"
        )}>
            {isOnline && <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20" />}
        </div>
    );
}

export function UserList({
    searchQuery,
    genderFilter,
    onSelectConversation,
}: {
    searchQuery: string;
    genderFilter: string;
    onSelectConversation: (convoId: string) => void;
}) {
    const { user } = useUser();
    const currentClerkId = user?.id;

    const users = useQuery(api.users.getAllUsers, currentClerkId ? { currentClerkId } : "skip");

    const filteredUsers = users?.filter((u) => {
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGender = genderFilter === "all" || u.gender === genderFilter;
        return matchesSearch && matchesGender;
    });

    if (users === undefined) {
        return (
            <div className="space-y-4 p-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <UserSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (filteredUsers?.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-3">
                <p className="text-zinc-600 font-black italic text-sm tracking-tight">No vibes found here.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full flex-1">
            <div className="space-y-4 p-4 pb-40 md:pb-0 custom-scrollbar">
                {filteredUsers?.map((u) => (
                    <div
                        key={u._id}
                        onClick={() => onSelectConversation(u.clerkId)}
                        className="group flex items-center gap-4 p-5 rounded-[2.5rem] cursor-pointer transition-all duration-500 active:scale-95 glass-silver border-white/5 hover:border-white/20 hover:scale-[1.02] shadow-[0_20px_40px_rgba(0,0,0,0.3)] relative overflow-hidden"
                    >
                        <div className="relative">
                            <Avatar className="h-16 w-16 rounded-[1.5rem] border-2 border-white/10 group-hover:border-white/30 transition-all shadow-xl">
                                <AvatarImage src={u.avatarUrl} alt={u.name} className="object-cover" />
                                <AvatarFallback className="bg-zinc-900 text-white font-black italic">{u.name[0]}</AvatarFallback>
                            </Avatar>
                            <UserStatus userId={u._id} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between mb-1 gap-2">
                                <h3 className="text-xl font-black italic truncate uppercase tracking-tighter vibe-gradient">
                                    {u.name}
                                </h3>
                                <Zap className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <MapPin className="w-3 h-3 text-zinc-600 shrink-0" />
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic truncate">Mumbai, IN</span>
                                </div>
                                <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest shrink-0">• {u.gender}</span>
                            </div>
                        </div>
                        {/* Premium Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}

function UserSkeleton() {
    return (
        <div className="flex items-center gap-4 p-5 rounded-[2.5rem] glass-silver border-white/5 opacity-50">
            <Skeleton className="h-16 w-16 rounded-[1.5rem] shrink-0" />
            <div className="flex-1 space-y-3 min-w-0">
                <div className="flex justify-between items-center gap-4">
                    <Skeleton className="h-6 w-32 rounded-lg" />
                    <Skeleton className="h-4 w-4 bg-white/10 rounded-full" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-3 w-16 rounded-full" />
                    <Skeleton className="h-3 w-16 rounded-full opacity-50" />
                </div>
            </div>
        </div>
    );
}
