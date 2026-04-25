"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useRef, useEffect, useMemo } from "react";
import { Send, ArrowDown, Video, Phone, Smile, Paperclip, Mic, ChevronLeft, MoreVertical, X, MessageSquare, Loader2, Users as UsersIcon, PlusCircle, Search, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import clsx from "clsx";
import { UserProfileModal, ProfileView } from "./UserProfileModal";
import { Id } from "@/convex/_generated/dataModel";
import { StatusViewer } from "./StatusViewer";
import { VideoCall } from "./VideoCall";
import { Skeleton } from "./ui/skeleton";
import { EmojiPicker } from "./EmojiPicker";
import { AudioRecorder } from "./AudioRecorder";
import { format } from "date-fns";

export function ChatWindow({ conversationId, onBack, onSelectConversation }: { conversationId: string; onBack?: () => void; onSelectConversation?: (id: string) => void }) {
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
    const addMember = useMutation(api.conversations.addMember);
    const removeMember = useMutation(api.conversations.removeMember);
    const allUsers = useQuery(api.users.getAllUsers, user?.id ? { currentClerkId: user.id } : "skip");

    const [isAddingMember, setIsAddingMember] = useState(false);
    const [memberSearchQuery, setMemberSearchQuery] = useState("");

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
                <div className="max-w-7xl mx-auto h-full px-6 md:px-12 flex items-center justify-between">
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
                        </div>
                        <div className="w-px h-8 bg-white/[0.05] mx-1 hidden md:block" />
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-12 w-12 glass-premium text-zinc-500 hover:text-white hover:bg-white/5 transition-all rounded-2xl border-white/[0.04]"
                            onClick={() => setShowMembers(true)}
                        >
                            <MoreVertical className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Chat Area - Layered & Centered */}
            <div className="flex-1 relative overflow-hidden flex flex-col min-h-0 bg-transparent">
                <div 
                    className="flex-1 overflow-y-auto custom-scrollbar" 
                    onScroll={handleScroll}
                >
                    <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 space-y-4 min-h-full flex flex-col">
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
                </div>

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
                <div className="max-w-7xl mx-auto px-6 md:px-12 relative">
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
                <div className="absolute inset-0 z-[200] bg-[#0a0a0a]/98 backdrop-blur-3xl animate-in fade-in duration-300">
                    <div className="h-full flex flex-col p-8 md:p-12">
                        {conversation.isGroup ? (
                            <>
                                <div className="flex items-center justify-between mb-12">
                                    <div>
                                        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">
                                            {isAddingMember ? "Add Member" : "Group Management"}
                                        </h2>
                                        <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest italic mt-2">
                                            {isAddingMember ? "Expand the circle" : `${conversation.memberInfo?.length || 0} Members Synchronized`}
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        {!isAddingMember && (
                                            <Button 
                                                onClick={() => setIsAddingMember(true)} 
                                                className="h-14 px-8 bg-white text-black hover:bg-zinc-200 font-black text-[11px] uppercase tracking-[0.2em] transition-all rounded-2xl shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95"
                                            >
                                                <PlusCircle className="w-5 h-5 mr-3" /> Add Member
                                            </Button>
                                        )}
                                        <Button 
                                            onClick={() => {
                                                if (isAddingMember) setIsAddingMember(false);
                                                else setShowMembers(false);
                                            }} 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-14 w-14 rounded-2xl text-white hover:bg-white/10 glass-premium"
                                        >
                                            <X className="w-7 h-7" />
                                        </Button>
                                    </div>
                                </div>

                                {isAddingMember ? (
                                    <div className="flex flex-col h-full overflow-hidden space-y-8">
                                        <div className="relative">
                                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                            <input 
                                                type="text"
                                                placeholder="Search users to invite..."
                                                value={memberSearchQuery}
                                                onChange={(e) => setMemberSearchQuery(e.target.value)}
                                                className="w-full h-16 pl-16 pr-8 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder:text-zinc-700 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all font-bold text-lg text-white"
                                            />
                                        </div>
                                        <ScrollArea className="flex-1">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {allUsers?.filter(u => 
                                                    !conversation.members.includes(u._id) && 
                                                    u.name.toLowerCase().includes(memberSearchQuery.toLowerCase())
                                                ).map(u => (
                                                    <div
                                                        key={u._id}
                                                        className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between group hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500"
                                                    >
                                                        <div className="flex items-center gap-5">
                                                            <Avatar className="h-14 w-14 rounded-2xl border border-white/10 group-hover:border-white/20 transition-all shadow-xl">
                                                                <AvatarImage src={u.avatarUrl} className="object-cover" />
                                                                <AvatarFallback className="bg-zinc-900 text-zinc-500 font-bold">{u.name[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="min-w-0">
                                                                <p className="text-[15px] font-black text-white truncate uppercase italic">{u.name}</p>
                                                                <span className="text-[10px] text-zinc-600 truncate block font-bold uppercase tracking-widest mt-0.5">Available for frequency</span>
                                                            </div>
                                                        </div>
                                                        <Button 
                                                            size="sm" 
                                                            className="h-10 px-5 bg-white text-black hover:bg-emerald-500 hover:text-white transition-all rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-90"
                                                            onClick={async () => {
                                                                try {
                                                                    await addMember({ conversationId: convId, userId: u._id });
                                                                    toast.success(`${u.name} initialized in group`);
                                                                } catch (e) {
                                                                    toast.error("Handshake failed");
                                                                }
                                                            }}
                                                        >
                                                            Add
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                ) : (
                                    <ScrollArea className="flex-1">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {conversation.memberInfo?.map(u => (
                                                <div
                                                    key={u._id}
                                                    className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between group hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500"
                                                >
                                                    <div 
                                                        className="flex items-center gap-5 cursor-pointer"
                                                        onClick={() => { setSelectedUser(u); setShowMembers(false); }}
                                                    >
                                                        <div className="relative">
                                                            <Avatar className="h-14 w-14 rounded-2xl border border-white/10 group-hover:border-white/20 transition-all shadow-xl">
                                                                <AvatarImage src={u.avatarUrl} className="object-cover" />
                                                                <AvatarFallback className="bg-zinc-900 text-zinc-500 font-bold">{u.name?.[0] || '?'}</AvatarFallback>
                                                            </Avatar>
                                                            {u.isOnline && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-black shadow-lg" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[15px] font-black text-white truncate uppercase italic">{u.name} {u._id === currentUser?._id && <span className="text-blue-500 ml-1">(Self)</span>}</p>
                                                            <span className="text-[10px] text-zinc-600 truncate block font-bold uppercase tracking-widest mt-0.5">{u.bio || 'Frequency Active'}</span>
                                                        </div>
                                                    </div>
                                                    {u._id !== currentUser?._id && (
                                                        <Button 
                                                            variant="ghost"
                                                            className="h-10 px-4 text-red-500/70 border border-red-500/10 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(239,68,68,0.05)]"
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                try {
                                                                    await removeMember({ conversationId: convId, userId: u._id });
                                                                    toast.success(`${u.name} disconnected`);
                                                                } catch (err) {
                                                                    toast.error("Disconnection failed");
                                                                }
                                                            }}
                                                        >
                                                            Remove
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center space-y-12 max-w-2xl mx-auto text-center">
                                <div className="space-y-4">
                                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">Chat Controls</h2>
                                    <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[11px]">Manage your connection with {otherUser?.name}</p>
                                </div>
                                
                                <div className="grid grid-cols-1 w-full gap-4">
                                    <Button 
                                        className="h-20 bg-white text-black hover:bg-red-500 hover:text-white font-black text-sm uppercase tracking-[0.2em] transition-all rounded-3xl shadow-2xl flex items-center justify-center gap-4"
                                        onClick={() => {
                                            toast.error("Block feature pending backend integration");
                                            setShowMembers(false);
                                        }}
                                    >
                                        <ShieldCheck className="w-6 h-6" /> Block User
                                    </Button>
                                    <Button 
                                        variant="ghost"
                                        className="h-20 bg-white/[0.03] border border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white font-black text-sm uppercase tracking-[0.2em] transition-all rounded-3xl flex items-center justify-center gap-4"
                                        onClick={() => {
                                            toast.error("Chat deletion pending backend integration");
                                            setShowMembers(false);
                                        }}
                                    >
                                        <X className="w-6 h-6" /> Delete Conversation
                                    </Button>
                                    <Button 
                                        variant="ghost"
                                        className="h-16 text-zinc-600 hover:text-white transition-all font-black uppercase tracking-widest text-[10px]"
                                        onClick={() => setShowMembers(false)}
                                    >
                                        Return to Frequency
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {selectedUser && (
                <div className="absolute inset-0 z-[300] bg-[#050505] animate-in slide-in-from-bottom-10 duration-700">
                    <button 
                        onClick={() => setSelectedUser(null)}
                        className="absolute top-8 left-8 z-[310] h-12 px-6 glass-floating rounded-2xl text-white hover:bg-white hover:text-black transition-all border border-white/20 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest italic shadow-2xl"
                    >
                        <ChevronLeft className="w-5 h-5" /> Exit Profile
                    </button>
                    <ScrollArea className="h-full">
                        <ProfileView 
                            user={selectedUser} 
                            currentUser={currentUser} 
                            isStandalone={true} 
                            onClose={() => setSelectedUser(null)} 
                            onSelectConversation={onSelectConversation}
                        />
                    </ScrollArea>
                </div>
            )}
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

