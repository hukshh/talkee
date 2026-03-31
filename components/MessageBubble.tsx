"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2 } from "lucide-react";
import { format } from "date-fns";
import clsx from "clsx";

export function MessageBubble({ message, otherUser }: any) {
    const { user } = useUser();
    const deleteMessage = useMutation(api.messages.deleteMessage);

    const isMe = message.senderId !== otherUser._id;

    const handleDelete = () => {
        deleteMessage({ messageId: message._id });
    };

    return (
        <div
            className={clsx(
                "flex w-full mt-2 space-x-3 max-w-xl",
                isMe ? "ml-auto justify-end" : "mr-auto justify-start"
            )}
        >
            {!isMe && (
                <img
                    src={otherUser.avatarUrl}
                    alt={otherUser.name}
                    className="w-8 h-8 rounded-full"
                />
            )}
            <div>
                <div
                    className={clsx(
                        "p-3 rounded-2xl relative group",
                        isMe
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : "bg-gray-100 text-gray-900 rounded-tl-none",
                        message.deleted && "italic opacity-70"
                    )}
                >
                    <p className="text-sm">{message.content}</p>

                    {isMe && !message.deleted && (
                        <div className="absolute top-1 -left-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                                <DropdownMenuTrigger>
                                    <MoreVertical className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={handleDelete} className="text-red-500">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>
                <span className="text-[10px] text-gray-500 mt-1 block">
                    {formatMessageTime(message.createdAt)}
                </span>
            </div>
        </div>
    );
}

function formatMessageTime(timestamp: number) {
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
