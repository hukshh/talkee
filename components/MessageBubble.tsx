"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, isToday, isThisYear } from "date-fns";
import { Check, CheckCheck, MoreVertical, Trash2, Reply, Play, Pause, FileText, Download } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LinkPreview } from "./LinkPreview";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

interface MessageBubbleProps {
    message: any;
    isMe: boolean;
    showAvatar?: boolean;
    senderName?: string;
    senderAvatar?: string;
    isFirstInGroup?: boolean;
    isLastInGroup?: boolean;
}

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

export function MessageBubble({ 
    message, 
    isMe, 
    showAvatar, 
    senderName, 
    senderAvatar,
    isFirstInGroup = true,
    isLastInGroup = true
}: MessageBubbleProps) {
    const { user } = useUser();
    const deleteMessage = useMutation(api.messages.deleteMessage);
    const toggleReaction = useMutation(api.messages.toggleReaction);
    const currentUser = useQuery(api.users.getCurrentUser, user?.id ? { currentClerkId: user.id } : "skip");

    const [isPlaying, setIsPlaying] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const handleDelete = async () => {
        try {
            await deleteMessage({ messageId: message._id });
            toast.success("Message deleted");
        } catch (error) {
            toast.error("Failed to delete message");
        }
    };

    const handleReaction = async (emoji: string) => {
        if (!user?.id) return;
        try {
            await toggleReaction({
                messageId: message._id,
                emoji,
                currentClerkId: user.id
            });
        } catch (error) {
            toast.error("Failed to update reaction");
        }
    };

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        return format(date, "h:mm a");
    };

    const toggleAudio = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const updateProgress = () => setAudioProgress((audio.currentTime / audio.duration) * 100);
        const handleEnded = () => { setIsPlaying(false); setAudioProgress(0); };
        audio.addEventListener("timeupdate", updateProgress);
        audio.addEventListener("ended", handleEnded);
        return () => {
            audio.removeEventListener("timeupdate", updateProgress);
            audio.removeEventListener("ended", handleEnded);
        };
    }, [message.audioUrl]);

    const reactions = message.reactions || [];
    const reactionCounts = reactions.reduce((acc: any, r: any) => {
        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
        return acc;
    }, {});

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20,
                duration: 0.4
            }}
            layout
            className={clsx(
                "group flex gap-3 w-full",
                isMe ? "flex-row-reverse" : "flex-row",
                isFirstInGroup ? "mt-8" : "mt-1",
                isLastInGroup ? "mb-2" : "mb-0"
            )}
        >
            {/* Avatar Column */}
            <div className="w-10 shrink-0 flex flex-col justify-end pb-1">
                {showAvatar && !isMe && (
                    <Avatar className="h-10 w-10 rounded-2xl border border-white/[0.08] shadow-2xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-3">
                        <AvatarImage src={senderAvatar} className="object-cover" />
                        <AvatarFallback className="bg-zinc-900 text-zinc-500 font-black text-[10px] uppercase">{senderName?.[0]}</AvatarFallback>
                    </Avatar>
                )}
            </div>

            {/* Content Column */}
            <div className={clsx(
                "flex flex-col max-w-[75%] md:max-w-[70%] min-w-0",
                isMe ? "items-end" : "items-start"
            )}>
                {showAvatar && !isMe && (
                    <span className="text-[10px] font-black text-zinc-600 ml-1 mb-2 tracking-[0.2em] uppercase italic opacity-60">
                        {senderName}
                    </span>
                )}

                <div className="relative group/bubble flex items-center gap-3 max-w-full">
                    <div className={clsx(
                        "relative transition-all duration-500 shadow-2xl min-w-0 overflow-hidden group-hover/bubble:shadow-[0_12px_40px_rgba(0,0,0,0.4)]",
                        isMe
                            ? "bg-white text-black rounded-[2rem] shadow-[0_10px_30px_rgba(255,255,255,0.08)]"
                            : "glass-premium text-zinc-100 rounded-[2rem]",
                        !isFirstInGroup && (isMe ? "rounded-tr-[0.75rem]" : "rounded-tl-[0.75rem]"),
                        !isLastInGroup && (isMe ? "rounded-br-[0.75rem]" : "rounded-bl-[0.75rem]"),
                        message.imageUrl ? "p-1.5" : "px-6 py-4"
                    )}>
                        {/* Hover Highlight Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-700 pointer-events-none" />

                        {message.deleted ? (
                            <p className="text-[13px] italic opacity-40 font-medium px-2 py-1">
                                This message was deleted
                            </p>
                        ) : (
                            <div className="space-y-3 relative z-10">
                                {message.imageUrl && (
                                    <div className="relative rounded-[1.75rem] overflow-hidden border border-white/[0.05] bg-black/40 group/img shadow-inner">
                                        <img 
                                            src={message.imageUrl} 
                                            alt="Media" 
                                            className="max-w-full max-h-[400px] object-contain group-hover/img:scale-[1.03] transition-transform duration-1000 cursor-pointer" 
                                        />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                            <div className="p-3.5 bg-white/10 backdrop-blur-2xl rounded-full border border-white/20 shadow-2xl transform scale-75 group-hover/img:scale-100 transition-transform duration-500">
                                                <Download className="w-5 h-5 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {message.audioUrl && (
                                    <div className="flex items-center gap-5 py-1.5 min-w-[220px] md:min-w-[280px]">
                                        <button 
                                            onClick={toggleAudio}
                                            className={clsx(
                                                "w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all active:scale-90 shadow-xl",
                                                isMe ? "bg-black/5 text-black hover:bg-black/10" : "bg-white/10 text-white hover:bg-white/20"
                                            )}
                                        >
                                            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
                                        </button>
                                        <div className="flex-1 flex flex-col gap-1.5">
                                            <div className="flex items-center gap-3">
                                                <WaveformVisualizer 
                                                    isActive={isPlaying} 
                                                    barCount={24} 
                                                    color={isMe ? "bg-black/40" : "bg-white/40"} 
                                                />
                                            </div>
                                            <div className={clsx("h-1 rounded-full overflow-hidden shadow-inner", isMe ? "bg-black/5" : "bg-white/10")}>
                                                <div 
                                                    className={clsx("h-full transition-all duration-300", isMe ? "bg-black" : "bg-white")}
                                                    style={{ width: `${audioProgress}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center opacity-40">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">Voice Memo</span>
                                                <audio ref={audioRef} src={message.audioUrl} className="hidden" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {message.fileUrl && (
                                    <a 
                                        href={message.fileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={clsx(
                                            "flex items-center gap-5 p-4 rounded-[1.75rem] border transition-all group/file shadow-lg",
                                            isMe ? "bg-black/5 border-black/5 hover:bg-black/10" : "bg-white/5 border-white/5 hover:bg-white/10"
                                        )}
                                    >
                                        <div className="w-12 h-12 bg-black/10 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-black truncate uppercase tracking-tight">Document</p>
                                            <p className="text-[10px] opacity-50 font-bold uppercase tracking-[0.1em]">View File</p>
                                        </div>
                                        <Download className="w-5 h-5 opacity-40 group-hover/file:opacity-100 transition-all group-hover/file:translate-y-0.5" />
                                    </a>
                                )}

                                {message.content && (
                                    <div className="space-y-2">
                                        <p className={clsx(
                                            "text-[15px] md:text-[15.5px] leading-[1.65] tracking-tight whitespace-pre-wrap break-words font-medium",
                                            isMe ? "text-black" : "text-white"
                                        )}>
                                            {message.content}
                                        </p>
                                        {/* Auto Link Detection */}
                                        {message.content.match(/https?:\/\/[^\s]+/g)?.map((url: string, i: number) => (
                                            <LinkPreview key={i} url={url} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className={clsx(
                            "flex items-center gap-2 mt-3 transition-opacity",
                            isMe ? "justify-end text-black/30" : "justify-start text-white/20"
                        )}>
                            <span className="text-[9px] font-black uppercase tracking-widest tabular-nums italic">
                                {formatTimestamp(message.createdAt || message._creationTime)}
                            </span>
                            {isMe && !message.deleted && (
                                <div className="flex items-center">
                                    {message.seen ? (
                                        <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                                    ) : (
                                        <Check className="w-3.5 h-3.5" />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Reaction Pills - Redesigned */}
                        {Object.keys(reactionCounts).length > 0 && !message.deleted && (
                            <div className={clsx(
                                "absolute -bottom-3.5 flex flex-wrap gap-1.5 animate-scale-up",
                                isMe ? "right-6" : "left-6"
                            )}>
                                {Object.entries(reactionCounts).map(([emoji, count]: [string, any]) => (
                                    <div
                                        key={emoji}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] glass-floating border-white/20 shadow-2xl text-white hover:scale-110 transition-transform cursor-pointer active:scale-95"
                                    >
                                        <span className="animate-bounce-subtle">{emoji}</span>
                                        {count > 1 && <span className="text-[10px] font-black">{count}</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Hover Actions - Refined Alignment */}
                    {!message.deleted && (
                        <div className={clsx(
                            "opacity-0 group-hover/bubble:opacity-100 transition-all duration-500 flex items-center gap-1.5 shrink-0 translate-y-1 group-hover/bubble:translate-y-0",
                            isMe ? "flex-row-reverse" : "flex-row"
                        )}>
                            <DropdownMenu>
                                <DropdownMenuTrigger className="p-2.5 glass-premium rounded-2xl text-zinc-500 hover:text-white transition-all outline-none border-white/0 hover:border-white/10 active:scale-90 shadow-xl">
                                    <MoreVertical className="w-4.5 h-4.5" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isMe ? "end" : "start"} className="bg-[#0a0a0a]/95 border-white/[0.08] rounded-[1.5rem] p-2 shadow-[0_25px_60px_rgba(0,0,0,0.6)] min-w-[160px] animate-scale-up backdrop-blur-3xl">
                                    <div className="flex items-center justify-around p-2 mb-2 bg-white/[0.03] rounded-xl border border-white/[0.04]">
                                        {REACTION_EMOJIS.map(emoji => (
                                            <button 
                                                key={emoji} 
                                                onClick={() => handleReaction(emoji)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all text-base hover:scale-125 active:scale-150"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                    <DropdownMenuItem className="rounded-xl px-4 py-3 focus:bg-white/5 cursor-pointer flex items-center justify-between group/item">
                                        <span className="text-[13px] font-black uppercase tracking-wider text-zinc-400 group-hover/item:text-white transition-colors">Reply</span>
                                        <Reply className="w-4 h-4 text-zinc-600 group-hover/item:text-white transition-colors" />
                                    </DropdownMenuItem>
                                    {isMe && (
                                        <DropdownMenuItem
                                            onClick={handleDelete}
                                            className="rounded-xl px-4 py-3 focus:bg-rose-500/10 cursor-pointer flex items-center justify-between group/item text-rose-500/80 hover:text-rose-500"
                                        >
                                            <span className="text-[13px] font-black uppercase tracking-wider">Delete</span>
                                            <Trash2 className="w-4 h-4" />
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
