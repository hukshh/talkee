"use client";

import { MessageSquare, Search, Coins, User as UserIcon } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter, usePathname } from "next/navigation";
import clsx from "clsx";
import { MobileTab } from "@/context/NavContext";
import { UserButton, useUser } from "@clerk/nextjs";

export function MobileNavbar({
    activeTab,
    onTabChange,
}: {
    activeTab: MobileTab;
    onTabChange: (tab: MobileTab) => void;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { isSignedIn } = useUser();

    const handleTabClick = (tab: MobileTab) => {
        onTabChange(tab);
        if (pathname !== "/") {
            router.push("/");
        }
    };

    return (
        <div className="fixed inset-x-0 bottom-0 z-[100] md:hidden px-5 pb-[env(safe-area-inset-bottom,16px)] pt-3 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-transparent pointer-events-none">
            <div className="max-w-sm mx-auto h-16 rounded-2xl bg-[#0e0e0e]/90 backdrop-blur-2xl flex items-center justify-around px-3 border border-white/[0.06] shadow-xl pointer-events-auto transition-all duration-500">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleTabClick("chats")}
                    className={clsx(
                        "rounded-xl h-11 w-11 transition-all duration-300 relative group",
                        activeTab === "chats" && pathname === "/" ? "text-white" : "text-zinc-600 hover:text-zinc-400"
                    )}
                >
                    <MessageSquare className="w-5 h-5 transition-transform group-active:scale-75" />
                    {activeTab === "chats" && pathname === "/" && (
                        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full" />
                    )}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleTabClick("discover")}
                    className={clsx(
                        "rounded-xl h-11 w-11 transition-all duration-300 relative group",
                        activeTab === "discover" && pathname === "/" ? "text-white" : "text-zinc-600 hover:text-zinc-400"
                    )}
                >
                    <Search className="w-5 h-5 transition-transform group-active:scale-75" />
                    {activeTab === "discover" && pathname === "/" && (
                        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full" />
                    )}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleTabClick("wallet")}
                    className={clsx(
                        "rounded-xl h-11 w-11 transition-all duration-300 relative group",
                        activeTab === "wallet" && pathname === "/" ? "text-white" : "text-zinc-600 hover:text-zinc-400"
                    )}
                >
                    <Coins className="w-5 h-5 transition-transform group-active:scale-75" />
                    {activeTab === "wallet" && pathname === "/" && (
                        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full" />
                    )}
                </Button>

                <div className={clsx(
                    "flex items-center justify-center rounded-xl h-11 w-11 transition-all duration-300 relative group",
                    pathname === "/profile" ? "" : "grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                )}>
                    {isSignedIn ? (
                        <div className="relative group-active:scale-90 transition-transform duration-300">
                            <UserButton
                                appearance={{
                                    elements: {
                                        avatarBox: "w-9 h-9 rounded-[1rem] border-2 border-white/10 shadow-2xl group-hover:border-white/30 transition-all",
                                        userButtonPopoverCard: "glass-darker border-white/10",
                                        userButtonTrigger: "focus:ring-0"
                                    }
                                }}
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-[3px] border-[#0c0c0c] shadow-2xl z-10" />
                            {pathname === "/profile" && (
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white] animate-pulse" />
                            )}
                        </div>
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push("/profile")}
                        >
                            <UserIcon className="w-5 h-5 text-zinc-600" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
