"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { Send, ArrowDown, Video, Smile, Image as ImageIcon, Users as UsersIcon, ChevronLeft, MoreVertical, Sparkles, X } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import clsx from "clsx";
import { UserProfileModal } from "./UserProfileModal";
import { Id } from "@/convex/_generated/dataModel";
import { StatusViewer } from "./StatusViewer";
import { VideoCall } from "./VideoCall";

export function ChatWindow({ conversationId }: { conversationId: string }) {
    const { user } = useUser();
    const [message, setMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const convId = conversationId as Id<"conversations">;

    const messages = useQuery(api.messages.getMessages, { conversationId: convId });
    const conversation = useQuery(api.conversations.getConversationById, { conversationId: convId });
    const sendMessage = useMutation(api.messages.sendMessage);
    const setTyping = useMutation(api.typing.setTyping);

    const currentUser = useQuery(api.users.getCurrentUser, user?.id ? { currentClerkId: user.id } : "skip");
    const typingUsers = useQuery(api.typing.getTypingUsers, { conversationId: convId });
    const markAllAsSeen = useMutation(api.messages.markAllAsSeen);

    // Identify the "Other User ID" from the members array (the ID that isn't the current user's DB ID)
    const otherUserId = conversation?.members?.find((id) => id !== currentUser?._id);

    // Resilient Fetch: Directly fetch the other user's profile from the database
    // This bypasses any issues with memberInfo hydration being out of sync
    const otherUserFetch = useQuery(api.users.getUserById, otherUserId ? { userId: otherUserId } : "skip");

    // Fallback logic for name/avatar/ID
    const otherUser = otherUserFetch || (conversation as any)?.memberInfo?.find((m: any) => m.clerkId !== user?.id) || null;

    const otherUserStatus = useQuery(api.statuses.getStatusByUserId, otherUser?._id && user?.id ? { userId: otherUser._id as any, currentClerkId: user.id } : "skip");
    const [viewingStatus, setViewingStatus] = useState<any>(null);
    const [activeCall, setActiveCall] = useState(false);

    // Mark messages as seen when the conversation is opened or new messages arrive
    useEffect(() => {
        if (user?.id && conversationId) {
            markAllAsSeen({
                conversationId: convId,
                currentClerkId: user.id
            });
        }
    }, [conversationId, messages?.length, user?.id, markAllAsSeen, convId]);

    const isAllStatusSeen = currentUser?.lastSeenStatus && otherUserStatus?.items.every((item: any) => item.createdAt <= currentUser.lastSeenStatus!);
    const hasUnreadStatus = otherUserStatus && !isAllStatusSeen;

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !user || !conversationId) return;

        try {
            await sendMessage({
                conversationId: convId,
                currentClerkId: user.id,
                content: message,
            });
            setMessage("");
            await setTyping({ conversationId: convId, currentClerkId: user.id, isTyping: false });
        } catch (error) {
            toast.error("Failed to send message");
        }
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);
        if (!isTyping && user) {
            setIsTyping(true);
            setTyping({ conversationId: convId, currentClerkId: user.id, isTyping: true });
            setTimeout(() => {
                setIsTyping(false);
                setTyping({ conversationId: convId, currentClerkId: user.id, isTyping: false });
            }, 3000);
        }
    };

    if (!conversation || !user) return (
        <div className="flex-1 flex items-center justify-center bg-background/50 backdrop-blur-3xl">
            <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
        </div>
    );

    const conversationTitle = conversation.isGroup ? (conversation as any).groupName : otherUser?.name;
    const isOnline = !conversation.isGroup && otherUser?.isOnline;

    return (
        <div className="flex flex-col h-full bg-transparent relative overflow-hidden">
            {/* Header */}
            <div
                className="glass-silver h-20 md:h-24 flex items-center justify-between px-4 md:px-6 z-30 border-b border-white/[0.08] mx-2 md:mx-4 mt-2 md:mt-3 rounded-2xl shadow-lg transition-all"
                style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
                <div className="flex items-center gap-2 md:gap-4 flex-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden h-10 w-10 glass rounded-xl text-white mr-1"
                        onClick={() => window.history.back()}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <div className="flex items-center gap-3 md:gap-4 cursor-pointer group flex-1 min-w-0" onClick={() => conversation.isGroup ? setShowMembers(true) : setSelectedUser(otherUser)}>
                        <div className="relative shrink-0" onClick={(e) => { if (!conversation.isGroup && otherUserStatus?.items.length) { e.stopPropagation(); setViewingStatus(otherUserStatus); } }}>
                            <div className={clsx(
                                "p-0.5 rounded-full transition-all duration-700",
                                hasUnreadStatus ? "ring-2 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "ring-0"
                            )}>
                                <Avatar className="h-10 w-10 md:h-11 md:w-11 border-2 border-white/[0.08] group-hover:border-white/20 transition-all shadow-lg">
                                    <AvatarImage src={conversation.isGroup ? undefined : otherUser?.avatarUrl} className="object-cover" />
                                    <AvatarFallback className="bg-zinc-900 text-white font-bold">
                                        {conversation.isGroup ? <UsersIcon className="w-6 h-6" /> : otherUser?.name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            {!conversation.isGroup && (
                                <div className={clsx(
                                    "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[2.5px] border-[#0c0c0c] shadow-2xl transition-all duration-700",
                                    isOnline ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-zinc-800"
                                )}>
                                    {isOnline && <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-base md:text-lg font-bold tracking-tight text-white truncate leading-none mb-1">
                                {conversationTitle}
                            </h2>
                            <div className="flex items-center gap-1.5">
                                <p className={clsx(
                                    "text-[10px] font-medium uppercase tracking-wider truncate",
                                    isOnline ? "text-emerald-500/80" : "text-zinc-500"
                                )}>
                                    {conversation.isGroup ? `${conversation.members?.length} members` : (isOnline ? "Online" : "Offline")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 md:h-11 md:w-11 glass rounded-xl text-zinc-400 hover:text-white border-white/[0.05] shrink-0"
                        onClick={() => {
                            if (!otherUser) {
                                toast.error("Wait for users to load");
                                return;
                            }
                            setActiveCall(true);
                        }}
                    >
                        <Video className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 md:h-11 md:w-11 glass rounded-xl text-zinc-400 hover:text-white border-white/[0.05] shrink-0">
                        <MoreVertical className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 md:px-6 py-6 relative">
                <div className="max-w-5xl mx-auto space-y-6 pb-32 md:pb-40">
                    <div className="flex flex-col items-center justify-center py-20 opacity-10">
                        <Sparkles className="w-16 h-16 text-white mb-4" />
                        <p className="text-xs font-medium uppercase tracking-widest text-white/40 text-center">Beginning of the connection</p>
                    </div>
                    {messages?.map((m, i) => (
                        <MessageBubble
                            key={m._id}
                            message={m}
                            isMe={m.senderId === currentUser?._id}
                            showAvatar={i === 0 || messages[i - 1].senderId !== m.senderId}
                            senderName={(conversation as any).memberInfo?.find((member: any) => member._id === m.senderId)?.name}
                            senderAvatar={(conversation as any).memberInfo?.find((member: any) => member._id === m.senderId)?.avatarUrl}
                        />
                    ))}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Typing Indicator Overlay */}
            {typingUsers && typingUsers.length > 0 && (
                <div className="absolute bottom-36 md:bottom-32 left-6 md:left-12 z-20 animate-in slide-in-from-bottom-4">
                    <div className="glass px-4 py-2 rounded-full flex items-center gap-3 border-white/5 shadow-2xl">
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                        </div>
                        <span className="text-[9px] font-black text-white italic uppercase tracking-widest">
                            {typingUsers.length === 1 ? 'Message forming...' : 'Multiple messages forming...'}
                        </span>
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div
                className="absolute left-0 right-0 bottom-0 z-40 bg-gradient-to-t from-[#080808] via-[#080808]/80 to-transparent p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6 md:pb-6"
            >
                <form onSubmit={handleSend} className="max-w-5xl mx-auto relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-white/0 via-white/10 to-white/0 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
                    <div className="glass-grey flex items-center gap-2 md:gap-3 p-2 md:p-2.5 rounded-2xl border border-white/[0.1] shadow-xl">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 glass rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] border-white/[0.04] transition-all shrink-0"
                        >
                            <Smile className="w-6 h-6" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 glass rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] border-white/[0.04] transition-all shrink-0"
                        >
                            <ImageIcon className="w-6 h-6" />
                        </Button>
                        <input
                            type="text"
                            value={message}
                            onChange={handleTyping}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent border-none text-white placeholder:text-zinc-500 focus:ring-0 px-2 font-medium text-sm md:text-base h-10"
                        />
                        <Button
                            type="submit"
                            disabled={!message.trim()}
                            className={clsx(
                                "h-10 w-10 md:h-12 md:w-12 rounded-xl transition-all duration-300 flex items-center justify-center outline-none border-none",
                                message.trim() ? "bg-white text-black active:scale-90 shadow-lg" : "bg-white/[0.05] text-zinc-500"
                            )}
                        >
                            <Send className={clsx("w-6 h-6 transition-transform", message.trim() && "translate-x-0.5 -translate-y-0.5")} />
                        </Button>
                    </div>
                </form>
            </div>

            {/* Member List Overlay */}
            {showMembers && (
                <div className="absolute inset-0 z-[100] glass-grey backdrop-blur-3xl animate-in fade-in duration-500">
                    <div className="h-full flex flex-col p-10">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Squad List</h2>
                            <Button onClick={() => setShowMembers(false)} variant="ghost" size="icon" className="h-14 w-14 glass rounded-2xl text-white">
                                <X className="w-6 h-6" />
                            </Button>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {conversation.memberInfo?.map(u => (
                                    <div
                                        key={u._id}
                                        className="glass-darker p-6 rounded-[2.5rem] border-white/5 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-all group"
                                        onClick={() => { setSelectedUser(u); setShowMembers(false); }}
                                    >
                                        <Avatar className="h-16 w-16 border-2 border-white/10 group-hover:border-white/30 transition-all shadow-2xl">
                                            <AvatarImage src={u.avatarUrl} className="object-cover" />
                                            <AvatarFallback>{u.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-xl font-black text-white italic tracking-tight">{u.name}</p>
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{u.gender}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            )}

            {selectedUser && (
                <UserProfileModal
                    user={selectedUser}
                    currentUser={currentUser}
                    isOpen={!!selectedUser}
                    onClose={() => setSelectedUser(null)}
                />
            )}

            {viewingStatus && (
                <StatusViewer
                    user={viewingStatus}
                    currentClerkId={user?.id || ""}
                    onClose={() => setViewingStatus(null)}
                />
            )}

            {activeCall && otherUser && (
                <VideoCall
                    isCaller={true}
                    receiverId={otherUser._id}
                    onClose={() => setActiveCall(false)}
                />
            )}
        </div>
    );
}

function PresenceIndicator({ userId }: { userId: any }) {
    const presence = useQuery(api.presence.getPresence, { userId });
    if (!presence?.isOnline) return null;
    return (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-[3px] border-zinc-950 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
    );
}
