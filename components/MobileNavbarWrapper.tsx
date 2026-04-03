"use client";

import { useNav } from "@/context/NavContext";
import { MobileNavbar } from "./MobileNavbar";
import { usePathname } from "next/navigation";

export function MobileNavbarWrapper() {
    const { activeTab, setActiveTab } = useNav();
    const pathname = usePathname();

    // Only show on relevant routes (Home and Profile)
    const showNavbar = pathname === "/" || pathname === "/profile";

    if (!showNavbar) return null;

    return <MobileNavbar activeTab={activeTab} onTabChange={setActiveTab} />;
}
