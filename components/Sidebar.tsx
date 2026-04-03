"use client";

import { useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { SearchBar } from "./SearchBar";
import { UserList } from "./UserList";
import { ConversationList } from "./ConversationList";
import { NotificationsPanel } from "./NotificationsPanel";
import { MessageSquare, Users, Coins, PlusCircle, Cake, User as UserIcon, Settings2, Search, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import clsx from "clsx";
import { CreateGroupModal } from "./CreateGroupModal";
import { MobileTab } from "@/context/NavContext";
import { StatusRail } from "./StatusRail";

type Tab = "conversations" | "users" | "wallet";

export function Sidebar({
    activeConversationId,
    onSelectConversation,
    onSelectWallet,
    activeMobileTab,
    onMobileTabChange,
    hideOnMobile = false,
}: {
    activeConversationId?: string;
    onSelectConversation: (id: string) => void;
    onSelectWallet: () => void;
    activeMobileTab?: MobileTab;
    onMobileTabChange?: (tab: MobileTab) => void;
    hideOnMobile?: boolean;
}) {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<Tab>("conversations");
    const [searchQuery, setSearchQuery] = useState("");
    const [genderFilter, setGenderFilter] = useState("all");
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const birthdayData = useQuery(api.users.checkMyBirthday, user?.id ? { currentClerkId: user.id } : "skip");

    useEffect(() => {
        if (birthdayData) {
            const message = birthdayData.gender === "female"
                ? `Happy Birthday Beautiful ${birthdayData.name}! Wishing you a day full of love and magic! ❄️✨`
                : birthdayData.gender === "male"
                    ? `Happy Birthday Handsome ${birthdayData.name}! Hope you find your perfect match today! ❄️💎`
                    : `Happy Birthday ${birthdayData.name}! Have a fantastic day! 🌌`;

            toast.custom((t) => (
                <div className="glass-grey p-6 rounded-[2.5rem] border border-white/10 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
                    <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center">
                        <Cake className="w-6 h-6 text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                    </div>
                    <div>
                        <p className="text-white font-black italic uppercase tracking-tighter text-lg">Birthday Vibe!</p>
                        <p className="text-zinc-500 font-bold text-xs leading-tight mt-0.5">{message}</p>
                    </div>
                </div>
            ), { duration: 10000 });
        }
    }, [birthdayData]);

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        if (tab === "wallet") {
            onSelectWallet();
            if (onMobileTabChange) onMobileTabChange("wallet");
        } else if (tab === "conversations") {
            if (onMobileTabChange) onMobileTabChange("chats");
            onSelectConversation("");
        } else {
            // For 'users' tab which is desktop discover
            onSelectConversation("");
        }
    };

    return (
        <div className={clsx(
            "h-full w-full md:w-[400px] md:static z-50",
            hideOnMobile ? "hidden md:block" : "block"
        )}>
            <div className="glass-grey h-full md:h-[calc(100vh-2rem)] rounded-none md:rounded-[2.5rem] md:m-4 flex flex-col overflow-hidden shadow-xl">
                {/* Mobile Social Header */}
                <div
                    className="flex md:hidden items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[#080808]/80 backdrop-blur-2xl sticky top-0 z-[60]"
                    style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 glass-silver rounded-xl flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div className="space-y-0">
                            <h1 className="text-2xl font-black italic uppercase tracking-tighter leading-none vibe-gradient">
                                Vibe Mingle
                            </h1>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.3em] inline-flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Online
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <NotificationsPanel onSelectUser={onSelectConversation} />
                    </div>
                </div>

                {/* Desktop Sidebar Content (Optimized for both) */}
                <div className="flex flex-col w-full h-full p-4 md:p-6 space-y-4 md:space-y-6">
                    <div className="hidden md:flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 glass-silver rounded-xl flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                Vibe <span className="text-zinc-500">Mingle</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <NotificationsPanel onSelectUser={onSelectConversation} />
                            <UserButton appearance={{ elements: { avatarBox: "w-11 h-11 rounded-2xl border-2 border-white/10 hover:border-white/30 transition-all shadow-xl" } }} />
                        </div>
                    </div>

                    <div className="relative group">
                        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse" />
                                    <h2 className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em] italic">Active Vibes</h2>
                                </div>
                                <Button
                                    onClick={() => setIsGroupModalOpen(true)}
                                    size="sm"
                                    className="h-9 px-4 rounded-xl bg-white/5 text-white border border-white/10 hover:bg-white hover:text-black font-black text-[10px] uppercase tracking-widest transition-all shadow-2xl"
                                >
                                    <PlusCircle className="w-3.5 h-3.5 mr-2" /> Group
                                </Button>
                            </div>

                            <div className="hidden gap-2 p-1 glass-darker rounded-2xl border border-white/5">
                                <button
                                    onClick={() => handleTabChange("conversations")}
                                    className={clsx(
                                        "flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all",
                                        activeTab === "conversations" ? "bg-white text-black shadow-xl" : "text-zinc-500 hover:text-white"
                                    )}
                                >
                                    Conversations
                                </button>
                                <button
                                    onClick={() => handleTabChange("users")}
                                    className={clsx(
                                        "flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all",
                                        activeTab === "users" ? "bg-white text-black shadow-xl" : "text-zinc-500 hover:text-white"
                                    )}
                                >
                                    Discover
                                </button>
                            </div>

                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {activeTab === "conversations" ? (
                                    <>
                                        {user?.id && <StatusRail currentClerkId={user.id} />}
                                        <ConversationList
                                            activeConversationId={activeConversationId}
                                            onSelectConversation={onSelectConversation}
                                        />
                                    </>
                                ) : (
                                    <UserList
                                        searchQuery={searchQuery}
                                        genderFilter={genderFilter}
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
                    <div className="hidden md:flex pt-4 border-t border-white/[0.04] items-center justify-between px-1">
                        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push("/profile")}>
                            <div className="w-10 h-10 glass rounded-xl flex items-center justify-center border border-white/5 group-hover:border-white/30 transition-all">
                                <UserIcon className="w-5 h-5 text-zinc-600 group-hover:text-white transition-all" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-white italic uppercase tracking-wider">Profile</p>
                                <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">Settings</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-10 w-10 glass rounded-xl text-zinc-700 border-white/5 hover:text-white">
                            <Settings2 className="w-5 h-5" />
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
