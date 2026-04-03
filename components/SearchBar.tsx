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
                <Search className="h-4 w-4 text-zinc-500 group-focus-within:text-white transition-colors" />
            </div>
            <Input
                placeholder="Search..."
                className="pl-11 h-11 bg-[#0e0e0e]/60 border-white/[0.04] focus-visible:border-white/[0.12] focus-visible:ring-0 focus-visible:bg-[#111111]/80 rounded-xl text-[13px] font-medium tracking-tight placeholder:text-zinc-600 transition-all duration-300 shadow-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity -z-10 pointer-events-none duration-1000" />
        </div>
    );
}
