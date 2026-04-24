"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useRef, useEffect, useMemo } from "react";
import { Send, ArrowDown, Video, Phone, Smile, Paperclip, Mic, ChevronLeft, MoreVertical, X, MessageSquare, Loader2, Users as UsersIcon } from "lucide-react";
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
import { Skeleton } from "./ui/skeleton";
import { EmojiPicker } from "./EmojiPicker";
import { AudioRecorder } from "./AudioRecorder";
import { format } from "date-fns";

export function ChatWindow({ conversationId, onBack }: { conversationId: string; onBack?: () => void }) {
    const { user } = useUser();
    const [message, setMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastMessageRef = useRef<string | null>(null);

    const convId = conversationId as Id<"conversations">;

    const messages = useQuery(api.messages.getMessages, { conversationId: convId });
    const conversation = useQuery(api.conversations.getConversationById, { conversationId: convId });
    const sendMessageMutation = useMutation(api.messages.sendMessage);
    const setTyping = useMutation(api.typing.setTyping);
    const generateUploadUrl = useMutation(api.users.generateUploadUrl);

    const currentUser = useQuery(api.users.getCurrentUser, user?.id ? { currentClerkId: user.id } : "skip");
    const typingUsers = useQuery(api.typing.getTypingUsers, { conversationId: convId });
    const markAllAsSeen = useMutation(api.messages.markAllAsSeen);

    const otherUserId = conversation?.members?.find((id) => id !== currentUser?._id);
    const otherUserFetch = useQuery(api.users.getUserById, otherUserId ? { userId: otherUserId } : "skip");
    const otherUser = otherUserFetch || (conversation as any)?.memberInfo?.find((m: any) => m.clerkId !== user?.id) || null;
    
    const [viewingStatus, setViewingStatus] = useState<any>(null);
    const [activeCall, setActiveCall] = useState(false);

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior });
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
        setShowScrollButton(!isNearBottom);
    };

    useEffect(() => {
        if (messages && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg._id !== lastMessageRef.current) {
                lastMessageRef.current = lastMsg._id;
                const isMe = lastMsg.senderId === currentUser?._id;
                if (!showScrollButton || isMe) {
                    setTimeout(() => scrollToBottom("smooth"), 50);
                }
            }
        }
    }, [messages, currentUser?._id, showScrollButton]);

    useEffect(() => {
        if (user?.id && conversationId) {
            markAllAsSeen({
                conversationId: convId,
                currentClerkId: user.id
            });
        }
    }, [conversationId, messages?.length, user?.id, markAllAsSeen, convId]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!message.trim() || !user || !conversationId || isSending) return;

        setIsSending(true);
        try {
            await sendMessageMutation({
                conversationId: convId,
                currentClerkId: user.id,
                content: message,
            });
            setMessage("");
            await setTyping({ conversationId: convId, currentClerkId: user.id, isTyping: false });
        } catch (error) {
            toast.error("Failed to send message.");
        } finally {
            setIsSending(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploadingMedia(true);
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();

            const isImage = file.type.startsWith("image/");
            await sendMessageMutation({
                conversationId: convId,
                currentClerkId: user.id,
                content: "",
                [isImage ? "imageUrl" : "fileUrl"]: storageId,
                attachmentType: isImage ? "image" : "file",
            });
        } catch (error) {
            toast.error("Upload failed.");
        } finally {
            setUploadingMedia(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleVoiceSend = async (blob: Blob) => {
        if (!user) return;
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": "audio/webm" },
            body: blob,
        });
        const { storageId } = await result.json();

        await sendMessageMutation({
            conversationId: convId,
            currentClerkId: user.id,
            content: "",
            audioUrl: storageId,
            attachmentType: "audio",
        });
        setIsRecording(false);
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);
        if (!isTyping && user) {
            setIsTyping(true);
            setTyping({ conversationId: convId, currentClerkId: user.id, isTyping: true });
            setTimeout(() => {
                setIsTyping(false);
                setTyping({ conversationId: convId, currentClerkId: user.id, isTyping: false });
            }, 2000);
        }
    };

    // Message Grouping Logic with Date Separators
    const groupedMessages = useMemo(() => {
        if (!messages) return [];
        const groups: any[] = [];
        let lastDate = "";

        messages.forEach((m, i) => {
            const date = format(new Date(m.createdAt || m._creationTime), "MMMM d, yyyy");
            if (date !== lastDate) {
                groups.push({ type: "date", date, id: `date-${m._creationTime}` });
                lastDate = date;
            }

            const prev = messages[i - 1];
            const next = messages[i + 1];
            const isFirstInGroup = !prev || prev.senderId !== m.senderId || (m.createdAt - prev.createdAt > 300000) || (format(new Date(prev.createdAt), "MMMM d, yyyy") !== date);
            const isLastInGroup = !next || next.senderId !== m.senderId || (next.createdAt - m.createdAt > 300000) || (format(new Date(next.createdAt), "MMMM d, yyyy") !== date);
            
            groups.push({ ...m, type: "message", isFirstInGroup, isLastInGroup });
        });
        return groups;
    }, [messages]);

    if (!conversation || !user || messages === undefined) return <ChatLoadingState />;

    const conversationTitle = conversation.isGroup ? (conversation as any).groupName : otherUser?.name;
    const isOnline = !conversation.isGroup && otherUser?.isOnline;
    const typingText = typingUsers && typingUsers.length > 0 
        ? (typingUsers.length === 1 ? `${typingUsers[0].userName} is typing...` : 'Multiple people typing...')
        : null;

    return (
        <div className="flex flex-col h-full bg-textured relative overflow-hidden">
            {/* Top Bar - Floating Premium */}
            <div className="h-[80px] border-b border-white/[0.03] bg-[#080808]/60 backdrop-blur-3xl z-50 shrink-0 sticky top-0">
                <div className="max-w-3xl mx-auto h-full px-10 flex items-center justify-between">
                    <div className="flex items-center gap-6 min-w-0">
                        {onBack && (
                            <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 glass-premium text-white shrink-0" onClick={onBack}>
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                        )}
                        <div 
                            className="flex items-center gap-4 cursor-pointer group min-w-0" 
                            onClick={() => conversation.isGroup ? setShowMembers(true) : setSelectedUser(otherUser)}
                        >
                            <div className="relative">
                                <Avatar className="h-12 w-12 rounded-[1.25rem] border border-white/[0.1] shadow-xl group-hover:border-white/20 transition-all duration-500">
                                    <AvatarImage src={conversation.isGroup ? undefined : otherUser?.avatarUrl} className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <AvatarFallback className="bg-zinc-900 text-zinc-500 font-black text-xs uppercase">
                                        {conversation.isGroup ? <UsersIcon className="w-5 h-5" /> : otherUser?.name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                {!conversation.isGroup && (
                                    <div className={clsx(
                                        "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-[3px] border-[#080808] transition-all duration-700 shadow-lg",
                                        isOnline ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-zinc-700"
                                    )} />
                                )}
                            </div>
                            <div className="min-w-0 flex flex-col py-0.5">
                                <h2 className="text-[16px] font-black text-white truncate leading-tight tracking-tighter uppercase italic group-hover:vibe-gradient transition-all">
                                    {conversationTitle}
                                </h2>
                                <div className="flex items-center gap-2 h-4">
                                    {typingText ? (
                                        <span className="text-[10px] font-bold text-blue-500 animate-pulse tracking-wide uppercase">{typingText}</span>
                                    ) : (
                                        <span className={clsx(
                                            "text-[10px] font-bold uppercase tracking-[0.25em] transition-colors",
                                            isOnline ? "text-emerald-500/80" : "text-zinc-600"
                                        )}>
                                            {isOnline ? "Active" : "Offline"}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center glass-premium rounded-2xl p-1 border-white/[0.04]">
                            <Button variant="ghost" size="icon" className="h-11 w-11 text-zinc-500 hover:text-white hover:bg-white/5 transition-all rounded-xl" onClick={() => setActiveCall(true)}>
                                <Video className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-11 w-11 text-zinc-500 hover:text-white hover:bg-white/5 transition-all rounded-xl">
                                <Phone className="w-4.5 h-4.5" />
                            </Button>
                        </div>
                        <div className="w-px h-8 bg-white/[0.05] mx-1 hidden md:block" />
                        <Button variant="ghost" size="icon" className="h-12 w-12 glass-premium text-zinc-500 hover:text-white hover:bg-white/5 transition-all rounded-2xl border-white/[0.04]">
                            <MoreVertical className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Chat Area - Layered & Centered */}
            <div className="flex-1 relative overflow-hidden flex flex-col min-h-0 bg-transparent">
                <ScrollArea className="flex-1" onScroll={handleScroll}>
                    <div className="max-w-3xl mx-auto px-10 py-16 space-y-4 min-h-full flex flex-col">
                        {groupedMessages.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-40 text-center animate-fade-in">
                                <div className="w-24 h-24 glass-premium rounded-[3rem] flex items-center justify-center border-white/[0.05] mb-10 shadow-2xl">
                                    <MessageSquare className="w-12 h-12 text-zinc-700" />
                                </div>
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">No <span className="text-zinc-600">Messages</span></h3>
                                <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em] italic">Start the premium conversation</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {groupedMessages.map((item, i) => (
                                    item.type === "date" ? (
                                        <div key={item.id} className="flex items-center justify-center my-12 animate-fade-in first:mt-0">
                                            <div className="px-5 py-2 rounded-full glass-premium border-white/[0.05] text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 italic">
                                                {item.date}
                                            </div>
                                        </div>
                                    ) : (
                                        <MessageBubble
                                            key={item._id}
                                            message={item}
                                            isMe={item.senderId === currentUser?._id}
                                            showAvatar={!conversation.isGroup ? false : (item.isFirstInGroup && item.senderId !== currentUser?._id)}
                                            senderName={item.sender?.name}
                                            senderAvatar={item.sender?.avatarUrl}
                                            isFirstInGroup={item.isFirstInGroup}
                                            isLastInGroup={item.isLastInGroup}
                                        />
                                    )
                                ))}
                            </div>
                        )}
                        <div ref={scrollRef} className="h-12 shrink-0" />
                    </div>
                </ScrollArea>

                {showScrollButton && (
                    <button
                        onClick={() => scrollToBottom()}
                        className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50 glass-floating text-white px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.6)] animate-bounce-subtle transition-all hover:scale-105 active:scale-95 border border-white/20"
                    >
                        <ArrowDown className="w-4 h-4" />
                        New Messages
                    </button>
                )}
            </div>

            {/* Input Bar - Advanced Floating Glassmorphism */}
            <div className="py-10 bg-transparent relative z-50">
                <div className="max-w-3xl mx-auto px-10 relative">
                    {isRecording ? (
                        <div className="glass-floating rounded-[2.5rem] p-4 animate-scale-up border-white/20 shadow-2xl">
                            <AudioRecorder onSend={handleVoiceSend} onCancel={() => setIsRecording(false)} />
                        </div>
                    ) : (
                        <form onSubmit={handleSend} className="flex items-center gap-5 relative group/form">
                            {showEmojiPicker && (
                                <div className="absolute bottom-full mb-8 left-0 animate-scale-up z-[100]">
                                    <EmojiPicker onSelect={(emoji) => setMessage(prev => prev + emoji)} onClose={() => setShowEmojiPicker(false)} />
                                </div>
                            )}
                            
                            <div className="flex-1 flex items-center gap-2.5 px-6 py-4 glass-floating rounded-[2.5rem] border-white/[0.1] focus-within:border-white/30 focus-within:shadow-[0_0_50px_rgba(255,255,255,0.08)] transition-all duration-700 shadow-2xl relative overflow-hidden group/input">
                                {/* Focus Pulse Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/[0.04] to-blue-500/0 opacity-0 group-focus-within/form:opacity-100 transition-opacity duration-1000 pointer-events-none animate-pulse" />

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="h-12 w-12 text-zinc-600 hover:text-white transition-all shrink-0 rounded-full hover:bg-white/5 active:scale-90"
                                >
                                    <Smile className="w-6.5 h-6.5" />
                                </Button>
                                
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleUpload}
                                    className="hidden"
                                    accept="image/*,application/pdf,.doc,.docx,.txt"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingMedia}
                                    className="h-12 w-12 text-zinc-600 hover:text-white transition-all shrink-0 rounded-full hover:bg-white/5 active:scale-90"
                                >
                                    {uploadingMedia ? <Loader2 className="w-6.5 h-6.5 animate-spin" /> : <Paperclip className="w-6.5 h-6.5" />}
                                </Button>

                                <input
                                    type="text"
                                    value={message}
                                    onChange={handleTyping}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-transparent border-none text-white placeholder:text-zinc-800 focus:ring-0 px-4 text-[16px] h-12 font-medium"
                                />

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsRecording(true)}
                                    className="h-12 w-12 text-zinc-600 hover:text-white transition-all shrink-0 rounded-full hover:bg-white/5 active:scale-90"
                                >
                                    <Mic className="w-6.5 h-6.5" />
                                </Button>
                            </div>

                            <Button
                                type="submit"
                                disabled={!message.trim() || isSending}
                                className={clsx(
                                    "h-20 w-20 rounded-[2.5rem] transition-all duration-700 flex items-center justify-center shadow-2xl active:scale-90 shrink-0 border border-white/10",
                                    message.trim() && !isSending 
                                        ? "bg-white text-black hover:scale-105 hover:shadow-[0_20px_50px_rgba(255,255,255,0.25)] hover:-translate-y-1" 
                                        : "bg-[#0c0c0c] text-zinc-800"
                                )}
                            >
                                {isSending ? <Loader2 className="w-8 h-8 animate-spin" /> : <Send className="w-8 h-8 translate-x-0.5" />}
                            </Button>
                        </form>
                    )}
                </div>
            </div>

            {/* Overlays */}
            {showMembers && (
                <div className="absolute inset-0 z-[200] bg-[#0a0a0a]/98 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="h-full flex flex-col p-12">
                        <div className="flex items-center justify-between mb-12">
                            <h2 className="text-3xl font-bold text-white tracking-tight">Group Members</h2>
                            <Button onClick={() => setShowMembers(false)} variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-white hover:bg-white/10">
                                <X className="w-6 h-6" />
                            </Button>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {conversation.memberInfo?.map(u => (
                                    <div
                                        key={u._id}
                                        className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center gap-4 cursor-pointer hover:bg-white/[0.05] transition-all group"
                                        onClick={() => { setSelectedUser(u); setShowMembers(false); }}
                                    >
                                        <Avatar className="h-14 w-14 rounded-xl border border-white/10 group-hover:border-white/20 transition-all shadow-md">
                                            <AvatarImage src={u.avatarUrl} className="object-cover" />
                                            <AvatarFallback className="bg-zinc-900 text-zinc-500 font-bold text-xl">{u.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-lg font-bold text-white truncate">{u.name}</p>
                                            <span className="text-xs text-zinc-500 truncate block">{u.bio || 'Available'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            )}

            {selectedUser && <UserProfileModal user={selectedUser} currentUser={currentUser} isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} />}
            {viewingStatus && <StatusViewer user={viewingStatus} currentClerkId={user?.id || ""} onClose={() => setViewingStatus(null)} />}
            {activeCall && otherUser && <VideoCall isCaller={true} receiverId={otherUser._id} onClose={() => setActiveCall(false)} />}
        </div>
    );
}

function ChatLoadingState() {
    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] space-y-0">
            <div className="h-[72px] border-b border-white/[0.05] flex items-center px-6">
                <Skeleton className="h-10 w-10 rounded-xl bg-white/[0.03]" />
                <div className="ml-4 space-y-2">
                    <Skeleton className="h-4 w-32 rounded bg-white/[0.03]" />
                    <Skeleton className="h-3 w-16 rounded bg-white/[0.03]" />
                </div>
            </div>
            <div className="flex-1 p-8 space-y-8">
                <div className="flex gap-4"><Skeleton className="h-12 w-48 rounded-2xl bg-white/[0.03]" /></div>
                <div className="flex flex-row-reverse gap-4"><Skeleton className="h-10 w-32 rounded-2xl bg-white/[0.03]" /></div>
                <div className="flex gap-4"><Skeleton className="h-20 w-64 rounded-2xl bg-white/[0.03]" /></div>
            </div>
            <div className="p-6 border-t border-white/[0.05]">
                <Skeleton className="h-12 w-full rounded-2xl bg-white/[0.03]" />
            </div>
        </div>
    );
}

