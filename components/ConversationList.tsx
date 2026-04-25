"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, isThisYear } from "date-fns";
import { Users, MessageSquare } from "lucide-react";
import { useState } from "react";
import { StatusViewer } from "./StatusViewer";
import clsx from "clsx";

export function ConversationList({
    onSelectConversation,
    activeConversationId,
    searchQuery = "",
}: {
    onSelectConversation: (convoId: string) => void;
    activeConversationId?: string;
    searchQuery?: string;
}) {
    const { user } = useUser();
    const currentClerkId = user?.id;

    const conversations = useQuery(
        api.conversations.getConversationsForUser,
        currentClerkId ? { currentClerkId } : "skip"
    );

    if (conversations === undefined) {
        return (
            <div className="space-y-1 p-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <ConversationSkeleton key={i} />
                ))}
            </div>
        );
    }

    const filteredConversations = conversations.filter((c) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        if (c.isGroup) {
            return c.groupName?.toLowerCase().includes(query);
        }
        return c.memberInfo?.some((m: any) => 
            m.clerkId !== user?.id && m.name?.toLowerCase().includes(query)
        );
    });

    if (filteredConversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4">
                <div className="w-16 h-16 glass-darker rounded-2xl flex items-center justify-center border border-white/5 shadow-2xl">
                    <MessageSquare className="w-8 h-8 text-zinc-700" />
                </div>
                <div className="space-y-1">
                    <p className="text-white font-bold text-sm tracking-tight">No results found</p>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest italic">Try searching for something else</p>
                </div>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full flex-1">
            <div className="space-y-0.5 p-2 pb-40 md:pb-0 custom-scrollbar">
                {filteredConversations.map((c) => (
                    <ConversationItem
                        key={c._id}
                        conversation={c}
                        isActive={c._id === activeConversationId}
                        onSelect={() => onSelectConversation(c._id)}
                    />
                ))}
            </div>
        </ScrollArea>
    );
}

function ConversationSkeleton() {
    return (
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] opacity-50">
            <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
                <div className="flex justify-between items-center gap-4">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-3 w-8 rounded-md" />
                </div>
                <Skeleton className="h-3.5 w-full rounded-md" />
            </div>
        </div>
    );
}

function ConversationItem({ conversation, isActive, onSelect }: any) {
    const { user } = useUser();
    const currentUser = useQuery(api.users.getCurrentUser, user?.id ? { currentClerkId: user.id } : "skip");
    const isGroup = conversation.isGroup;
    
    const otherUser = !isGroup && currentUser
        ? conversation.memberInfo?.find((m: any) => m.clerkId !== user?.id)
        : null;

    const otherUserStatus = useQuery(api.statuses.getStatusByUserId, otherUser?._id && user?.id ? { userId: otherUser._id as any, currentClerkId: user.id } : "skip");
    const [viewingStatus, setViewingStatus] = useState<any>(null);

    const isOnline = !isGroup && otherUser?.isOnline;
    const hasUnreadStatus = otherUserStatus && otherUserStatus.items.length > 0;
    const unreadCount = (conversation as any).unreadCount || 0;

    return (
        <>
            <div
                onClick={onSelect}
                className={clsx(
                    "sidebar-item group relative hover:bg-white/[0.03]"
                )}
            >
                {/* Active Indicator Glow */}
                {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                )}

                <div className="relative shrink-0">
                    <div
                        className={clsx(
                            "relative p-0.5 rounded-2xl transition-all duration-500",
                            hasUnreadStatus ? "ring-2 ring-blue-500/30" : ""
                        )}
                        onClick={(e) => {
                            if (otherUserStatus?.items.length) {
                                e.stopPropagation();
                                setViewingStatus(otherUserStatus);
                            }
                        }}
                    >
                        <Avatar className={clsx(
                            "h-12 w-12 rounded-[1.25rem] border transition-all duration-500 shadow-lg",
                            isActive ? "border-white/20" : "border-white/[0.06] group-hover:border-white/20"
                        )}>
                            <AvatarImage
                                src={isGroup ? undefined : otherUser?.avatarUrl}
                                alt={isGroup ? conversation.groupName : otherUser?.name}
                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <AvatarFallback className={clsx(
                                "rounded-[1.25rem] font-black text-xs uppercase",
                                isGroup ? "bg-zinc-800 text-zinc-400" : "bg-zinc-900 text-zinc-500"
                            )}>
                                {isGroup ? <Users className="w-5 h-5" /> : otherUser?.name?.[0] || "?"}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    {!isGroup && otherUser && (
                        <div className={clsx(
                            "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-[2.5px] border-[#080808] transition-all duration-700 shadow-xl",
                            isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-zinc-700"
                        )} />
                    )}
                </div>

                <div className="flex-1 overflow-hidden min-w-0 py-0.5">
                    <div className="flex justify-between items-center mb-1">
                        <p className={clsx(
                            "text-[14px] truncate leading-tight tracking-tight",
                            unreadCount > 0 ? "font-black text-white" : "font-bold text-zinc-300 group-hover:text-white transition-colors"
                        )}>
                            {isGroup ? `${conversation.groupName}` : otherUser?.name}
                        </p>
                        <span className="text-[9px] font-bold text-zinc-500 shrink-0 tabular-nums uppercase tracking-widest ml-2">
                            {formatDate(conversation.updatedAt)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                        <p className={clsx(
                            "text-[11.5px] truncate leading-relaxed transition-colors flex-1 tracking-tight",
                            unreadCount > 0 ? "text-white font-medium" : "text-zinc-500 font-medium group-hover:text-zinc-400"
                        )}>
                            {conversation.lastMessage || (isGroup ? "Create group" : "Start chatting")}
                        </p>
                        {unreadCount > 0 && (
                            <div className="bg-blue-600 text-white text-[9px] font-black h-4 min-w-[1rem] px-1 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/30 animate-scale-up">
                                {unreadCount}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {viewingStatus && (
                <StatusViewer
                    user={viewingStatus}
                    currentClerkId={user?.id || ""}
                    onClose={() => setViewingStatus(null)}
                />
            )}
        </>
    );
}

function formatDate(timestamp: number) {
    const date = new Date(timestamp);
    if (isToday(date)) return format(date, "h:mm a");
    if (isThisYear(date)) return format(date, "MMM d");
    return format(date, "MMM yyyy");
}
