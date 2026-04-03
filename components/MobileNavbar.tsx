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
        <div className="fixed inset-x-0 bottom-0 z-[100] md:hidden px-6 pb-[env(safe-area-inset-bottom,20px)] pt-4 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none">
            <div className="max-w-md mx-auto h-18 rounded-[2.5rem] bg-[#0c0c0c]/80 backdrop-blur-[40px] flex items-center justify-around px-4 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] pointer-events-auto transition-all duration-700">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleTabClick("chats")}
                    className={clsx(
                        "rounded-[1.2rem] h-12 w-12 transition-all duration-500 relative group",
                        activeTab === "chats" && pathname === "/" ? "text-white scale-110" : "text-zinc-600 hover:text-zinc-400"
                    )}
                >
                    <MessageSquare className="w-5 h-5 transition-transform group-active:scale-75" />
                    {activeTab === "chats" && pathname === "/" && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white] animate-pulse" />
                    )}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleTabClick("discover")}
                    className={clsx(
                        "rounded-[1.2rem] h-12 w-12 transition-all duration-500 relative group",
                        activeTab === "discover" && pathname === "/" ? "text-white scale-110" : "text-zinc-600 hover:text-zinc-400"
                    )}
                >
                    <Search className="w-5 h-5 transition-transform group-active:scale-75" />
                    {activeTab === "discover" && pathname === "/" && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white] animate-pulse" />
                    )}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleTabClick("wallet")}
                    className={clsx(
                        "rounded-[1.2rem] h-12 w-12 transition-all duration-500 relative group",
                        activeTab === "wallet" && pathname === "/" ? "text-white scale-110" : "text-zinc-600 hover:text-zinc-400"
                    )}
                >
                    <Coins className="w-5 h-5 transition-transform group-active:scale-75" />
                    {activeTab === "wallet" && pathname === "/" && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white] animate-pulse" />
                    )}
                </Button>

                <div className={clsx(
                    "flex items-center justify-center rounded-[1.2rem] h-12 w-12 transition-all duration-500 relative group",
                    pathname === "/profile" ? "scale-110" : "grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
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
