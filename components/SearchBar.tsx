"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function SearchBar({
    searchQuery,
    setSearchQuery,
}: {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}) {
    return (
        <div className="relative w-full group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-transform group-focus-within:scale-110 duration-500">
                <Search className="h-4.5 w-4.5 text-zinc-600 group-focus-within:text-white transition-colors" />
            </div>
            <Input
                placeholder="Search..."
                className="pl-12 h-12 glass-premium border-white/[0.04] focus-visible:border-white/[0.15] focus-visible:ring-0 focus-visible:bg-white/[0.06] rounded-2xl text-[14px] font-bold tracking-tight placeholder:text-zinc-700 transition-all duration-500 shadow-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            {/* Focus Glow Effect */}
            <div className="absolute inset-0 rounded-[1.25rem] bg-blue-500/5 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity -z-10 pointer-events-none duration-1000" />
        </div>
    );
}
