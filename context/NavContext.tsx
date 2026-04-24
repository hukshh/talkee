"use client";

import { createContext, useContext, useState, ReactNode } from "react";
export type MobileTab = "chats" | "discover" | "wallet";

type NavContextType = {
    activeTab: MobileTab;
    setActiveTab: (tab: MobileTab) => void;
    showLanding: boolean;
    setShowLanding: (show: boolean) => void;
};

const NavContext = createContext<NavContextType | undefined>(undefined);

export function NavProvider({ children }: { children: ReactNode }) {
    const [activeTab, setActiveTab] = useState<MobileTab>("discover");
    const [showLanding, setShowLanding] = useState(false);

    return (
        <NavContext.Provider value={{ activeTab, setActiveTab, showLanding, setShowLanding }}>
            {children}
        </NavContext.Provider>
    );
}

export function useNav() {
    const context = useContext(NavContext);
    if (!context) throw new Error("useNav must be used within a NavProvider");
    return context;
}
