"use client";

import { createContext, useContext, useState, ReactNode } from "react";
export type MobileTab = "chats" | "discover" | "wallet";

type NavContextType = {
    activeTab: MobileTab;
    setActiveTab: (tab: MobileTab) => void;
};

const NavContext = createContext<NavContextType | undefined>(undefined);

export function NavProvider({ children }: { children: ReactNode }) {
    const [activeTab, setActiveTab] = useState<MobileTab>("discover");

    return (
        <NavContext.Provider value={{ activeTab, setActiveTab }}>
            {children}
        </NavContext.Provider>
    );
}

export function useNav() {
    const context = useContext(NavContext);
    if (!context) throw new Error("useNav must be used within a NavProvider");
    return context;
}
