"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { StatusViewer } from "./StatusViewer";
import clsx from "clsx";

export function StatusRail({ currentClerkId }: { currentClerkId: string }) {
    const statuses = useQuery(api.statuses.getStatuses, { currentClerkId });
    const currentUser = useQuery(api.users.getCurrentUser, { currentClerkId });
    const [viewingUser, setViewingUser] = useState<any>(null);
    const [forceCreate, setForceCreate] = useState(false);

    if (!statuses) return null;

    const myStatuses = statuses.find(s => s.userId.toString() === currentUser?._id?.toString());
    const otherStatuses = statuses.filter(s => s.userId !== currentUser?._id);

    return (
        <div className="flex items-center gap-4 py-2 overflow-x-auto scrollbar-hide bg-transparent">
            {/* My Status */}
            <div className="flex flex-col items-center gap-2.5 flex-shrink-0 cursor-pointer group">
                <div className="relative">
                    <div
                        className="p-0.5 rounded-[1.25rem] ring-2 ring-white/10 group-hover:ring-white/30 transition-all duration-500 shadow-xl"
                        onClick={() => {
                            setForceCreate(false);
                            setViewingUser(myStatuses || { userId: currentUser?._id, user: currentUser, items: Array.isArray(myStatuses?.items) ? myStatuses.items : [] });
                        }}
                    >
                        <img
                            src={currentUser?.avatarUrl}
                            className="w-12 h-12 rounded-[1.1rem] object-cover bg-zinc-900 border border-white/5"
                            alt="My Vibe"
                        />
                    </div>
                    <div
                        className="absolute -bottom-1 -right-1 bg-white text-black rounded-lg p-1 border-2 border-[#080808] shadow-2xl group-hover:scale-110 transition-transform cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            setForceCreate(true);
                            setViewingUser({ userId: currentUser?._id, user: currentUser, items: [] });
                        }}
                    >
                        <Plus className="w-3 h-3 stroke-[3]" />
                    </div>
                </div>
                <span className="text-[8px] font-black text-zinc-600 group-hover:text-zinc-400 uppercase tracking-widest italic transition-colors">You</span>
            </div>

            {/* Other Statuses */}
            {otherStatuses.map((s) => {
                const isAllSeen = currentUser?.lastSeenStatus && s.items.every((item: any) => item.createdAt <= currentUser.lastSeenStatus!);

                return (
                    <div
                        key={s.userId}
                        className="flex flex-col items-center gap-2.5 flex-shrink-0 cursor-pointer group"
                        onClick={() => setViewingUser(s)}
                    >
                        <div className={clsx(
                            "relative p-0.5 rounded-[1.25rem] ring-2 transition-all duration-700 shadow-xl",
                            isAllSeen
                                ? "ring-white/5 group-hover:ring-white/20"
                                : "ring-blue-500 group-hover:ring-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                        )}>
                            <div className="p-0.5 bg-[#080808] rounded-[1.1rem]">
                                <img
                                    src={s.user.avatarUrl}
                                    className="w-12 h-12 rounded-[1rem] object-cover bg-zinc-900 shadow-inner"
                                    alt={s.user.name}
                                />
                            </div>
                            {!isAllSeen && (
                                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-[#080808] animate-pulse" />
                            )}
                        </div>
                        <span className="text-[8px] font-black text-zinc-600 group-hover:text-zinc-400 uppercase tracking-widest italic truncate w-14 text-center transition-colors">
                            {s.user.name.split(' ')[0]}
                        </span>
                    </div>
                );
            })}

            {viewingUser && (
                <StatusViewer
                    user={viewingUser}
                    currentClerkId={currentClerkId}
                    forceCreate={forceCreate}
                    onClose={() => {
                        setViewingUser(null);
                        setForceCreate(false);
                    }}
                />
            )}
        </div>
    );
}
