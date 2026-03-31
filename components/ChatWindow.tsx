"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "./MessageBubble";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ArrowDown } from "lucide-react";

export function ChatWindow({ conversationId }: { conversationId: string }) {
    const { user } = useUser();
    const currentClerkId = user?.id;

    const messages = useQuery(api.messages.getMessages, {
        conversationId: conversationId as any,
    });

    const conversations = useQuery(
        api.conversations.getConversationsForUser,
        currentClerkId ? { currentClerkId } : "skip"
    );

    const conversation = conversations?.find((c) => c._id === conversationId);

    const users = useQuery(api.users.getAllUsers, currentClerkId ? { currentClerkId } : "skip");

    const [newMessage, setNewMessage] = useState("");
    const sendMessage = useMutation(api.messages.sendMessage);
    const markAllAsSeen = useMutation(api.messages.markAllAsSeen);
    const setTyping = useMutation(api.typing.setTyping);
    const typingUsers = useQuery(api.typing.getTypingUsers, {
        conversationId: conversationId as any,
    });

    const scrollRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    useEffect(() => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            if (scrollHeight - scrollTop - clientHeight < 100) {
                scrollToBottom();
            } else {
                setShowScrollButton(true);
            }
        }
    }, [messages]);

    useEffect(() => {
        if (messages && messages.length > 0 && currentClerkId) {
            const hasUnread = messages.some((m) => !m.seen && m.senderId !== currentClerkId);
            // We will just call markAllAsSeen. The backend checks senderId !== currentUser._id
            // but we wait till messages load.
            markAllAsSeen({
                conversationId: conversationId as any,
                currentClerkId,
            });
        }
    }, [messages, currentClerkId, conversationId, markAllAsSeen]);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            setShowScrollButton(false);
        }
    };

    const handleScroll = (e: any) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop - clientHeight < 50) {
            setShowScrollButton(false);
        } else {
            setShowScrollButton(true);
        }
    };

    if (!conversation || !users) return null;

    const otherUser = users.find((u) => conversation.members.includes(u._id));
    if (!otherUser) return null;

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentClerkId) return;

        await sendMessage({
            conversationId: conversationId as any,
            content: newMessage,
            currentClerkId,
        });
        setNewMessage("");
        setTyping({
            conversationId: conversationId as any,
            currentClerkId,
            isTyping: false,
        });
        scrollToBottom();
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        if (!currentClerkId) return;

        setTyping({
            conversationId: conversationId as any,
            currentClerkId,
            isTyping: e.target.value.length > 0,
        });
    };

    const isOtherUserTyping = typingUsers?.some((t) => t.userId === otherUser._id && t.isTyping);

    return (
        <div className="flex-1 flex flex-col h-full bg-white relative">
            <div className="flex items-center gap-3 p-4 border-b shrink-0">
                <img src={otherUser.avatarUrl} alt={otherUser.name} className="w-10 h-10 rounded-full" />
                <div>
                    <h2 className="font-semibold">{otherUser.name}</h2>
                    <PresenceText userId={otherUser._id} isTyping={isOtherUserTyping} />
                </div>
            </div>

            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4"
                style={{ scrollBehavior: "smooth" }}
            >
                {messages?.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-gray-500">
                        Send your first message to {otherUser.name}
                    </div>
                ) : (
                    messages?.map((m) => (
                        <MessageBubble key={m._id} message={m} otherUser={otherUser} />
                    ))
                )}
            </div>

            {showScrollButton && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-blue-600 text-white rounded-full p-2 shadow-lg hover:bg-blue-700 transition"
                >
                    <ArrowDown className="w-4 h-4" />
                </button>
            )}

            <div className="p-4 bg-white border-t shrink-0">
                <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={handleTyping}
                        placeholder="Type a message..."
                        className="flex-1 rounded-full bg-gray-100 border-none focus-visible:ring-1 focus-visible:ring-gray-300 px-4"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={!newMessage.trim()}
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}

function PresenceText({ userId, isTyping }: { userId: any; isTyping?: boolean }) {
    const presence = useQuery(api.presence.getPresence, { userId });

    if (isTyping) {
        return <p className="text-xs text-blue-500 font-medium italic">typing...</p>;
    }

    if (presence && presence.isOnline) {
        return <p className="text-xs text-green-500 font-medium">Online</p>;
    }

    return <p className="text-xs text-gray-400">Offline</p>;
}
