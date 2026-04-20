"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Users, Sparkles } from "lucide-react";
import { useState } from "react";
import { StatusViewer } from "./StatusViewer";
import clsx from "clsx";

export function ConversationList({
    onSelectConversation,
    activeConversationId,
}: {
    onSelectConversation: (convoId: string) => void;
    activeConversationId?: string;
}) {
    const { user } = useUser();
    const currentClerkId = user?.id;

    const conversations = useQuery(
        api.conversations.getConversationsForUser,
        currentClerkId ? { currentClerkId } : "skip"
    );

    if (conversations === undefined) {
        return (
            <div className="space-y-3 p-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <ConversationSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-3">
                <div className="w-16 h-16 glass-darker rounded-[2rem] flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-gray-700" />
                </div>
                <p className="text-gray-500 font-bold italic text-sm tracking-tight">Your inbox is empty. Start a vibe.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full flex-1">
            <div className="space-y-1.5 p-3 pb-40 md:pb-0 custom-scrollbar">
                {conversations.map((c) => (
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
        <div className="flex items-center gap-3 p-4 rounded-2xl glass-silver opacity-50">
            <Skeleton className="h-13 w-13 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-3 min-w-0">
                <div className="flex justify-between items-center gap-4">
                    <Skeleton className="h-5 w-32 rounded-lg" />
                    <Skeleton className="h-3 w-10 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full rounded-lg" />
            </div>
        </div>
    );
}

function ConversationItem({ conversation, isActive, onSelect }: any) {
    return <ConversationUserWrapper conversation={conversation} isActive={isActive} onSelect={onSelect} />;
}

function UserStatus({ userId }: { userId: string }) {
    const presence = useQuery(api.presence.getPresence, { userId: userId as any });
    const isOnline = presence?.isOnline;

    return (
        <div className={clsx(
            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-[#0c0c0c] shadow-2xl transition-all duration-700",
            isOnline ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-zinc-800"
        )}>
            {isOnline && (
                <>
                    <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
                    <div className="absolute -inset-1 rounded-full bg-emerald-500/10 blur-sm" />
                </>
            )}
        </div>
    );
}

function ConversationUserWrapper({ conversation, isActive, onSelect }: any) {
    const { user } = useUser();
    const currentUser = useQuery(api.users.getCurrentUser, user?.id ? { currentClerkId: user.id } : "skip");
    const isGroup = conversation.isGroup;
    const messages = useQuery(api.messages.getMessages, { conversationId: conversation._id });
    
    // Use memberInfo hydrated by getConversationsForUser
    const otherUser = !isGroup && currentUser
        ? conversation.memberInfo?.find((m: any) => m._id !== currentUser._id)
        : null;

    const presence = useQuery(api.presence.getPresence, !isGroup && otherUser ? { userId: otherUser._id as any } : "skip");
    const otherUserStatus = useQuery(api.statuses.getStatusByUserId, otherUser?._id && user?.id ? { userId: otherUser._id as any, currentClerkId: user.id } : "skip");
    const [viewingStatus, setViewingStatus] = useState<any>(null);

    if (messages === undefined || (!isGroup && otherUser === undefined)) return (
        <div className="flex items-center gap-4 p-4 rounded-[2rem] bg-white/5 animate-pulse mb-3">
            <Skeleton className="h-14 w-14 rounded-2xl bg-white/5" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3 bg-white/10 rounded-full" />
                <Skeleton className="h-3 w-1/2 bg-white/5 rounded-full" />
            </div>
        </div>
    );

    if (!isGroup && !otherUser) return null;

    const unreadCount = messages ? messages.filter((m) => !m.seen && (isGroup ? m.senderId !== user?.id : m.senderId === otherUser?._id)).length : 0;
    const isOnline = presence?.isOnline;
    const isAllStatusSeen = currentUser?.lastSeenStatus && otherUserStatus?.items.every((item: any) => item.createdAt <= currentUser.lastSeenStatus!);
    const hasUnreadStatus = otherUserStatus && !isAllStatusSeen;

    return (
        <>
            <div
                onClick={onSelect}
                className={clsx(
                    "group flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all duration-300 active:scale-[0.97] border",
                    isActive
                        ? "glass-silver border-white/[0.12] shadow-lg"
                        : "bg-transparent border-transparent hover:bg-white/[0.03]"
                )}
            >
                <div className="relative">
                    <div
                        className={clsx(
                            "relative p-0.5 rounded-2xl transition-all duration-500",
                            hasUnreadStatus ? "ring-2 ring-emerald-500/70" : ""
                        )}
                        onClick={(e) => {
                            if (otherUserStatus?.items.length) {
                                e.stopPropagation();
                                setViewingStatus(otherUserStatus);
                            }
                        }}
                    >
                        <Avatar className={clsx(
                            "h-13 w-13 rounded-2xl border-2 transition-all duration-300 shadow-lg",
                            isActive ? "border-white/20" : "border-white/[0.05] group-hover:border-white/10"
                        )}>
                            <AvatarImage
                                src={isGroup ? undefined : otherUser?.avatarUrl}
                                alt={isGroup ? conversation.groupName : otherUser?.name}
                                className="object-cover"
                            />
                            <AvatarFallback className={clsx(
                                "rounded-2xl font-bold",
                                isGroup ? "bg-white/[0.06] text-zinc-400" : "bg-zinc-900 text-zinc-500"
                            )}>
                                {isGroup ? <Users className="w-6 h-6" /> : otherUser?.name?.[0] || "?"}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    {!isGroup && otherUser && <UserStatus userId={otherUser._id} />}
                </div>

                <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline mb-1">
                        <p className={clsx(
                            "text-[15px] tracking-tight truncate",
                            isActive ? 'font-bold text-white' : 'font-semibold text-zinc-200 group-hover:text-white'
                        )}>
                            {isGroup ? conversation.groupName : otherUser?.name}
                        </p>
                        <span className="text-[10px] font-medium text-zinc-600 ml-2 shrink-0">
                            {formatDate(conversation.updatedAt)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                        <div className="flex-1 min-w-0">
                            <p className={clsx(
                                "text-[13px] truncate h-5 leading-relaxed transition-colors",
                                unreadCount > 0 ? "text-zinc-200 font-semibold" : "text-zinc-600 font-normal group-hover:text-zinc-500"
                            )}>
                                {isGroup && conversation.lastMessage ? (
                                    <span className="opacity-60">Group Vibe Update</span>
                                ) : (conversation.lastMessage || (isGroup ? "Create legend" : "Start the vibe"))}
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <div className="bg-white text-black text-[10px] font-bold h-5 min-w-[1.25rem] px-1.5 rounded-full flex items-center justify-center shrink-0 shadow-md">
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
    const now = new Date();

    if (
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
    ) {
        return format(date, "HH:mm");
    }

    if (date.getFullYear() === now.getFullYear()) {
        return format(date, "MMM d");
    }

    return format(date, "MMM yyyy");
}

function PresenceIndicator({ userId }: { userId: any }) {
    const presence = useQuery(api.presence.getPresence, { userId });
    if (!presence?.isOnline) return null;
    return (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-background shadow-2xl" />
    );
}
