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
            "group flex items-end gap-2 px-1 w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
            isMe ? "flex-row-reverse" : "flex-row"
        )}>
            {showAvatar && !isMe && (
                <div className="relative shrink-0 mb-0.5">
                    <Avatar className="h-8 w-8 border border-white/[0.08] shadow-lg transition-transform hover:scale-105">
                        <AvatarImage src={senderAvatar} className="object-cover" />
                        <AvatarFallback className="bg-zinc-800 text-white font-medium text-xs">{senderName?.[0]}</AvatarFallback>
                    </Avatar>
                </div>
            )}

            <div className={clsx(
                "flex flex-col max-w-[85%] md:max-w-[70%] space-y-1",
                isMe ? "items-end" : "items-start",
                !showAvatar && (isMe ? "mr-13" : "ml-13")
            )}>
                {showAvatar && !isMe && (
                    <span className="text-[10px] font-medium text-zinc-500 ml-2 mb-0.5">
                        {senderName}
                    </span>
                )}

                <div className={clsx(
                    "relative group/bubble flex items-center gap-2",
                    isMe ? "flex-row-reverse" : "flex-row"
                )}>
                    <div className={clsx(
                        "relative px-4 py-3 md:px-5 md:py-3.5 rounded-2xl shadow-md transition-all duration-300 border",
                        isMe
                            ? "glass-silver border-white/[0.1] text-white rounded-br-sm"
                            : "glass-darker border-white/[0.04] text-zinc-300 rounded-bl-sm"
                    )}>
                        <p className="text-[14px] md:text-[15px] font-normal leading-relaxed tracking-tight whitespace-pre-wrap break-words">
                            {message.content}
                        </p>

                        <div className={clsx(
                            "flex items-center gap-1.5 mt-1.5 transition-all duration-500",
                            isMe ? "justify-end" : "justify-start"
                        )}>
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight opacity-60 group-hover/bubble:opacity-100 transition-opacity">
                                {format(message._creationTime, "HH:mm")}
                            </span>
                            {isMe && (
                                <div className="flex items-center">
                                    {message.seen ? (
                                        <div className="relative">
                                            <CheckCheck className="w-3.5 h-3.5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)] animate-in zoom-in duration-300" />
                                        </div>
                                    ) : (
                                        <Check className="w-3.5 h-3.5 text-zinc-500 opacity-60" />
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
                        <DropdownMenuTrigger asChild>
                            <button className="opacity-0 group-hover:opacity-100 p-2 glass rounded-full text-white transition-all hover:bg-white/10 active:scale-90 h-10 w-10 flex items-center justify-center border-white/5 outline-none border-none">
                                <MoreVertical className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
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
