"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export function UserList({
    searchQuery,
    onSelectConversation,
}: {
    searchQuery: string;
    onSelectConversation: (convoId: string) => void;
}) {
    const { user } = useUser();
    const currentClerkId = user?.id;

    const users = useQuery(api.matches.getMatches, currentClerkId ? { currentClerkId } : "skip");
    const createConversation = useMutation(api.conversations.createConversation);

    if (users === undefined) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
            </div>
        );
    }

    const filteredUsers = users.filter((u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleUserClick = async (otherUserId: any) => {
        if (!currentClerkId) return;
        const convoId = await createConversation({
            otherUserId,
            currentClerkId,
        });
        onSelectConversation(convoId as string);
    };

    if (filteredUsers.length === 0) {
        return <div className="text-sm text-gray-500 text-center py-4">No users found</div>;
    }

    return (
        <ScrollArea className="h-full flex-1">
            <div className="space-y-1 pr-4">
                {filteredUsers.map((u) => (
                    <div
                        key={u._id}
                        onClick={() => handleUserClick(u._id)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                        <div className="relative">
                            <Avatar>
                                <AvatarImage src={u.avatarUrl} alt={u.name} />
                                <AvatarFallback>{u.name[0]}</AvatarFallback>
                            </Avatar>
                            <PresenceIndicator userId={u._id} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{u.name}</p>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}

function PresenceIndicator({ userId }: { userId: any }) {
    const presence = useQuery(api.presence.getPresence, { userId });
    if (!presence?.isOnline) return null;
    return (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
    );
}
