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
        <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
                placeholder="Search users..."
                className="pl-9 bg-gray-100 border-none focus-visible:ring-1 focus-visible:ring-gray-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
    );
}
