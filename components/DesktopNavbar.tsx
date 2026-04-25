"use client";

import { MessageSquare, Search, Coins, Sparkles, User as UserIcon, Settings2, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter, usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { useNav, MobileTab } from "@/context/NavContext";
import clsx from "clsx";

export function DesktopNavbar({ onTabChange }: { onTabChange?: (tab: MobileTab) => void }) {
    const { activeTab, setActiveTab, setShowLanding } = useNav();
    const router = useRouter();
    const pathname = usePathname();
    const { user, isSignedIn } = useUser();

    const handleTabClick = (tab: MobileTab) => {
        if (onTabChange) {
            onTabChange(tab);
        } else {
            setActiveTab(tab);
        }
        setShowLanding(false);
        if (pathname !== "/") {
            router.push("/");
        }
    };

    return (
        <div className="hidden md:flex flex-col w-[80px] h-screen bg-[#050505] border-r border-white/5 shadow-2xl items-center py-10 justify-between shrink-0 z-50">
            <div className="flex flex-col items-center gap-10">
                {/* Logo / Sparkle */}
                <div className="relative group cursor-pointer" onClick={() => setShowLanding(true)}>
                    <div className="absolute -inset-4 bg-white/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-14 h-14 glass-silver rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl transition-transform group-hover:scale-110 duration-500">
                        <Sparkles className="w-7 h-7 text-white" />
                    </div>
                </div>

                {/* Nav Items */}
                <div className="flex flex-col gap-6">
                    <NavItem
                        icon={<MessageSquare className="w-6 h-6" />}
                        label="Messages"
                        isActive={activeTab === "chats"}
                        onClick={() => handleTabClick("chats")}
                    />
                    <NavItem
                        icon={<Search className="w-6 h-6" />}
                        label="Discover"
                        isActive={activeTab === "discover"}
                        onClick={() => handleTabClick("discover")}
                    />
                </div>
            </div>

            <div className="flex flex-col items-center gap-6">
                {/* Profile / User */}
                <div className="relative group p-1 transition-all duration-500">
                    <div className={clsx(
                        "absolute -inset-1 rounded-2xl blur-md bg-white/0 group-hover:bg-white/10 transition-all",
                        pathname === "/profile" && "bg-white/20 blur-lg"
                    )} />
                    {isSignedIn ? (
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: "w-12 h-12 rounded-2xl border-2 border-white/10 group-hover:border-white/30 transition-all shadow-2xl"
                                }
                            }}
                        />
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-12 h-12 glass rounded-2xl text-zinc-400 hover:text-white transition-colors"
                            onClick={() => router.push("/login")}
                        >
                            <UserIcon className="w-6 h-6" />
                        </Button>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-[#0c0c0c] shadow-2xl z-10" />
                </div>
            </div>
        </div>
    );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void }) {
    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            title={label}
            className={clsx(
                "relative w-14 h-14 rounded-2xl transition-all duration-500 group",
                isActive
                    ? "glass-silver text-white shadow-2xl scale-110 border-white/20"
                    : "text-zinc-500 hover:text-white hover:bg-white/5 border-transparent"
            )}
        >
            {isActive && (
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-full shadow-[0_0_15px_white] animate-in slide-in-from-left duration-500" />
            )}
            <div className="transition-transform group-active:scale-75 duration-200">
                {icon}
            </div>
        </Button>
    );
}
