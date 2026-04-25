"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Bell, Check, X } from "lucide-react";
import { Button } from "./ui/button";

export function NotificationsPanel({ onSelectUser }: { onSelectUser: (id: string) => void }) {
    const { user } = useUser();
    const currentClerkId = user?.id;

    const [isOpen, setIsOpen] = useState(false);
    const pendingLikes = useQuery(api.matches.getPendingLikes, currentClerkId ? { currentClerkId } : "skip");
    const swipeMutation = useMutation(api.matches.swipe);
    const createConversation = useMutation(api.conversations.createConversation);

    const handleAction = async (swipedId: string, action: "like" | "pass") => {
        if (!currentClerkId) return;

        // Process the swipe
        await swipeMutation({ currentClerkId, swipedId: swipedId as any, action });

        // If accepted, immediately create conversation and select the chat
        if (action === "like") {
            const convoId = await createConversation({ currentClerkId, otherUserId: swipedId as any });
            setIsOpen(false);
            onSelectUser(convoId as string);
        }
    };

    const count = pendingLikes?.length || 0;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-gray-800 transition"
            >
                <Bell className="w-5 h-5" />
                {count > 0 && (
                    <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white">
                        {count}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/20 md:bg-transparent" onClick={() => setIsOpen(false)} />
                    <div className="fixed inset-x-0 bottom-0 md:absolute md:inset-auto md:top-12 md:-left-20 w-full md:w-80 bg-white rounded-t-2xl md:rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden transform transition-all max-h-[70vh] md:max-h-none">
                        <div className="flex items-center justify-between p-3 border-b bg-gray-50/50">
                            <span className="font-bold text-sm text-gray-800">New Connections</span>
                            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{count} pending</span>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {count === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center">
                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                        <Bell className="w-6 h-6 text-gray-300" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-600">You're caught up!</p>
                                    <p className="text-xs text-gray-400 mt-1">No new matches right now.</p>
                                </div>
                            ) : (
                                pendingLikes?.map(profile => (
                                    <div key={profile._id} className="flex flex-col gap-3 p-4 border-b last:border-0 hover:bg-gray-50/50 transition">
                                        <div className="flex items-center gap-3">
                                            {profile.avatarUrl ? (
                                                <img src={profile.avatarUrl} alt="avatar" className="w-12 h-12 rounded-full object-cover shadow-sm" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold">{profile.name[0]}</div>
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">{profile.name}</p>
                                                <p className="text-xs text-gray-500 truncate">Liked your profile</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleAction(profile._id, "pass")}
                                                className="flex-1 h-9 bg-gray-100/50 hover:bg-gray-200 text-gray-600 border border-gray-200/50"
                                            >
                                                <X className="w-4 h-4 mr-1" /> Pass
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleAction(profile._id, "like")}
                                                className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
                                            >
                                                <Check className="w-4 h-4 mr-1" /> Match
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
