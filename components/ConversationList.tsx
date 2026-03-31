"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

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
            <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
            </div>
        );
    }

    if (conversations.length === 0) {
        return <div className="text-sm text-gray-500 text-center py-4">Start a conversation</div>;
    }

    return (
        <ScrollArea className="h-full flex-1">
            <div className="space-y-1 pr-4">
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

function ConversationItem({ conversation, isActive, onSelect }: any) {
    const { user } = useUser();
    const clerkUser = user;

    // Find the other user in the conversation
    const otherUserId = conversation.members.find(
        (id: any) => id !== clerkUser?.id // Wait, clerk user id is string, db user ID is custom. 
        // We need the other user's full details. Better to create a React component that fetches the other user's details.
    );

    // Note: we'll fetch the other user.
    // We can just rely on the fact we need to find the other user's _id.
    return <ConversationUserWrapper conversation={conversation} isActive={isActive} onSelect={onSelect} />;
}

function ConversationUserWrapper({ conversation, isActive, onSelect }: any) {
    const { user } = useUser();
    const users = useQuery(api.users.getAllUsers, user?.id ? { currentClerkId: user.id } : "skip");
    const messages = useQuery(api.messages.getMessages, { conversationId: conversation._id });

    if (!users) return <Skeleton className="h-16 w-full rounded-lg mb-1" />;

    const otherUser = users.find((u) => conversation.members.includes(u._id));

    if (!otherUser) return null;

    const unreadCount = messages ? messages.filter((m) => !m.seen && m.senderId === otherUser._id).length : 0;

    return (
        <div
            onClick={onSelect}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isActive ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
        >
            <Avatar className="h-12 w-12">
                <AvatarImage src={otherUser.avatarUrl} alt={otherUser.name} />
                <AvatarFallback>{otherUser.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-semibold truncate">{otherUser.name}</p>
                    <span className="text-xs text-gray-400">
                        {formatDate(conversation.updatedAt)}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500 truncate h-4 pr-2 flex-1">
                        {conversation.lastMessage || "Started a conversation"}
                    </p>
                    {unreadCount > 0 && (
                        <Badge variant="default" className="bg-blue-600 rounded-full shrink-0">
                            {unreadCount}
                        </Badge>
                    )}
                </div>
            </div>
        </div>
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
        return format(date, "h:mm a");
    }

    if (date.getFullYear() === now.getFullYear()) {
        return format(date, "MMM d, h:mm a");
    }

    return format(date, "MMM d, yyyy, h:mm a");
}
