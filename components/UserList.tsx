"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, MapPin, Zap, Search } from "lucide-react";
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
    onSelectConversation,
}: {
    searchQuery: string;
    onSelectConversation: (convoId: string) => void;
}) {
    const { user } = useUser();
    const currentClerkId = user?.id;

    const users = useQuery(api.users.getAllUsers, currentClerkId ? { currentClerkId } : "skip");

    const filteredUsers = users?.filter((u) => {
        return u.name.toLowerCase().includes(searchQuery.toLowerCase());
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
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-2">
                    <Search className="w-8 h-8 text-zinc-600" />
                </div>
                <div className="space-y-1">
                    <p className="text-white font-bold text-sm tracking-tight">No users found</p>
                    <p className="text-zinc-500 text-xs font-medium">Try searching for someone else</p>
                </div>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full flex-1">
            <div className="space-y-3 p-2 pb-40 md:pb-0 custom-scrollbar">
                {filteredUsers?.map((u, i) => (
                    <div
                        key={u._id}
                        onClick={() => onSelectConversation(u._id)}
                        className="sidebar-item group relative hover:bg-white/[0.03]"
                    >
                        <div className="relative">
                            <Avatar className="h-12 w-12 rounded-[1.25rem] border border-white/[0.06] group-hover:border-white/20 transition-all duration-500 shadow-lg">
                                <AvatarImage src={u.avatarUrl} alt={u.name} className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                <AvatarFallback className="bg-zinc-900 text-zinc-500 font-black text-xs uppercase">{u.name[0]}</AvatarFallback>
                            </Avatar>
                            <UserStatus userId={u._id} />
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                            <div className="flex items-center justify-between mb-1 gap-2">
                                <h3 className="text-[14px] font-bold text-zinc-300 group-hover:text-white transition-colors truncate tracking-tight uppercase">
                                    {u.name}
                                </h3>
                                <Zap className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-medium text-zinc-500 truncate tracking-tight">
                                    {u.bio || "No bio yet"}
                                </span>
                            </div>
                        </div>
                        {/* Premium Subtle Glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
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
                </div>
            </div>
        </div>
    );
}
