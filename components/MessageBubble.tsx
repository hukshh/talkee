"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Check, CheckCheck, MoreVertical, Trash2, Reply, Share2, Heart, Sparkles } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import clsx from "clsx";

interface MessageBubbleProps {
    message: any;
    isMe: boolean;
    showAvatar?: boolean;
    senderName?: string;
    senderAvatar?: string;
}

export function MessageBubble({ message, isMe, showAvatar, senderName, senderAvatar }: MessageBubbleProps) {
    const deleteMessage = useMutation(api.messages.deleteMessage);

    const handleDelete = async () => {
        try {
            await deleteMessage({ messageId: message._id });
            toast.success("Message deleted");
        } catch (error) {
            toast.error("Failed to delete message");
        }
    };

    return (
        <div className={clsx(
            "group flex items-end gap-3 px-2 w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
            isMe ? "flex-row-reverse" : "flex-row"
        )}>
            {showAvatar && !isMe && (
                <div className="relative shrink-0 mb-1">
                    <Avatar className="h-10 w-10 border-2 border-white/10 shadow-2xl transition-transform hover:scale-110">
                        <AvatarImage src={senderAvatar} className="object-cover" />
                        <AvatarFallback className="bg-zinc-800 text-white font-black text-xs">{senderName?.[0]}</AvatarFallback>
                    </Avatar>
                </div>
            )}

            <div className={clsx(
                "flex flex-col max-w-[85%] md:max-w-[70%] space-y-1",
                isMe ? "items-end" : "items-start",
                !showAvatar && (isMe ? "mr-13" : "ml-13")
            )}>
                {showAvatar && !isMe && (
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic ml-2 mb-1">
                        {senderName}
                    </span>
                )}

                <div className={clsx(
                    "relative group/bubble flex items-center gap-2",
                    isMe ? "flex-row-reverse" : "flex-row"
                )}>
                    <div className={clsx(
                        "relative px-5 py-3.5 md:px-6 md:py-4 rounded-[1.8rem] md:rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-500 border",
                        isMe
                            ? "glass-silver border-white/20 text-white rounded-br-none shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                            : "glass-darker border-white/5 text-zinc-300 rounded-bl-none"
                    )}>
                        <p className="text-[15px] md:text-base font-bold leading-relaxed tracking-tight selection:bg-white/20 whitespace-pre-wrap break-words italic">
                            {message.content}
                        </p>

                        <div className={clsx(
                            "flex items-center gap-2 mt-2",
                            isMe ? "justify-end" : "justify-start"
                        )}>
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic opacity-60">
                                {format(message._creationTime, "HH:mm")}
                            </span>
                            {isMe && (
                                <div className="text-zinc-600">
                                    {message.seen ? (
                                        <CheckCheck className="w-3.5 h-3.5 text-zinc-300 animate-in fade-in" />
                                    ) : (
                                        <Check className="w-3.5 h-3.5" />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Hover React Actions */}
                        <div className={clsx(
                            "absolute -top-4 opacity-0 group-hover/bubble:opacity-100 transition-all duration-500 flex items-center gap-1 glass-darker px-2 py-1 rounded-full border-white/10 z-10 scale-95 group-hover/bubble:scale-100",
                            isMe ? "right-0" : "left-0"
                        )}>
                            <button className="p-1 hover:bg-white/10 rounded-full transition-all active:scale-75"><Heart className="w-3.5 h-3.5 text-white" /></button>
                            <button className="p-1 hover:bg-white/10 rounded-full transition-all active:scale-75"><Reply className="w-3.5 h-3.5 text-white" /></button>
                            <button className="p-1 hover:bg-white/10 rounded-full transition-all active:scale-75"><MoreVertical className="w-3.5 h-3.5 text-white" /></button>
                        </div>
                    </div>

                    {/* Quick Actions Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <button className="opacity-0 group-hover:opacity-100 p-2 glass rounded-full text-white transition-all hover:bg-white/10 active:scale-90 h-10 w-10 flex items-center justify-center border-white/5">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isMe ? "end" : "start"} className="glass-grey border-white/10 rounded-2xl p-2 min-w-[150px] shadow-2xl">
                            <DropdownMenuItem className="rounded-xl px-4 py-3 focus:bg-white/10 cursor-pointer flex items-center gap-3">
                                <Reply className="w-4 h-4 text-white" />
                                <span className="text-xs font-black text-white uppercase italic tracking-widest">Reply</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl px-4 py-3 focus:bg-white/10 cursor-pointer flex items-center gap-3">
                                <Share2 className="w-4 h-4 text-white" />
                                <span className="text-xs font-black text-white uppercase italic tracking-widest">Forward</span>
                            </DropdownMenuItem>
                            {isMe && (
                                <DropdownMenuItem
                                    onClick={handleDelete}
                                    className="rounded-xl px-4 py-3 focus:bg-rose-500/10 cursor-pointer flex items-center gap-3 text-rose-500"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="text-xs font-black uppercase italic tracking-widest">Delete</span>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}
