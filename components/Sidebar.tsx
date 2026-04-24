"use client";

import { useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { SearchBar } from "./SearchBar";
import { UserList } from "./UserList";
import { ConversationList } from "./ConversationList";
import { MessageSquare, Users, PlusCircle, User as UserIcon, Settings2, Search, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import clsx from "clsx";
import { CreateGroupModal } from "./CreateGroupModal";
import { MobileTab } from "@/context/NavContext";
import { StatusRail } from "./StatusRail";

type Tab = "conversations" | "users";

export function Sidebar({
    activeConversationId,
    onSelectConversation,
    activeMobileTab,
    onMobileTabChange,
    hideOnMobile = false,
}: {
    activeConversationId?: string;
    onSelectConversation: (id: string) => void;
    activeMobileTab?: MobileTab;
    onMobileTabChange?: (tab: MobileTab) => void;
    hideOnMobile?: boolean;
}) {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<Tab>("conversations");
    const [searchQuery, setSearchQuery] = useState("");
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const currentUser = useQuery(api.users.getCurrentUser, user?.id ? { currentClerkId: user.id } : "skip");

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        if (tab === "conversations") {
            if (onMobileTabChange) onMobileTabChange("chats");
            onSelectConversation("");
        } else {
            if (onMobileTabChange) onMobileTabChange("discover");
            onSelectConversation("");
        }
    };

    return (
        <div className={clsx(
            "h-full w-full md:w-[360px] md:static z-50 transition-all duration-500 ease-in-out",
            hideOnMobile ? "hidden md:block" : "block"
        )}>
            <div className="bg-[#080808] h-full border-r border-white/[0.04] flex flex-col overflow-hidden relative">
                {/* Backdrop Subtle Glow */}
                <div className="absolute -left-20 top-0 w-40 h-full bg-blue-500/5 blur-[120px] pointer-events-none" />

                {/* Mobile Header */}
                <div
                    className="flex md:hidden items-center justify-between px-6 py-5 border-b border-white/[0.04] bg-[#080808]/80 backdrop-blur-3xl sticky top-0 z-[60]"
                    style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 glass-premium rounded-2xl flex items-center justify-center border-white/10">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div className="space-y-0.5">
                            <h1 className="text-2xl font-black italic uppercase tracking-tighter leading-none vibe-gradient">
                                Talkee
                            </h1>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.3em] inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Online
                            </p>
                        </div>
                    </div>
                </div>

                {/* Desktop Sidebar Content */}
                <div className="flex flex-col w-full h-full p-0">
                    <div className="hidden md:flex items-center h-24 px-8 mb-2">
                        <div className="flex items-center gap-3 w-full animate-fade-in">
                             <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-8 px-6 pb-12 custom-scrollbar">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
                                    <h2 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.25em] italic">Conversations</h2>
                                </div>
                                <Button
                                    onClick={() => setIsGroupModalOpen(true)}
                                    size="sm"
                                    className="h-8 px-4 rounded-xl glass-premium text-white hover:bg-white hover:text-black font-black text-[9px] uppercase tracking-widest transition-all active:scale-95"
                                >
                                    <PlusCircle className="w-3.5 h-3.5 mr-2" /> Group
                                </Button>
                            </div>

                            <div className="flex gap-1.5 p-1.5 bg-white/[0.02] border border-white/[0.04] rounded-[22px] animate-slide-up shadow-inner" style={{ animationDelay: '200ms' }}>
                                <button
                                    onClick={() => handleTabChange("conversations")}
                                    className={clsx(
                                        "flex-1 py-2.5 rounded-[18px] font-black text-[10px] uppercase tracking-[0.15em] transition-all duration-300",
                                        activeTab === "conversations" ? "bg-white text-black shadow-[0_8px_20px_rgba(255,255,255,0.1)]" : "text-zinc-500 hover:text-white"
                                    )}
                                >
                                    Chats
                                </button>
                                <button
                                    onClick={() => handleTabChange("users")}
                                    className={clsx(
                                        "flex-1 py-2.5 rounded-[18px] font-black text-[10px] uppercase tracking-[0.15em] transition-all duration-300",
                                        activeTab === "users" ? "bg-white text-black shadow-[0_8px_20px_rgba(255,255,255,0.1)]" : "text-zinc-500 hover:text-white"
                                    )}
                                >
                                    Discover
                                </button>
                            </div>

                            <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
                                {activeTab === "conversations" ? (
                                    <div className="space-y-4">
                                        {user?.id && <StatusRail currentClerkId={user.id} />}
                                        <ConversationList
                                            activeConversationId={activeConversationId}
                                            onSelectConversation={onSelectConversation}
                                        />
                                    </div>
                                ) : (
                                    <UserList
                                        searchQuery={searchQuery}
                                        onSelectConversation={(id) => {
                                            onSelectConversation(id);
                                            setActiveTab("conversations");
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                        {/* Mobile Nav Spacer */}
                        <div className="h-32 md:hidden shrink-0" />
                    </div>

                    {/* Bottom Status / Account - Desktop Only */}
                    <div className="hidden md:flex p-6 mt-auto bg-gradient-to-t from-black to-transparent items-center justify-between border-t border-white/[0.03]">
                        <div className="flex items-center gap-3.5 group cursor-pointer" onClick={() => router.push("/profile")}>
                            <div className="w-11 h-11 glass-premium rounded-2xl flex items-center justify-center border-white/5 group-hover:border-white/20 transition-all duration-300">
                                <UserIcon className="w-5.5 h-5.5 text-zinc-500 group-hover:text-white transition-colors" />
                            </div>
                            <div className="transition-all duration-300 group-hover:translate-x-1">
                                <p className="text-xs font-black text-white italic uppercase tracking-wider mb-0.5">Account</p>
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Settings & Bio</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-11 w-11 glass-premium rounded-2xl text-zinc-500 hover:text-white transition-all border-white/0 hover:border-white/10 active:scale-90">
                            <Settings2 className="w-5.5 h-5.5" />
                        </Button>
                    </div>
                </div>
            </div>

            <CreateGroupModal
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                currentClerkId={user?.id || ""}
            />
        </div>
    );
}
