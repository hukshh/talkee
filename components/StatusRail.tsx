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

    const myStatuses = statuses.find(s => s.userId === currentUser?._id);
    const otherStatuses = statuses.filter(s => s.userId !== currentUser?._id);

    return (
        <div className="flex items-center gap-6 py-6 px-4 overflow-x-auto scrollbar-hide border-b border-white/5 bg-transparent">
            {/* My Status */}
            <div
                className="flex flex-col items-center gap-3 flex-shrink-0 cursor-pointer group"
                onClick={() => setViewingUser(myStatuses || { userId: currentUser?._id, user: currentUser, items: [] })}
            >
                <div className="relative">
                    <div
                        className="p-0.5 rounded-[1.8rem] ring-2 ring-white/10 group-hover:ring-white/30 transition-all duration-500 shadow-2xl"
                        onClick={() => {
                            setForceCreate(false);
                            setViewingUser(myStatuses || { userId: currentUser?._id, user: currentUser, items: [] });
                        }}
                    >
                        <img
                            src={currentUser?.avatarUrl}
                            className="w-16 h-16 rounded-[1.6rem] object-cover bg-zinc-900 border-2 border-[#0c0c0c]"
                            alt="My Vibe"
                        />
                    </div>
                    <div
                        className="absolute -bottom-1 -right-1 bg-white text-black rounded-xl p-1.5 border-2 border-[#0c0c0c] shadow-2xl group-hover:scale-110 transition-transform cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            setForceCreate(true);
                            setViewingUser({ userId: currentUser?._id, user: currentUser, items: [] });
                        }}
                    >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                </div>
                <span className="text-[9px] font-black text-zinc-500 group-hover:text-white uppercase tracking-widest italic transition-colors">My Vibe</span>
            </div>

            {/* Other Statuses */}
            {otherStatuses.map((s) => {
                const isAllSeen = currentUser?.lastSeenStatus && s.items.every((item: any) => item.createdAt <= currentUser.lastSeenStatus!);

                return (
                    <div
                        key={s.userId}
                        className="flex flex-col items-center gap-3 flex-shrink-0 cursor-pointer group"
                        onClick={() => setViewingUser(s)}
                    >
                        <div className={clsx(
                            "relative p-1 rounded-[1.8rem] ring-2 transition-all duration-700 shadow-2xl",
                            isAllSeen
                                ? "ring-white/5 group-hover:ring-white/20"
                                : "ring-emerald-500 group-hover:ring-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                        )}>
                            <div className="p-0.5 bg-[#0c0c0c] rounded-[1.6rem]">
                                <img
                                    src={s.user.avatarUrl}
                                    className="w-16 h-16 rounded-[1.4rem] object-cover bg-zinc-900 shadow-inner"
                                    alt={s.user.name}
                                />
                            </div>
                            {!isAllSeen && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0c0c0c] animate-pulse" />
                            )}
                        </div>
                        <span className="text-[9px] font-black text-zinc-500 group-hover:text-white uppercase tracking-widest italic truncate w-20 text-center transition-colors">
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
